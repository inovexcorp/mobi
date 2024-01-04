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

import { ENTER } from '@angular/cdk/keycodes';
import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete'; 
import { MatChipInputEvent } from '@angular/material/chips';
import { findIndex } from 'lodash';
import { Observable } from 'rxjs';
import { map, debounceTime, startWith } from 'rxjs/operators';

import { JSONLDId } from '../../../shared/models/JSONLDId.interface';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';

interface PropGrouping {
    namespace: string,
    options: PropOption[]
}

interface PropOption {
    item: string,
    name: string
}

/**
 * @class ontology-editor.SuperPropertySelectComponent
 *
 * A component which provides a link to hide/show a `mat-autocomplete` of all available property IRIs in the currently
 * {@link shared.OntologyStateService#listItem selected ontology} in the list identified by the provided key. The value
 * of the select is bound to `selected` and the values are in the form of `{'@id': 'propIRI'}`.
 * 
 * @param {string} key The key to a list on the currently selected ontology
 * @param {JSONLDId[]} selected The variable to bind the selected properties to in the form of `{'@id': propIRI}`
 */
@Component({
    selector: 'super-property-select',
    templateUrl: './superPropertySelect.component.html'
})
export class SuperPropertySelectComponent implements OnInit {
    @Input() key: string;
    @Input() selected: JSONLDId[] = [];
    
    @Output() selectedChange = new EventEmitter<JSONLDId[]>();
    
    isShown = false;
    separatorKeysCodes: number[] = [ENTER];
    filteredProperties: Observable<PropGrouping[]>;
    selectedOptions: PropOption[] = [];

    propControl: UntypedFormControl = new UntypedFormControl();

    @ViewChild('propInput') propInput: ElementRef;

    constructor(public os: OntologyStateService) {}
    
    ngOnInit(): void {
        this.selectedOptions = this.selected.map(iriObj => ({
            name: this.os.getEntityNameByListItem(iriObj['@id']),
            item: iriObj['@id']
        }));
        this.filteredProperties = this.propControl.valueChanges
            .pipe(
                debounceTime(500),
                startWith<string | PropOption>(''),
                map(val => {
                    const searchText = typeof val === 'string' ? 
                        val : 
                        val ? 
                            val.name :
                            '';
                    return this.filter(searchText);
                })
            );
    }
    show(): void {
        this.isShown = true;
    }
    hide(): void {
        this.isShown = false;
        this.selected = [];
        this.selectedOptions = [];
        this.selectedChange.emit([]);
    }
    filter(searchText: string): PropGrouping[] {
        let iris = Object.keys(this.os.listItem[this.key].iris);
        iris = iris.filter(iri => findIndex(this.selected, val => val['@id'] === iri) < 0);
        return this.os.getGroupedSelectList(iris, searchText, iri => this.os.getEntityNameByListItem(iri));
    }
    add(event: MatChipInputEvent): void {
        const input = event.input;
        const value = event.value;
    
        if (value) {
            this.selectedOptions.push({ item: value, name: this.os.getEntityNameByListItem(value) });
            this.selected.push({'@id': value});
            this.selectedChange.emit(this.selected);
        }
    
        // Reset the input value
        if (input) {
            input.value = '';
        }
    
        this.propControl.setValue(null);
    }
    remove(option: PropOption): void {
        const index = findIndex(this.selected, obj => obj['@id'] === option.item);
    
        if (index >= 0) {
            this.selectedOptions.splice(index, 1);
            this.selected.splice(index, 1);
            this.selectedChange.emit(this.selected);
        }
    }
    select(event: MatAutocompleteSelectedEvent): void {
        this.selectedOptions.push(event.option.value);
        this.selected.push({'@id': event.option.value.item});
        this.selectedChange.emit(this.selected);
        this.propInput.nativeElement.value = '';
        this.propControl.setValue(null);
    }
}
