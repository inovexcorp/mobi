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
import { unset } from 'lodash';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material';

import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { DCTERMS, OWL } from '../../../prefixes';
import { CamelCasePipe } from '../../../shared/pipes/camelCase.pipe';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { REGEX } from '../../../constants';
import { SplitIRIPipe } from '../../../shared/pipes/splitIRI.pipe';

/**
 * @class ontology-editor.CreateAnnotationPropertyOverlayComponent
 *
 * A component that creates content for a modal that creates an annotation property in the current
 * {@link shared.OntologyStateService#listItem selected ontology}. The form in the modal contains a text input for the
 * property name (which populates the {@link ontology-editor.StaticIriComponent IRI}), a field for the property
 * description, and an {@link ontology-editor.AdvancedLanguageSelectComponent}. Meant to be used in conjunction with the
 * `MatDialog` service.
 */
@Component({
    selector: 'create-annotation-property-overlay',
    templateUrl: './createAnnotationPropertyOverlay.component.html'
})
export class CreateAnnotationPropertyOverlayComponent implements OnInit {
    iriHasChanged = false;
    duplicateCheck = true;
    iriPattern = REGEX.IRI;

    createForm = this.fb.group({
        iri: ['', [Validators.required, Validators.pattern(this.iriPattern)]], // has prefix
        title: ['', [ Validators.required]], 
        description: [''],
        language: ['']
    });
    
    constructor(private fb: FormBuilder,
        private dialogRef: MatDialogRef<CreateAnnotationPropertyOverlayComponent>, 
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
            this.createForm.controls.iri.setValue(split.begin + split.then + this.camelCasePipe.transform(newName, 'property'));
        }
    }
    onEdit(iriBegin: string, iriThen: string, iriEnd: string): void  {
        this.iriHasChanged = true;
        this.createForm.controls.iri.setValue(iriBegin + iriThen + iriEnd);
        this.os.setCommonIriParts(iriBegin, iriThen);
    }
    get property(): JSONLDObject{
        const property = {
            '@id': this.createForm.controls.iri.value,
            '@type': [OWL + 'AnnotationProperty'],
            [DCTERMS + 'title']: [{
                '@value': this.createForm.controls.title.value
            }],
            [DCTERMS + 'description']: [{
                '@value': this.createForm.controls.description.value
            }]
        };
        if (property[DCTERMS + 'description'][0]['@value'] === '') {
            unset(property, DCTERMS + 'description');
        }
        this.os.addLanguageToNewEntity(property, this.createForm.controls.language.value);
        return property;
    }
    create(): void {
        this.duplicateCheck = false;
        const property = this.property;
        this.os.updatePropertyIcon(property);
        // add the entity to the ontology
        this.os.addEntity(property);
        // update lists
        this.os.listItem.annotations.iris[property['@id']] = this.os.listItem.ontologyId;
        this.os.listItem.annotations.flat = this.os.flattenHierarchy(this.os.listItem.annotations);
        // Update InProgressCommit
        this.os.addToAdditions(this.os.listItem.versionedRdfRecord.recordId, property);
        // Save the changes to the ontology
        this.os.saveCurrentChanges().subscribe(() => {
            // Open snackbar
            this.os.openSnackbar(property['@id']);
        }, () => {});
        // hide the overlay
        this.dialogRef.close();
    }
}
