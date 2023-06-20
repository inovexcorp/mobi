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
import { debounceTime, map, startWith } from 'rxjs/operators';

import { MappingClass } from '../../../shared/models/mappingClass.interface';

interface ClassGroup {
    ontologyId: string,
    classes: MappingClass[]
}

/**
 * @class mapper.ClassSelectComponent
 *
 * A component which creates a `mat-autocomplete` with the passed class list attached to a `class` control on the
 * provided parent FormGroup and binds the selected class object to `selectedClass`.
 * 
 * @param {FormGroup} parentForm A FormGroup with a `class` control
 * @param {MappingClass} selectedClass The currently selected class object
 * @param {MappingClass[]} classes An array of class objects
 */
@Component({
    selector: 'class-select',
    templateUrl: './classSelect.component.html'
})
export class ClassSelectComponent implements OnInit {
    @Input() parentForm: UntypedFormGroup;
    @Input() classes: MappingClass[];
    @Input() selectedClass: MappingClass;

    @Output() selectedClassChange = new EventEmitter<MappingClass>();
    
    filteredClasses: Observable<ClassGroup[]>;

    constructor() {}

    ngOnInit(): void {
        this.filteredClasses = this.parentForm.controls.class.valueChanges
            .pipe(
                debounceTime(500),
                startWith<string | MappingClass>(''),
                map(val => this.filter(val)),
            );
    }
    filter(val: string | MappingClass): ClassGroup[] {
        const searchText = typeof val === 'string' ?
            val :
            val ?
                val.name :
                '';
        if (!this.classes) {
            return [];
        }
        const filtered = this.classes.filter(mappingClass => includes(mappingClass.name.toLowerCase(), searchText.toLowerCase()));
        filtered.sort((mappingClass1, mappingClass2) => mappingClass1.name.localeCompare(mappingClass2.name));
        const grouped = groupBy(filtered, 'ontologyId');
        return Object.keys(grouped).map(ontologyId => ({
            ontologyId,
            classes: grouped[ontologyId]
        }));
    }
    getDisplayText(value: MappingClass): string {
        return value ? value.name : '';
    }
    selectClass(event: MatAutocompleteSelectedEvent): void {
        this.selectedClass = event.option.value;
        this.selectedClassChange.emit(this.selectedClass);
    }
}
