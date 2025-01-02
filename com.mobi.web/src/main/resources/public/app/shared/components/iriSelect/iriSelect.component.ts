/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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

import { ENTER } from '@angular/cdk/keycodes';
import { Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, ViewChild } from '@angular/core';
import { UntypedFormControl, Validators } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete'; 
import { MatChipInputEvent } from '@angular/material/chips';
import { get, sortBy, includes, groupBy } from 'lodash';
import { Observable } from 'rxjs';
import { debounceTime, map, startWith } from 'rxjs/operators';

import { splitIRI } from '../../pipes/splitIRI.pipe';
import { getBeautifulIRI } from '../../utility';

interface IriGrouping {
    namespace: string,
    options: IriOption[]
}

interface IriOption {
    item: string,
    name: string,
}

/**
 * @class shared.IriSelectComponent
 *
 * A component which provides options for a formatted `mat-autocomplete` that takes in a map of IRI to its parent IRI.
 * `iriSelect` then will group and sort IRIs based on the parent IRI. The value of the select is bound to `selected`.
 * Can optionally specify whether the select binds one or more values, when it should be required, and when it should be
 * disabled. Can also provide display and muted text for a label for the select.
 *
 * @param {string[]} selected The variable to bind the selected IRIs to. Uses an array of values even if singleSelect
 * @param {{[key: string]: string}} selectList On object of IRI string keys to ontology IRIs to select from
 * @param {string} [displayText=''] An optional display name for the select
 * @param {string} [mutedText=''] An optional string of text to display muted next to the label
 * @param {boolean} [isDisabledWhen=false] An optional expression denoting when the select should be disabled
 * @param {boolean} [isRequiredWhen=false] An optional expression denoting when the select should be required
 * @param {boolean} [singleSelect=true] Whether the `mat-autocomplete` should bind a single value. The default is false.
 * Presence alone is enough to set it to true.
 */
@Component({
    selector: 'iri-select',
    templateUrl: './iriSelect.component.html'
})
export class IriSelectComponent implements OnInit, OnChanges {
    @Input() selected: string[] = [];
    @Input() selectList: {[key: string]: string};
    @Input() displayText = '';
    @Input() mutedText = '';
    @Input() isDisabledWhen = false;
    @Input() isRequiredWhen = false;
    @Input() singleSelect = false;
    
    @Output() selectedChange = new EventEmitter<string[]>();

    selectedOptions: IriOption[] = [];
    separatorKeysCodes: number[] = [ENTER];
    filteredIris: Observable<IriGrouping[]>;

    singleControl: UntypedFormControl = new UntypedFormControl();
    multiControl: UntypedFormControl = new UntypedFormControl();

    @ViewChild('multiInput') multiInput: ElementRef;

    constructor() {}
    
    ngOnInit(): void {
        this.singleSelect = !(this.singleSelect === false);
        if (this.singleSelect) {
            this.filteredIris = this.singleControl.valueChanges
                .pipe(
                    debounceTime(500),
                    startWith(''),
                    map(val => {
                        const searchText = typeof val === 'string' ? val : '';
                        return this.filter(searchText);
                    }),
                );
        } else {
            this.filteredIris = this.multiControl.valueChanges
                .pipe(
                    debounceTime(500),
                    startWith(''),
                    map(val => {
                        const searchText = typeof val === 'string' ? val : '';
                        return this.filter(searchText);
                    }),
                );
        }
        this.setDisabled(this.isDisabledWhen);
        this.setRequired(this.isRequiredWhen);
    }
    ngOnChanges(): void {
        this.setDisabled(this.isDisabledWhen);
        this.setRequired(this.isRequiredWhen);
    }
    setDisabled(val: boolean): void {
        if (val) {
            if (this.singleSelect) {
                this.singleControl.disable();
            } else {
                this.multiControl.disable();
            }
        } else {
            if (this.singleSelect) {
                this.singleControl.enable();
            } else {
                this.multiControl.enable();
            }
        }
    }
    setRequired(val: boolean): void {
        if (val) {
            if (this.singleSelect) {
                this.singleControl.setValidators([Validators.required]);
            } else {
                this.multiControl.setValidators([Validators.required]);
            }
        } else {
            if (this.singleSelect) {
                this.singleControl.clearValidators();
            } else {
                this.multiControl.clearValidators();
            }
        }
    }
    filter(searchText: string): IriGrouping[] {
        const array: IriOption[] = [];
        const mapped: IriOption[] = Object.keys(this.selectList).map(item => {
            return {
                item,
                name: getBeautifulIRI(item)
            };
        });
        mapped.forEach(item => {
            if (array.length === 100) {
                return;
            } else if (includes(item.name.trim().toUpperCase(), searchText.trim().toUpperCase())) {
                array.push(item);
            }
        });
        const grouped: {[key: string]: IriOption[]} = groupBy(array, item => this.getOntologyIri(item.item));
        return sortBy(Object.keys(grouped).map(namespace => ({
            namespace,
            options: sortBy(grouped[namespace], item => item.name.trim().toUpperCase())
        })), group => group.namespace.toUpperCase());
    }
    getOntologyIri(iri: string): string {
        return get(this.selectList, `['${iri}']`, splitIRI(iri).begin);
    }
    add(event: MatChipInputEvent): void {
        const input = event.input;
        const value = event.value;
    
        if (value) {
            this.selectedOptions.push({ item: value, name: getBeautifulIRI(value) });
            this.selected.push(value);
            this.selectedChange.emit(this.selected);
        }
    
        // Reset the input value
        if (input) {
            input.value = '';
        }
    
        this.multiControl.setValue(null);
    }
    remove(option: IriOption): void {
        const index = this.selected.indexOf(option.item);
    
        if (index >= 0) {
            this.selectedOptions.splice(index, 1);
            this.selected.splice(index, 1);
            this.selectedChange.emit(this.selected);
        }
    }
    select(event: MatAutocompleteSelectedEvent): void {
        if (this.singleSelect) {
            this.selected = [event.option.value.item];
        } else {
            this.selectedOptions.push(event.option.value);
            this.selected.push(event.option.value.item);
            this.multiInput.nativeElement.value = '';
            this.multiControl.setValue(null);
        }
        this.selectedChange.emit(this.selected);
    }
}
