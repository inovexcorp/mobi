/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
 * %%
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */
import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material';

import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { DCTERMS, OWL, SKOS } from '../../../prefixes';
import { CamelCasePipe } from '../../../shared/pipes/camelCase.pipe';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { REGEX } from '../../../constants';
import { SplitIRIPipe } from '../../../shared/pipes/splitIRI.pipe';
import { noWhitespaceValidator } from '../../../shared/validators/noWhitespace.validator';

/**
 * @class ontology-editor.CreateConceptSchemeOverlayComponent
 *
 * A component that creates content for a modal that creates a concept scheme in the current
 * {@link shared.OntologyStateService#listItem selected ontology/vocabulary}. The form in the modal contains a text
 * input for the concept scheme name (which populates the {@link ontology-editor.StaticIriComponent IRI}), an
 * {@link ontology-editor.AdvancedLanguageSelectComponent}, and a {@link ontology-editor.IriSelectOntologyComponent} for
 * the top concepts. Meant to be used in conjunction with the `MatDialog` service.
 */
@Component({
    selector: 'create-concept-scheme-overlay',
    templateUrl: './createConceptSchemeOverlay.component.html'
})
export class CreateConceptSchemeOverlayComponent implements OnInit {
    iriHasChanged = false;
    duplicateCheck = true;
    iriPattern = REGEX.IRI;
    
    hasConcepts = false;
    selectedConcepts: string[] = [];

    createForm = this.fb.group({
        iri: ['', [Validators.required, Validators.pattern(this.iriPattern), this.os.getDuplicateValidator()]],
        title: ['', [ Validators.required, noWhitespaceValidator()]],
        description: [''],
        language: ['']
    });

    constructor(private fb: FormBuilder,
        private dialogRef: MatDialogRef<CreateConceptSchemeOverlayComponent>,
        public os: OntologyStateService,
        private camelCasePipe: CamelCasePipe,
        private splitIRIPipe: SplitIRIPipe) {}

    ngOnInit(): void {
        this.createForm.controls.iri.setValue(this.os.getDefaultPrefix());
        this.createForm.controls.title.valueChanges.subscribe(newVal => this.nameChanged(newVal));
        this.hasConcepts = !!Object.keys(this.os.listItem.concepts.iris).length;
    }
    nameChanged(newName: string): void {
        if (!this.iriHasChanged) {
            const split = this.splitIRIPipe.transform(this.createForm.controls.iri.value);
            this.createForm.controls.iri.setValue(split.begin + split.then + this.camelCasePipe.transform(newName, 'class'));
        }
    }
    onEdit(iriBegin: string, iriThen: string, iriEnd: string): void  {
        this.iriHasChanged = true;
        this.createForm.controls.iri.setValue(iriBegin + iriThen + iriEnd);
        this.os.setCommonIriParts(iriBegin, iriThen);
    }
    get scheme(): JSONLDObject{
        const scheme = {
            '@id': this.createForm.controls.iri.value,
            '@type': [OWL + 'NamedIndividual', SKOS + 'ConceptScheme'],
            [DCTERMS + 'title']: [{
                '@value': this.createForm.controls.title.value
            }]
        };
        if (this.selectedConcepts.length) {
            scheme[SKOS + 'hasTopConcept'] = this.selectedConcepts.map(iri => ({'@id': iri}));
        }
        this.os.addLanguageToNewEntity(scheme, this.createForm.controls.language.value);
        return scheme;
    }
    create(): void  {
        this.duplicateCheck = false;
        const scheme = this.scheme;
        // add the entity to the ontology
        this.os.addEntity(scheme);
        // update relevant lists
        this.os.listItem.conceptSchemes.iris[scheme['@id']] = this.os.listItem.ontologyId;
        // Add top this.concepts to hierarchy if they exist
        this.selectedConcepts.forEach(concept => {
            this.os.addEntityToHierarchy(this.os.listItem.conceptSchemes, concept, scheme['@id']);
        });
        this.os.listItem.conceptSchemes.flat = this.os.flattenHierarchy(this.os.listItem.conceptSchemes);
        // Update additions
        this.os.addToAdditions(this.os.listItem.versionedRdfRecord.recordId, scheme);
        // Update individual hierarchy
        this.os.addIndividual(scheme);
        // Save the changes to the ontology
        this.os.saveCurrentChanges().subscribe(() => {
            // Open snackbar
            this.os.openSnackbar(scheme['@id']);
        }, () => {});
        // hide the overlay
        this.dialogRef.close();
    }
}
