/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { map, startWith } from 'rxjs/operators';
import { Observable } from 'rxjs';

import { XSD, RDF } from '../../../prefixes';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { ToastService } from '../../../shared/services/toast.service';
import { PropertyManagerService } from '../../../shared/services/propertyManager.service';
import { datatype } from '../../../shared/validators/datatype.validator';
import { createJson } from '../../../shared/utility';

interface PropGrouping {
    namespace: string,
    options: PropOption[]
}

interface PropOption {
    item: string,
    name: string
}

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
    dataProperties: string[] = [];
    dataPropertiesFiltered: Observable<PropGrouping[]>;
    dataPropertyRanges: {[key: string]: string} = {}; 
    propertyType: string[] = []; // Array but only expect one value
    propertyForm = this.fb.group({
        propertySelect: ['', Validators.required],
        propertyValue: ['', [Validators.required, datatype(() => this.propertyType[0])]],
        language: ['']
    })
    
    constructor(private dialogRef: MatDialogRef<DatatypePropertyOverlayComponent>,
                public os: OntologyStateService,
                private pm: PropertyManagerService,
                private fb: UntypedFormBuilder,
                private toast: ToastService,
                @Inject(MAT_DIALOG_DATA) public data: { editingProperty: boolean,
                    propertySelect: string,
                    propertyValue: string, 
                    propertyType: string, 
                    propertyIndex: number, 
                    propertyLanguage: string
                }) {}

    ngOnInit(): void {
        this.dataProperties = Object.keys(this.os.listItem.dataProperties.iris);
        this.dataPropertiesFiltered =  this.propertyForm.controls.propertySelect.valueChanges.pipe(
            startWith(''),
            map(value => this.filter(value || ''))
        );
        if (this.data.editingProperty) {
            this.propertyForm.controls.propertySelect.setValue(this.data.propertySelect);
            this.propertyForm.controls.propertySelect.disable();
            this.propertyForm.controls.propertyValue.setValue(this.data.propertyValue);
            this.propertyForm.controls.language.setValue(this.data.propertyLanguage);
            this.propertyType = [this.data.propertyType];
        } else {
            // Should already be enabled on startup, mostly here for test purposes
            this.propertyForm.controls.propertySelect.enable();
        }
        if (this.os.listItem?.dataPropertyRange) {
            this.dataPropertyRanges = this.os.listItem.dataPropertyRange;
        }
    }
    filter(searchText: string): PropGrouping[] {
        if (!this.dataProperties || !this.dataProperties.length) {
            return [];
        }
        return this.os.getGroupedSelectList(this.dataProperties, searchText, iri => this.os.getEntityName(iri));
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
        const lang = this.getLang(this.propertyForm.controls.language.value);
        const realType = this.getType(lang, this.propertyType[0]);
        const added = this.pm.addValue(this.os.listItem.selected, selectedValue, propertyValue, realType, lang);
        if (added) {
            this.os.addToAdditions(this.os.listItem.versionedRdfRecord.recordId, createJson(this.os.listItem.selected['@id'], selectedValue, this.pm.createValueObj(propertyValue, realType, lang)));
            this.os.saveCurrentChanges().subscribe();
        } else {
            this.toast.createWarningToast('Duplicate property values not allowed');
        }
        this.dialogRef.close();
    }
    editProperty(): void {
        const selectedValue = this.propertyForm.controls.propertySelect.value;
        const propertyValue = this.propertyForm.controls.propertyValue.value;
        const lang = this.getLang(this.propertyForm.controls.language.value);
        const realType = this.getType(lang, this.propertyType[0]);
        const oldObj = cloneDeep(this.os.listItem.selected[selectedValue][this.data.propertyIndex]);
        const edited = this.pm.editValue(this.os.listItem.selected, selectedValue, this.data.propertyIndex, propertyValue, realType, lang);
        if (edited) {
            this.os.addToDeletions(this.os.listItem.versionedRdfRecord.recordId, createJson(this.os.listItem.selected['@id'], selectedValue, oldObj));
            this.os.addToAdditions(this.os.listItem.versionedRdfRecord.recordId, createJson(this.os.listItem.selected['@id'], selectedValue, this.pm.createValueObj(propertyValue, realType, lang)));
            this.os.saveCurrentChanges().subscribe();
        } else {
            this.toast.createWarningToast('Duplicate property values not allowed');
        }
        this.dialogRef.close();
    }
    isLangString(): boolean {
        return `${RDF}langString` === (this.propertyType ? this.propertyType[0]: '');
    }
    getLang(language: string): string {
        return language && this.isLangString() ? language : '';
    }
    getType(language: string, type: string):string {
        return language ? '' : type || `${XSD}string`;
    }
    getName(val: string): string {
        return val ? this.os.getEntityName(val) : '';
    }
    validateValue(newValue: string[]): void {
        this.propertyType = newValue;
        this.propertyForm.controls.propertyValue.updateValueAndValidity();
    }
}
