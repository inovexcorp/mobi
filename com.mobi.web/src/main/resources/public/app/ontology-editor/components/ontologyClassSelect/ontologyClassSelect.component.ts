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
import { ENTER } from '@angular/cdk/keycodes';
import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import {MatAutocompleteSelectedEvent, MatAutocompleteTrigger} from '@angular/material/autocomplete';
import { MatChipInputEvent } from '@angular/material/chips';
import { Observable } from 'rxjs';
import { debounceTime, map, startWith } from 'rxjs/operators';

import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import {includes} from "lodash";

interface ClassGrouping {
    namespace: string,
    options: ClassOption[]
}

interface ClassOption {
    item: string,
    name: string
}

/**
 * @class ontology-editor.OntologyClassSelectComponent
 *
 * A component that creates a `mat-autocomplete` of the IRIs of all the classes in the current
 * {@link shared.OntologyStateService#listItem selected ontology} and its imports. The value of the select is bound to
 * `selected`. Can also optionally provide more IRIs to be included on top of the list of class IRIs
 *
 * @param {string[]} selected The variable to bind the selected class IRIs to
 * @param {string[]} extraOptions Any extra IRIs to be included in the dropdown options
 */
@Component({
    selector: 'ontology-class-select',
    templateUrl: './ontologyClassSelect.component.html'
})
export class OntologyClassSelectComponent implements OnInit {
    @Input() selected: string[] = [];
    @Input() extraOptions: string[];
    
    @Output() selectedChange = new EventEmitter<string[]>();

    @ViewChild('clazzInput', { static: true }) clazzInput: ElementRef;

    separatorKeysCodes: number[] = [ENTER];
    filteredClasses: Observable<ClassGrouping[]>;
    selectedOptions: ClassOption[] = [];

    clazzControl: FormControl = new FormControl();
    
    constructor(public os: OntologyStateService) {}

    ngOnInit(): void {
        this.selectedOptions = this.selected.map(iri => ({
            name: this.os.getEntityNameByListItem(iri),
            item: iri
        }));
        this.filteredClasses = this.clazzControl.valueChanges
            .pipe(
                debounceTime(500),
                startWith<string | ClassOption>(''),
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
    filter(searchText: string): ClassGrouping[] {
        let iris = Object.keys(this.os.listItem.classes.iris);
        if (this.extraOptions && this.extraOptions.length) {
            iris = iris.concat(this.extraOptions);
        }
        iris = iris.filter(iri => !this.selected.includes(iri));
        return this.os.getGroupedSelectList(iris, searchText, iri => this.os.getEntityNameByListItem(iri));
    }
    add(event: MatChipInputEvent): void {
        const input = event.input;
        const value = event.value;

        if (value && includes(Object.keys(this.os.listItem.classes.iris), value)) {
            this.selectedOptions.push({ item: value, name: this.os.getEntityNameByListItem(value) });
            this.selected.push(value);
            this.selectedChange.emit(this.selected);
        }
    
        // Reset the input value
        if (input) {
            input.value = '';
        }
    
        this.clazzControl.setValue(null);
    }
    remove(option: ClassOption): void {
        const index = this.selected.indexOf(option.item);
    
        if (index >= 0) {
            this.selectedOptions.splice(index, 1);
            this.selected.splice(index, 1);
            this.selectedChange.emit(this.selected);
        }
        this.clazzControl.setValue(null);
    }
    select(event: MatAutocompleteSelectedEvent): void {
        this.selectedOptions.push(event.option.value);
        this.selected.push(event.option.value.item);
        this.selectedChange.emit(this.selected);
        this.clazzInput.nativeElement.value = '';
        this.clazzControl.setValue(null);

        this.clazzInput.nativeElement.blur();
        setTimeout(() => {
                this.clazzInput.nativeElement.focus();
            }, 600
        );
    }
}
