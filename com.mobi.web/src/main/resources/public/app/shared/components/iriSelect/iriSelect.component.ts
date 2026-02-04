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

import { ENTER } from '@angular/cdk/keycodes';
import { Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, ViewChild } from '@angular/core';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatChipInputEvent } from '@angular/material/chips';
import { UntypedFormControl, Validators } from '@angular/forms';

import { get, sortBy, includes, groupBy } from 'lodash';
import { debounceTime, map, startWith } from 'rxjs/operators';
import { Observable } from 'rxjs';

import { getBeautifulIRI } from '../../utility';
import { splitIRI } from '../../pipes/splitIRI.pipe';

interface IriGrouping {
  namespace: string;
  options: IriOption[];
}

export interface IriOption {
  item: string;
  name: string;
}

/**
 * @class IriSelectComponent
 *
 * A component which provides options for a formatted `mat-autocomplete` that takes in a map of IRI to its parent IRI.
 * The `iriSelect` then will group and sort IRIs based on the parent IRI. The value of the select is bound to
 * `selected`. Can optionally specify whether the select binds one or more values, when it should be required, and
 * when it should be disabled. Can also provide display and muted text for a label for the select.
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
  @Input() selectList: { [key: string]: string };
  @Input() displayText = '';
  @Input() mutedText = '';
  @Input() isDisabledWhen = false;
  @Input() isRequiredWhen = false;
  @Input() singleSelect = false;
  @Input() displayFn?: (iriOption: IriOption) => string;

  @Output() selectedChange = new EventEmitter<string[]>();

  selectedOptions: IriOption[] = [];
  separatorKeysCodes: number[] = [ENTER];
  filteredIris: Observable<IriGrouping[]>;

  singleControl: UntypedFormControl = new UntypedFormControl();
  multiControl: UntypedFormControl = new UntypedFormControl();

  @ViewChild('multiInput') multiInput: ElementRef;

  constructor() { }

  /**
   * Initializes the component's state and sets up reactive form controls based on whether single or multiple selection is enabled.
   * It configures the default values and manages observable streams for filtering input.
   *
   * @return {void}
   */
  ngOnInit(): void {
    this.singleSelect = !(this.singleSelect === false);
    if (this.singleSelect) {
      if (this.selected && this.selected.length) {
        this.singleControl.setValue({
          item: this.selected[0],
          name: this.getName(this.selected[0])
        });
      }
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
      if (this.selected && this.selected.length) {
        this.selectedOptions = this.selected.map(iri => {
          return {
            item: iri,
            name: this.getName(iri)
          };
        });
      }
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

  /**
   * Lifecycle hook called when any data-bound property of a directive changes.
   * This is used to react to input value changes and update component logic accordingly.
   *
   * The method updates the component state by evaluating the `isDisabledWhen` and `isRequiredWhen` properties
   * and calling the respective functions to set the component's disabled and required statuses.
   *
   * @return {void}
   */
  ngOnChanges(): void {
    this.setDisabled(this.isDisabledWhen);
    this.setRequired(this.isRequiredWhen);
  }

  /**
   * Sets the disabled state for the current control based on the specified value.
   * If the value is `true`, the control will be disabled.
   * If the value is `false`, the control will be enabled.
   * The method distinguishes between single-select and multi-select controls.
   *
   * @param {boolean} val - A boolean value indicating whether to disable (`true`) or enable (`false`) the control.
   * @return {void}
   */
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

  /**
   * Sets the required validation state for the control(s) based on the provided value.
   * If `true`, adds required validation to the control(s). If `false`, removes required validation.
   *
   * @param {boolean} val Determines whether the control(s) should be marked as required.
   * @return {void}
   */
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

  /**
   * Filters and groups items based on the provided search text.
   *
   * @param {string} searchText - The text to search and filter items by. The search is case-insensitive and trims surrounding white spaces.
   * @return {IriGrouping[]} A sorted array of grouped items. Each group is identified by its namespace, and the options within each group are also sorted by name.
   */
  filter(searchText: string): IriGrouping[] {
    const array: IriOption[] = [];
    const mapped: IriOption[] = Object.keys(this.selectList).map(item => {
      return {
        item,
        name: this.getName(item)
      };
    });
    mapped.forEach(item => {
      if (array.length === 100) {
        return;
      } else if (includes(item.name.trim().toUpperCase(), searchText.trim().toUpperCase())) {
        array.push(item);
      }
    });
    const grouped: { [key: string]: IriOption[] } = groupBy(array, item => this.getOntologyIri(item.item));
    return sortBy(Object.keys(grouped).map(namespace => ({
      namespace,
      options: sortBy(grouped[namespace], item => item.name.trim().toUpperCase())
    })), group => group.namespace.toUpperCase());
  }

  /**
   * Generates a display string based on the provided IriOption.
   *
   * @param iriOption - The IriOption object containing the necessary data to generate the display string.
   * @return The name property of the IriOption if it exists; otherwise, an empty string.
   */
  defaultDisplayFn(iriOption: IriOption): string {
    return iriOption ? iriOption.name : '';
  }

  /**
   * Retrieves the ontology IRI based on the provided IRI input.
   *
   * @param {string} iri - The IRI whose corresponding ontology IRI is to be retrieved.
   * @return {string} The ontology IRI derived from the provided IRI.
   */
  getOntologyIri(iri: string): string {
    return get(this.selectList, `['${iri}']`, splitIRI(iri).begin);
  }

  /**
   * Retrieves a formatted name based on the provided value.
   *
   * @param {string} value - The input string to be transformed or used for generating the name.
   * @return {string} The formatted or processed name derived from the input value.
   */
  getName(value: string): string {
    return getBeautifulIRI(value);
  }

  /**
   * Adds a new chip based on the provided event and updates the selected options.
   *
   * @param {MatChipInputEvent} event - The event containing the input and value of the chip to be added.
   * @return {void}
   */
  add(event: MatChipInputEvent): void {
    const input = event.input;
    const value = event.value;

    if (value) {
      this.selectedOptions.push({ item: value, name: this.getName(value) });
      this.selected.push(value);
      this.selectedChange.emit(this.selected);
    }

    // Reset the input value
    if (input) {
      input.value = '';
    }

    this.multiControl.setValue(null);
  }

  /**
   * Removes the specified option from the selected options list.
   *
   * @param {IriOption} option - The option to be removed from the selected options.
   * @return {void}
   */
  remove(option: IriOption): void {
    const index = this.selected.indexOf(option.item);

    if (index >= 0) {
      this.selectedOptions.splice(index, 1);
      this.selected.splice(index, 1);
      this.selectedChange.emit(this.selected);
    }
  }

  /**
   * Handles the selection event from a MatAutocomplete component.
   *
   * @param {MatAutocompleteSelectedEvent} event - The selection event containing the selected option data.
   * @return {void}
   */
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
