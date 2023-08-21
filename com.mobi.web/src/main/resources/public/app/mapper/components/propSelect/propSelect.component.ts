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
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { includes, groupBy } from 'lodash';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

import { MappingProperty } from '../../../shared/models/mappingProperty.interface';

interface PropertyGroup {
    ontologyId: string,
    properties: MappingProperty[]
}

/**
 * @class mapper.PropSelectComponent
 *
 * A component which creates a `mat-autocomplete` with the passed property list attached to a `prop` control on the
 * provided parent FormGroup and binds the selected property object to `selectedProp`.
 *
 * @param {boolean} isReadOnly Whether to make the field readonly
 * @param {FormGroup} parentForm A FormGroup with a `prop` control
 * @param {MappingProperty} selectedProp The currently selected property object
 * @param {MappingProperty[]} properties An array of property objects
 */
@Component({
    selector: 'prop-select',
    templateUrl: './propSelect.component.html'
})
export class PropSelectComponent implements OnInit {
    private _selectedProp:MappingProperty;
    @Input() isReadOnly: boolean;
    @Input() parentForm: UntypedFormGroup;
    @Input() properties: MappingProperty[];
    @Input() set selectedProp (value: MappingProperty) {
        this._selectedProp = value;
       if (this.parentForm.get('prop').disabled) {
           this.parentForm.controls.prop.disable();
       } else {
        this.parentForm.controls.prop.enable();
       }
    }

    @Output() selectedPropChange = new EventEmitter<MappingProperty>();

    filteredProperties: Observable<PropertyGroup[]>;

    constructor() {}

    ngOnInit(): void {
        this.filteredProperties = this.parentForm.controls.prop.valueChanges
            .pipe(
                startWith<string | MappingProperty>(''),
                map(val => this.filter(val))
            );
    }
    filter(val: string | MappingProperty): PropertyGroup[] {
        const searchText = typeof val === 'string' ?
        val :
        val ?
            val.name :
            '';
        if (!this.properties) {
            return [];
        }
        const filtered = this.properties.filter(mappingProperty => includes(mappingProperty.name.toLowerCase(), searchText.toLowerCase()));
        filtered.sort((mappingProperty1, mappingProperty2) => mappingProperty1.name.localeCompare(mappingProperty2.name));
        const grouped = groupBy(filtered, 'ontologyId');
        return Object.keys(grouped).map(ontologyId => ({
            ontologyId,
            properties: grouped[ontologyId]
        }));
    }
    getDisplayText(mappingProperty?: MappingProperty): string {
        return mappingProperty ? mappingProperty.name : '';
    }
    selectProp(event: MatAutocompleteSelectedEvent): void {
        this._selectedProp = event.option.value;
        this.selectedPropChange.emit(this._selectedProp);
    }
    public getSelectedProp () : MappingProperty{
        return this._selectedProp;
    }
}
