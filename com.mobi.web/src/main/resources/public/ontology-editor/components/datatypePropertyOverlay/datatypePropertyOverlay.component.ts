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
import { cloneDeep } from 'lodash';
import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { map, startWith } from 'rxjs/operators';
import { Observable } from 'rxjs';

import { XSD, RDF } from '../../../prefixes';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';

import './datatypePropertyOverlay.component.scss';

/**
 * @class ontology-editor.DatatypePropertyOverlayComponent
 *
 * A component that creates content for a modal that adds a data property value to the
 * {@link shared.OntologyStateService#listItem selected individual}. The form in the modal contains a `mat-autocomplete`
 * of all the data properties in the ontology, a field for the data property value, an
 * {@link ontology-editor.IriSelectOntologyComponent} for the datatype, and a {@link shared.LanguageSelectComponent}.
 * Meant to be used in conjunction with the `MatDialog` service.
 */
@Component({
    selector: 'datatype-property-overlay',
    templateUrl: './datatypePropertyOverlay.component.html'
})
export class DatatypePropertyOverlayComponent implements OnInit {
    dataProperties = [];
    dataPropertiesFiltered:Observable<any>;
    propertyForm = this.fb.group({
        propertySelect: ['', Validators.required],
        propertyValue: ['', Validators.required],
    })
    constructor(private dialogRef: MatDialogRef<DatatypePropertyOverlayComponent>,
                public os: OntologyStateService,
                @Inject('propertyManagerService') private pm,
                private fb: FormBuilder,
                @Inject('utilService') public util,
                @Inject(MAT_DIALOG_DATA) public data:  { editingProperty: boolean,
                    propertySelect: string,
                    propertyValue: string, 
                    propertyType: string, 
                    propertyIndex: number, 
                    propertyLanguage: string
                }){}

    ngOnInit(): void {
        this.dataProperties = Object.keys(this.os.listItem.dataProperties.iris);
        this.dataPropertiesFiltered =  this.propertyForm.controls.propertySelect.valueChanges.pipe(
            startWith(''),
            map(value => this.filter(value))
        );
        if (this.data.editingProperty) {
            this.propertyForm.controls.propertySelect.setValue(this.data.propertySelect);
            this.propertyForm.controls.propertyValue.setValue(this.data.propertyValue);
        }
    }
    filter(val: string) {
        return this.dataProperties.filter(prop => prop.toLowerCase().includes(val.toLowerCase()))
            .sort(prop => prop.orderByEntityName());
    }

    isDisabled(): boolean {
        let isDisabled = this.propertyForm.invalid || !this.data.propertyValue;
        if (!this.data.editingProperty) {
            isDisabled = isDisabled || this.data.propertySelect === undefined;
        }
        return isDisabled;
    }
    submit(): void {
        if (this.data.editingProperty) {
            this.editProperty();
        } else {
            this.addProperty();
        }
    }
    addProperty (): void {
        const selectedValue = this.propertyForm.controls.propertySelect.value;
        const propertyValue = this.propertyForm.controls.propertyValue.value;
        const lang = this.getLang(this.data.propertyLanguage);
        const realType = this.getType(lang, this.data.propertyType);
        const added = this.pm.addValue(this.os.listItem.selected, selectedValue, propertyValue, realType, lang);
        if (added) {
            this.os.addToAdditions(this.os.listItem.versionedRdfRecord.recordId, this.util.createJson(this.os.listItem.selected['@id'], selectedValue, this.pm.createValueObj(propertyValue, realType, lang)));
            this.os.saveCurrentChanges().subscribe();
        } else {
            this.util.createWarningToast('Duplicate property values not allowed');
        }
        this.dialogRef.close();
    }
    editProperty(): void {
        const selectedValue = this.propertyForm.controls.propertySelect.value;
        const propertyValue = this.propertyForm.controls.propertyValue.value;
        const lang = this.getLang(this.data.propertyLanguage);
        const realType = this.getType(lang, this.data.propertyType);
        const oldObj = cloneDeep(this.os.listItem.selected[selectedValue][this.data.propertyIndex]);
        const edited = this.pm.editValue(this.os.listItem.selected, selectedValue, this.data.propertyIndex, propertyValue, realType, lang);
        if (edited) {
            this.os.addToDeletions(this.os.listItem.versionedRdfRecord.recordId, this.util.createJson(this.os.listItem.selected['@id'], selectedValue, oldObj));
            this.os.addToAdditions(this.os.listItem.versionedRdfRecord.recordId, this.util.createJson(this.os.listItem.selected['@id'], selectedValue, this.pm.createValueObj(propertyValue, realType, lang)));
            this.os.saveCurrentChanges().subscribe();
        } else {
            this.util.createWarningToast('Duplicate property values not allowed');
        }
        this.dialogRef.close();
    }
    isLangString(): boolean {
        return RDF + 'langString' === this.data.propertyType;
    }
    orderByEntityName(iri: string): string {
        return this.os.getEntityNameByListItem(iri);
    }
    getType(language: string, type: string):string {
        return language ? '' : type || XSD + 'string';
    }
    getLang(language: string): string {
        return language && this.isLangString() ? language : '';
    }
}