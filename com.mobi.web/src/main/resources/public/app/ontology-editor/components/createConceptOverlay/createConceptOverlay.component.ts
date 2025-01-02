/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';

import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { OWL, SKOS } from '../../../prefixes';
import { CamelCasePipe } from '../../../shared/pipes/camelCase.pipe';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { REGEX } from '../../../constants';
import { splitIRI } from '../../../shared/pipes/splitIRI.pipe';
import { noWhitespaceValidator } from '../../../shared/validators/noWhitespace.validator';
import { addLanguageToAnnotations } from '../../../shared/utility';

/**
 * @class ontology-editor.CreateConceptOverlayComponent
 *
 * A component that creates content for a modal that creates a concept in the current
 * {@link shared.OntologyStateService#listItem selected ontology/vocabulary}. The form in the modal contains a text
 * input for the concept name (which populates the {@link ontology-editor.StaticIriComponent IRI}), an
 * {@link ontology-editor.AdvancedLanguageSelectComponent}, and an {@link ontology-editor.IriSelectOntologyComponent}
 * for the concept scheme the concept is "top" of. Meant to be used in conjunction with the `MatDialog` service.
 */
@Component({
    selector: 'create-concept-overlay',
    templateUrl: './createConceptOverlay.component.html'
})
export class CreateConceptOverlayComponent implements OnInit {
    conceptSchemes: {[key: string]: string} = {};
    iriHasChanged = false;
    duplicateCheck = true;
    iriPattern = REGEX.IRI;

    hasSchemes = false;
    selectedSchemes: string[] = [];

    createForm = this.fb.group({
        iri: ['', [Validators.required, Validators.pattern(this.iriPattern), this.os.getDuplicateValidator()]],
        title: ['', [ Validators.required, noWhitespaceValidator()]],
        language: ['']
    });
    
    constructor(private fb: UntypedFormBuilder,
        private dialogRef: MatDialogRef<CreateConceptOverlayComponent>, 
        public os: OntologyStateService,  
        private camelCasePipe: CamelCasePipe) {}

    ngOnInit(): void {
        this.createForm.controls.iri.setValue(this.os.getDefaultPrefix());
        this.createForm.controls.title.valueChanges.subscribe(newVal => this.nameChanged(newVal));
        this.hasSchemes = !!Object.keys(this.os.listItem.conceptSchemes.iris).length;
        if (this.os.listItem?.conceptSchemes?.iris) {
            this.conceptSchemes = this.os.listItem.conceptSchemes.iris;
        }
    }
    nameChanged(newName: string): void {
        if (!this.iriHasChanged) {
            const split = splitIRI(this.createForm.controls.iri.value);
            this.createForm.controls.iri.setValue(split.begin + split.then + this.camelCasePipe.transform(newName, 'class'));
        }
    }
    onEdit(iriBegin: string, iriThen: string, iriEnd: string): void  {
        this.iriHasChanged = true;
        this.createForm.controls.iri.setValue(iriBegin + iriThen + iriEnd);
        this.os.setCommonIriParts(iriBegin, iriThen);
    }
    get concept(): JSONLDObject {
        const concept = {
            '@id': this.createForm.controls.iri.value,
            '@type': [`${OWL}NamedIndividual`, `${SKOS}Concept`],
            [`${SKOS}prefLabel`]: [{
                '@value': this.createForm.controls.title.value
            }]

        };
        addLanguageToAnnotations(concept, this.createForm.controls.language.value);
        return concept;
    }
    create(): void  {
        this.duplicateCheck = false;
        const concept = this.concept;
        // add the entity to the ontology
        this.os.addEntity(concept);
        // update relevant lists
        this.os.listItem.concepts.iris[concept['@id']] = this.os.listItem.ontologyId;
        this.os.addConcept(concept);
        this.os.addToAdditions(this.os.listItem.versionedRdfRecord.recordId, concept);
        this.os.addIndividual(concept);
        if (this.selectedSchemes.length) {
            this.selectedSchemes.forEach(scheme => {
                this.os.addToAdditions(this.os.listItem.versionedRdfRecord.recordId, {'@id': scheme, [`${SKOS}hasTopConcept`]: [{'@id': concept['@id']}]});
                this.os.addEntityToHierarchy(this.os.listItem.conceptSchemes, concept['@id'], scheme);
            });
            this.os.listItem.conceptSchemes.flat = this.os.flattenHierarchy(this.os.listItem.conceptSchemes);
        }
        // Save the changes to the ontology
        this.os.saveCurrentChanges().subscribe(() => {
            // Open snackbar
            this.os.openSnackbar(concept['@id']);
        }, () => {});
        // hide the overlay
        this.dialogRef.close();
    }
}
