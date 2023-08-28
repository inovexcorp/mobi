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
import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { groupBy } from 'lodash';
import { Observable, of } from 'rxjs';
import { catchError, debounceTime, finalize, map, startWith, switchMap } from 'rxjs/operators';

import { MapperStateService } from '../../../shared/services/mapperState.service';
import { MappingClass } from '../../../shared/models/mappingClass.interface';
import { ProgressSpinnerService } from '../../../shared/components/progress-spinner/services/progressSpinner.service';

interface ClassGroup {
    ontologyId: string,
    classes:MappingClass[]
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
    templateUrl: './classSelect.component.html',
    styleUrls: ['./classSelect.component.scss']
})
export class ClassSelectComponent implements OnInit {
    error = '';
    noResults = false;
    @Input() parentForm: UntypedFormGroup;
    @Input() selectedClass: MappingClass;

    @Output() selectedClassChange = new EventEmitter<MappingClass>();
    
    @ViewChild('classSelectSpinner', { static: true }) classSelectSpinner: ElementRef;
    
    filteredClasses: Observable<ClassGroup[]>;

    constructor(private _state: MapperStateService, private _spinner: ProgressSpinnerService) {}

    ngOnInit(): void {
        this.filteredClasses = this.parentForm.controls.class.valueChanges
            .pipe(
                debounceTime(500),
                startWith<string | MappingClass>(''),
                switchMap(val => this.filter(val)),
            );
    }
    filter(val: string | MappingClass): Observable<ClassGroup[]> {
        const searchText = typeof val === 'string' ?
            val :
            val ?
                val.name :
                '';
        this._spinner.startLoadingForComponent(this.classSelectSpinner, 15);
        return this._state.retrieveClasses(this._state.selected.mapping.getSourceOntologyInfo(), searchText, 100, true)
            .pipe(
                catchError(error => {
                    this.error = error;
                    return of([]);
                }),
                map(results => {
                    if (!results.length) {
                        this.noResults = true;
                        return [];
                    }
                    this.noResults = false;
                    const grouped = groupBy(results, result => this._state.iriMap.classes[result.iri]);
                    return Object.keys(grouped).map(ontologyId => ({
                        ontologyId,
                        classes: grouped[ontologyId].sort((a, b) => a.name.localeCompare(b.name))
                    })).sort((a, b) => a.ontologyId.localeCompare(b.ontologyId));
                }),
                finalize(() => {
                    this._spinner.finishLoadingForComponent(this.classSelectSpinner);
                })
            );
    }
    getDisplayText(value: MappingClass): string {
        return value ? value.name : '';
    }
    selectClass(event: MatAutocompleteSelectedEvent): void {
        this.selectedClass = event.option.value;
        this.selectedClassChange.emit(this.selectedClass);
    }
}
