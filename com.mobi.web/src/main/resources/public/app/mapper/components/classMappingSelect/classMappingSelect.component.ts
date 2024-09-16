/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2024 iNovex Information Systems, Inc.
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

import { Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, ViewChild } from '@angular/core';
import { UntypedFormControl, Validators } from '@angular/forms';
import { MatAutocompleteSelectedEvent, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatDialog } from '@angular/material/dialog';
import { includes } from 'lodash';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

import { ConfirmModalComponent } from '../../../shared/components/confirmModal/confirmModal.component';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { getDctermsValue, getEntityName } from '../../../shared/utility';

/**
 * @class mapper.ClassMappingSelectComponent
 *
 * A component that creates a div with `mat-autocomplete` containing all the ClassMappings in the passed list. The
 * selected value is bound to `classMappingId`.
 *
 * @param {string} classMappingId The id of the selected ClassMapping.
 * @param {JSONLDObject[]} classMappings A list of ClassMapping JSON-LD objects
 */
@Component({
    selector: 'class-mapping-select',
    templateUrl: './classMappingSelect.component.html'
})
export class ClassMappingSelectComponent implements OnInit, OnChanges {

    @ViewChild(MatAutocompleteTrigger, { static: true }) autocompleteTrigger: MatAutocompleteTrigger;
    @ViewChild('textInput', { static: true }) textInput: ElementRef;

    classMappingControl: UntypedFormControl = new UntypedFormControl({value: '', disabled: true}, Validators.required)

    @Input() classMappings: JSONLDObject[] = [];
    @Input() classMappingId: string;

    @Output() classMappingIdChange = new EventEmitter<string>();
    @Output() deleteClassMapping = new EventEmitter<JSONLDObject>();

    filteredClassMappings: Observable<JSONLDObject[]>;

    constructor(private dialog: MatDialog) {}
    
    ngOnInit(): void {
        this.filteredClassMappings = this.classMappingControl.valueChanges
        .pipe(
            startWith<string | JSONLDObject>(''),
            map(val => this.filter(val))
        );
    }
    ngOnChanges(): void {
        if (!this.classMappings || !this.classMappings.length) {
            this.classMappingControl.disable();
        } else {
            this.classMappingControl.enable();
        }
        this.classMappingControl.setValue(this.classMappings.find(classMapping => classMapping['@id'] === this.classMappingId));
    }
    filter(val: string | JSONLDObject): JSONLDObject[] {
        const searchText = typeof val === 'string' ?
            val :
            val ?
                this.getTitle(val) :
                '';
        if (!this.classMappings) {
            return [];
        }
        const filteredClassMappings: JSONLDObject[] = this.classMappings.filter(classMapping => includes(this.getTitle(classMapping).toLowerCase(), searchText.toLowerCase()));
        filteredClassMappings.sort((classMapping1, classMapping2) => this.getTitle(classMapping1).localeCompare(this.getTitle(classMapping2)));
        return filteredClassMappings;
    }
    getTitle(classMapping: JSONLDObject): string {
        return getEntityName(classMapping) || getDctermsValue(classMapping, 'title');
    }
    showClassMappings(): void{
        //Resets the form control, marking it pristine and untouched , and resetting the value.
        this.classMappingControl.reset();
    }
    selectClassMapping(event: MatAutocompleteSelectedEvent): void {
        this.classMappingId = event.option.value ? event.option.value['@id'] : '';
        this.classMappingIdChange.emit(this.classMappingId);
    }
    confirmDelete(classMapping: JSONLDObject): void {
        this.autocompleteTrigger.closePanel();
        this.dialog.open(ConfirmModalComponent, {
            data: {
                content: `<p>Are you sure you want to delete <strong>${getDctermsValue(classMapping, 'title')}</strong>?</p><p class="form-text">Deleting a class will remove any properties that link to it.</p>`
            }
        }).afterClosed().subscribe((result: boolean) => {
            if (result) {
                this.deleteClassMapping.emit(classMapping);
                this.classMappingControl.updateValueAndValidity({ onlySelf: false, emitEvent: true });
            }
        });
    }
    close(): void {
        this.textInput.nativeElement.blur();
        if (this.classMappingId) {
            this.classMappingControl.setValue(this.classMappings.find(classMapping => classMapping['@id'] === this.classMappingId));
        } else {
            this.classMappingControl.setValue('');
        }
    }
}
