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
import {  MatDialogRef } from '@angular/material';
import { unset, map } from 'lodash';

import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { DCTERMS, OWL, RDFS } from '../../../prefixes';
import { CamelCasePipe } from '../../../shared/pipes/camelCase.pipe';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { REGEX } from '../../../constants';
import { SplitIRIPipe } from '../../../shared/pipes/splitIRI.pipe';
import { JSONLDId } from '../../../shared/models/JSONLDId.interface';

interface CharacteristicI {
    typeIRI: string;
    displayText: string;
}

/**
 * @class ontology-editor.CreateDataPropertyOverlay
 *
 * A component that creates content for a modal that creates a data property in the current
 * {@link shared.OntologyStateService#listItem selected ontology}. The form in the modal contains a text input for the
 * property name (which populates the {@link ontology-editor.StaticIriComponent IRI}), a field for the property
 * description, an {@link ontology-editor.AdvancedLanguageSelectComponent}, `mat-checkbox` elements for the property
 * characteristics, an {@link ontology-editor.IriSelectOntologyComponent} for the domain, an
 * {@link ontology-editor.IriSelectOntologyComponent} for the range, and a
 * {@link ontology-editor.SuperPropertySelectComponent}. Meant to be used in conjunction with the `MatDialog` service.
 */
@Component({
    selector: 'create-data-property-overlay',
    templateUrl: './createDataPropertyOverlay.component.html'
})
export class CreateDataPropertyOverlayComponent implements OnInit {
    characteristics: CharacteristicI[] = [
        {
            typeIRI: OWL + 'FunctionalProperty',
            displayText: 'Functional Property',
        }
    ];
    iriHasChanged = false;
    duplicateCheck = true;
    iriPattern = REGEX.IRI;

    selectedDomains: string[] = [];
    selectedRanges: string[] = [];
    selectedSubProperties: JSONLDId[] = [];
   
    createForm = this.fb.group({
        iri: ['', [Validators.required, Validators.pattern(this.iriPattern)]],
        title: ['', [ Validators.required]],
        description: [''],
        language: [''],
        characteristics: this.fb.array(this.characteristics.map(() => false))
    });
    
    constructor(private fb: FormBuilder,
        private dialogRef: MatDialogRef<CreateDataPropertyOverlayComponent>, 
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
    get property(): JSONLDObject {
        const property = {
            '@id': this.createForm.controls.iri.value,
            '@type': [OWL + 'DatatypeProperty'],
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
        this.createForm.controls.characteristics.value.forEach((val, index) => {
            if (val) {
                property['@type'].push(this.characteristics[index].typeIRI);
            }
        });
        this.os.addLanguageToNewEntity(property, this.createForm.controls.language.value);
        if (this.selectedDomains.length) {
            property[RDFS + 'domain'] = this.selectedDomains.map(iri => ({'@id': iri}));
        }
        if (this.selectedRanges.length) {
            property[RDFS + 'range'] =this.selectedRanges.map(iri => ({'@id': iri}));
        }
        if (this.selectedSubProperties.length) {
            property[RDFS + 'subPropertyOf'] = this.selectedSubProperties;
        }
        return property;
    }
    create(): void  {
        this.duplicateCheck = false;
        const property = this.property;
        this.os.updatePropertyIcon(property);
        this.os.handleNewProperty(property);
        // add the entity to the ontology
        this.os.addEntity(property);
        // update lists
        this.updateLists(property);
        this.os.listItem.flatEverythingTree = this.os.createFlatEverythingTree(this.os.listItem);
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
    updateLists(property: JSONLDObject): void  {
        this.os.listItem.dataProperties.iris[property['@id']] = this.os.listItem.ontologyId;
        if (this.selectedSubProperties.length) {
            this.os.setSuperProperties(property['@id'], map(this.selectedSubProperties, '@id'), 'dataProperties');
        } else {
            this.os.listItem.dataProperties.flat = this.os.flattenHierarchy(this.os.listItem.dataProperties);
        }
    }
}