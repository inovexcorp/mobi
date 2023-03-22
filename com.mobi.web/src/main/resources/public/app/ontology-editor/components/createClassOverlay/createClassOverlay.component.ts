/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2023 iNovex Information Systems, Inc.
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
import { MatDialogRef } from '@angular/material/dialog';
import { unset, isEqual, map } from 'lodash';

import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { DCTERMS, OWL, RDFS } from '../../../prefixes';
import { CamelCasePipe } from '../../../shared/pipes/camelCase.pipe';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { REGEX } from '../../../constants';
import { SplitIRIPipe } from '../../../shared/pipes/splitIRI.pipe';
import { JSONLDId } from '../../../shared/models/JSONLDId.interface';
import { noWhitespaceValidator } from '../../../shared/validators/noWhitespace.validator';

/**
 * @class ontology-editor.CreateClassOverlayComponent
 *
 * A component that creates content for a modal that creates a class in the current
 * {@link shared.OntologyStateService#listItem selected ontology}. The form in the modal contains a text input for the
 * class name (which populates the {@link ontology-editor.StaticIriComponent IRI}), a field for the class description,
 * an {@link ontology-editor.AdvancedLanguageSelectComponent}, and a {@link ontology-editor.SuperClassSelectComponent}.
 * Meant to be used in conjunction with the `MatDialog` service.
 */
@Component({
    selector: 'create-class-overlay',
    templateUrl: './createClassOverlay.component.html',
})
export class CreateClassOverlayComponent implements OnInit {
    iriHasChanged = false;
    duplicateCheck = true;
    iriPattern = REGEX.IRI;

    selectedClasses: JSONLDId[] = [];
    
    createForm = this.fb.group({
        iri: ['', [Validators.required, Validators.pattern(this.iriPattern), this.os.getDuplicateValidator()]],
        title: ['', [ Validators.required, noWhitespaceValidator()]],
        description: [''],
        language: ['']
    });

    constructor(private fb: FormBuilder,
        private dialogRef: MatDialogRef<CreateClassOverlayComponent>, 
        public os: OntologyStateService, 
        private camelCasePipe: CamelCasePipe,
        private splitIRIPipe: SplitIRIPipe) {}

    ngOnInit(): void {
        this.createForm.controls.iri.setValue(this.os.getDefaultPrefix());
        this.createForm.controls.title.valueChanges.subscribe(newVal => this.nameChanged(newVal));
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
    get clazz(): JSONLDObject {
        const clazz = {
            '@id': this.createForm.controls.iri.value,
            '@type': [OWL + 'Class'],
            [DCTERMS + 'title']: [{
                '@value': this.createForm.controls.title.value
            }],
            [DCTERMS + 'description']: [{
                '@value': this.createForm.controls.description.value
            }]
        };
        if (isEqual(clazz[DCTERMS + 'description'][0]['@value'], '')) {
            unset(clazz, DCTERMS + 'description');
        }
        if (this.selectedClasses.length) {
            clazz[RDFS + 'subClassOf'] = this.selectedClasses;
        }
        this.os.addLanguageToNewEntity(clazz, this.createForm.controls.language.value);
        return clazz;
    }
    create(): void  {
        this.duplicateCheck = false;
        const clazz = this.clazz;
        // add the entity to the ontology
        this.os.addEntity(clazz);
        // update relevant lists
        this.os.addToClassIRIs(this.os.listItem, clazz['@id']);
        
        if (clazz[RDFS + 'subClassOf'] && clazz[RDFS + 'subClassOf'].length) {
            const superClassIds = map(clazz[RDFS + 'subClassOf'], '@id');
            if (this.os.containsDerivedConcept(superClassIds)) {
                this.os.listItem.derivedConcepts.push(clazz['@id']);
            } else if (this.os.containsDerivedConceptScheme(superClassIds)) {
                this.os.listItem.derivedConceptSchemes.push(clazz['@id']);
            }
            this.os.setSuperClasses(clazz['@id'], superClassIds);
        } else {
            this.os.listItem.classes.flat = this.os.flattenHierarchy(this.os.listItem.classes);
        }

        this.os.listItem.flatEverythingTree = this.os.createFlatEverythingTree(this.os.listItem);
        // Update InProgressCommit
        this.os.addToAdditions(this.os.listItem.versionedRdfRecord.recordId, clazz);
        // Save the changes to the ontology
        this.os.saveCurrentChanges().subscribe(() => {
            // Open snackbar
            this.os.openSnackbar(clazz['@id']);
        }, () => {});
        // hide the overlay
        this.dialogRef.close();
    }
}
