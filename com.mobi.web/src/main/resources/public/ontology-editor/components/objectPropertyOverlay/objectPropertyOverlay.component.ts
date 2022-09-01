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
import {cloneDeep, includes} from 'lodash';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Observable } from 'rxjs';
import { debounceTime, startWith, map } from 'rxjs/operators';

import { ObjectPropertyBlockComponent } from '../objectPropertyBlock/objectPropertyBlock.component';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';

import './objectPropertyOverlay.component.scss';

/**
 * @class ontology-editor.ObjectPropertyOverlayComponent
 *
 * A component that creates content for a modal that adds an object property value to the
 * {@link shared.OntologyStateService#listItem selected individual}. The form in the modal contains a `mat-autocomplete`
 * of all the object properties in the ontology and an {@link ontology-editor.IriSelectOntologyComponent} of all the
 * valid individuals for the object property value based on the range of the selected property. 
 *
 * @param {Function} close A function that closes the modal
 * @param {Function} dismiss A function that dismisses the modal
 */
@Component({
    templateUrl: './objectPropertyOverlay.component.html',
    selector: 'object-property-overlay'
})
export class ObjectPropertyOverlayComponent implements OnInit {
    individuals = {};
    valueList;
    objectPropertyForm = this.fb.group({
        propertySelect: [{ value: '', disabled: false }],
        propertyValue: [{ value: '', disabled: false }]
    })
    filteredIriList: Observable<[]>;
    constructor(public os:OntologyStateService,
                @Inject('utilService') private util,
                @Inject('propertyManagerService') private pm,
                private fb: FormBuilder,
                private dialogRef: MatDialogRef<ObjectPropertyBlockComponent>,
                @Inject(MAT_DIALOG_DATA) public data: {
                            editingProperty: boolean,
                            propertySelect: string,
                            propertyValue: string,
                            propertyIndex: number
                        }){}

    ngOnInit(): void {
        this.valueList = this.os.getSelectList(Object.keys(this.os.listItem.objectProperties.iris), '', iri => this.os.getEntityNameByListItem(iri));
        this.filteredIriList = this.objectPropertyForm.controls.propertySelect.valueChanges
            .pipe(
                debounceTime(500),
                startWith<string>(''),
                map(val => {
                    if (!this.valueList) {
                        return [];
                    }
                    const searchText = typeof val === 'string' ?
                        val : val ? val : '';
                    const filtereList = this.valueList.filter(iri => includes(this.os.getEntityNameByListItem(iri).toLowerCase(), searchText.toLowerCase()));
                    filtereList.sort((val1, val2) => this.os.getEntityNameByListItem(val1).localeCompare(this.os.getEntityNameByListItem(val2)));
                    return filtereList;
                })
            );
        this.individuals = cloneDeep(this.os.listItem.individuals.iris);
        delete this.individuals[this.os.getActiveEntityIRI()];
    }
    addProperty(): void {
        const select = this.objectPropertyForm.controls.propertySelect.value;
        const value = this.objectPropertyForm.controls.propertyValue.value;
        const valueObj = {'@id': value};
        const added = this.pm.addId(this.os.listItem.selected, select, value);

        if (added) {
            this.os.addToAdditions(
                this.os.listItem.versionedRdfRecord.recordId,
                this.util.createJson(
                    this.os.listItem.selected['@id'],
                    select,
                    valueObj
                )
            );
            this.os.saveCurrentChanges().subscribe();
        } else {
            this.util.createWarningToast('Duplicate property values not allowed');
        }
        const types = this.os.listItem.selected['@type'];
        if (this.os.containsDerivedConcept(types) || this.os.containsDerivedConceptScheme(types)) {
            this.os.updateVocabularyHierarchies(select, [valueObj]);
        }
        this.dialogRef.close();
    }
    cancel(): void {
        this.dialogRef.close();
    }
}