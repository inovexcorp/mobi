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
import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { groupBy } from 'lodash';
import { Observable, of } from 'rxjs';
import { catchError, debounceTime, finalize, map, startWith, switchMap } from 'rxjs/operators';

import { MappingProperty } from '../../../shared/models/mappingProperty.interface';
import { MapperStateService } from '../../../shared/services/mapperState.service';
import { ProgressSpinnerService } from '../../../shared/components/progress-spinner/services/progressSpinner.service';
import { splitIRI } from '../../../shared/pipes/splitIRI.pipe';

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
    templateUrl: './propSelect.component.html',
    styleUrls: ['./propSelect.component.scss']
})
export class PropSelectComponent implements OnInit {
    private _selectedProp: MappingProperty;
    @Input() isReadOnly: boolean;
    @Input() parentForm: UntypedFormGroup;
    @Input() parentClass: string;
    @Input() set selectedProp (value: MappingProperty) {
        this._selectedProp = value;
        if (this.parentForm.get('prop').disabled) {
           this.parentForm.controls.prop.disable();
        } else {
            this.parentForm.controls.prop.enable();
        }
    }
        
    public getSelectedProp(): MappingProperty{
        return this._selectedProp;
    }
    @Output() selectedPropChange = new EventEmitter<MappingProperty>();

    @ViewChild('propSelectSpinner', { static: true }) propSelectSpinner: ElementRef;
    
    error = '';
    noResults = false;
    filteredProperties: Observable<PropertyGroup[]>;

    constructor(private _state: MapperStateService, private _spinner: ProgressSpinnerService) {}

    ngOnInit(): void {
        this.filteredProperties = this.parentForm.controls.prop.valueChanges
            .pipe(
                debounceTime(500),
                startWith<string | MappingProperty>(''),
                switchMap(val => this.filter(val))
            );
    }
    filter(val: string | MappingProperty): Observable<PropertyGroup[]> {
        if (typeof val === 'string') {
            this._spinner.startLoadingForComponent(this.propSelectSpinner, 15);
            // Find supported annotations matching search text
            const filteredAnnotations = this._state.supportedAnnotations.filter(propDisplay => 
                propDisplay.name.toLowerCase().includes(val.toLowerCase()));
            return this._state.retrieveProps(this._state.selected.mapping.getSourceOntologyInfo(), this.parentClass, 
              val, 100, true)
                .pipe(
                    map(results => {
                        this.error = '';
                        const filtered = results
                            // Handle supported annotations redefined in the imports closure
                            .filter(result => !filteredAnnotations.find(ann => ann.iri === result.iri))
                            // Add in supported annotations matching search text
                            .concat(filteredAnnotations)
                            // Sort results again
                            .sort((a, b) => a.name.localeCompare(b.name))
                            // Only keep 100 results still
                            .slice(0, 100);
                        if (!filtered.length) {
                            this.noResults = true;
                            return [];
                        }
                        this.noResults = false;
                        // Group by ontology IRI found across data props, object props, and annotation props
                        // Account for redefined supported annotations and ensure to group by namespace in those cases
                        const grouped = groupBy(filtered, result => this.getOntologyId(result));
                        return Object.keys(grouped).map(ontologyId => ({
                            ontologyId,
                            properties: grouped[ontologyId]
                                .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()))
                        })).sort((a, b) => a.ontologyId.toLowerCase().localeCompare(b.ontologyId.toLowerCase()));
                    }),
                    catchError(error => {
                        this.error = error;
                        this.noResults = true;
                        return of([]);
                    }),
                    finalize(() => {
                        this._spinner.finishLoadingForComponent(this.propSelectSpinner);
                    })
                );
        } else {
            this.noResults = false;
            const mappingProp = val as MappingProperty;
            return of([{ ontologyId: this.getOntologyId(mappingProp), properties: [mappingProp] }]);
        }
    }
    getOntologyId(mappingProp: MappingProperty): string {
        return this._state.iriMap.dataProperties[mappingProp.iri]
          || this._state.iriMap.objectProperties[mappingProp.iri] 
          || (this._state.supportedAnnotations.includes(mappingProp) ? 
              splitIRI(mappingProp.iri).begin 
              : this._state.iriMap.annotationProperties[mappingProp.iri]);
    }
    getDisplayText(mappingProperty?: MappingProperty): string {
        return mappingProperty ? mappingProperty.name : '';
    }
    selectProp(event: MatAutocompleteSelectedEvent): void {
        this._selectedProp = event.option.value;
        this.selectedPropChange.emit(this._selectedProp);
    }
}
