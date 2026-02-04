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
import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { ENTER } from '@angular/cdk/keycodes';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatChipInputEvent } from '@angular/material/chips';
import { UntypedFormControl, Validators } from '@angular/forms';

import { debounceTime, map, startWith } from 'rxjs/operators';
import { get, groupBy, includes, sortBy } from 'lodash';
import { Observable } from 'rxjs';

import { isBlankNodeId } from '../../../shared/utility';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';

interface IriGrouping {
  namespace: string,
  options: IriOption[]
}

interface IriOption {
  item: string,
  name: string,
  isBlankNode: boolean
}

/**
 * @class IriSelectOntologyComponent
 *
 * A component that creates a `mat-autocomplete` for select a specific IRI listed in the provided {@link Hierarchy}. The
 * value of the select is bound to `selected`. Can optionally specify whether the select binds one or more values, when
 * it should be required, and when it should be disabled. Can also provide display and muted text for a label for the
 * select.
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
  selector: 'iri-select-ontology',
  templateUrl: './iriSelectOntology.component.html'
})
export class IriSelectOntologyComponent implements OnInit, OnChanges {
  @Input() selected: string[] = [];
  @Input() selectList: { [key: string]: string };
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

  constructor(public os: OntologyStateService) {
  }

  /**
   * Initializes the component and sets up necessary configurations.
   *
   * This method is invoked once the component is initialized. It configures the `singleSelect` or multiple selection state
   * based on the current mode, handles value initialization for form controls (`singleControl` or `multiControl`),
   * and sets up observable streams for filtering options in response to input changes. Additionally, it applies
   * any necessary disabled or required states to the component.
   *
   * @return {void}
   */
  ngOnInit(): void {
    this.singleSelect = !(this.singleSelect === false);
    if (this.singleSelect) {
      if (this.selected && this.selected.length) {
        const isBlankNode = isBlankNodeId(this.selected[0]);
        this.singleControl.setValue({
          item: this.selected[0],
          isBlankNode,
          name: this.getName(this.selected[0], isBlankNode)
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
          const isBlankNode = isBlankNodeId(iri);
          return {
            item: iri,
            isBlankNode,
            name: this.getName(iri, isBlankNode)
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
   * Handles Angular lifecycle hook for detecting changes in input properties.
   * Executes specific logic when the `selected` input property changes,
   * including updating form controls and related attributes.
   *
   * @param {SimpleChanges} changes - An object of type `SimpleChanges` that contains
   * information about the changed input properties. The `changes` object holds
   * the current and previous values of the inputs.
   *
   * @return {void}
   */
  ngOnChanges(changes: SimpleChanges): void {
    this.setDisabled(this.isDisabledWhen);
    this.setRequired(this.isRequiredWhen);
    if (changes.selected && changes.selected.currentValue && changes.selected.currentValue.length === 0) {
      this.selectedOptions = [];
      if (this.singleSelect) {
        this.singleControl.setValue('');
      } else {
        this.multiControl.setValue('');
        if (this.multiInput) {
          this.multiInput.nativeElement.value = '';
        }
      }
    } else if (changes.selected && changes.selected.currentValue && changes.selected.currentValue.length > 0) {
      const isBlankNode = isBlankNodeId(changes.selected.currentValue[0]);
      this.singleControl.setValue({
        item: changes.selected.currentValue[0],
        isBlankNode,
        name: this.getName(changes.selected.currentValue[0], isBlankNode)
      });
    }
  }

  /**
   * Enables or disables the control based on the provided value.
   *
   * @param {boolean} val - A boolean value where `true` disables the control, and `false` enables it.
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
   * Sets the required state for form controls based on the given value and selection type.
   *
   * @param {boolean} val - A boolean value indicating whether the control(s) should be required.
   *                        If true, the appropriate validators are applied; otherwise, they are cleared.
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
   * Filters and groups a list of IRI options based on the input search text.
   *
   * @param {string} searchText - The text used to filter the list of IRI options. The search is case-insensitive and trims whitespace.
   * @return {IriGrouping[]} A sorted array of groupings where each grouping contains a namespace and its corresponding filtered and sorted options.
   */
  filter(searchText: string): IriGrouping[] {
    const array: IriOption[] = [];
    const mapped: IriOption[] = Object.keys(this.selectList).map(item => {
      const isBlankNode = isBlankNodeId(item);
      return {
        item,
        isBlankNode,
        name: this.getName(item, isBlankNode)
      };
    });
    mapped.forEach(item => {
      if (array.length === 100) {
        return;
      } else if (item.name !== undefined && includes(item.name.trim().toUpperCase(), searchText.trim().toUpperCase())) {
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
   * Retrieves a name based on the provided value and an optional flag for blank nodes.
   *
   * @param {string} value - The value to be processed.
   * @param {boolean} [isBlankNode] - Optional flag indicating whether the value represents a blank node.
   * @return {string} The processed name, either as a blank node value or an entity name.
   */
  getName(value: string, isBlankNode?: boolean): string {
    return isBlankNode ? this.os.getBlankNodeValue(value) : this.os.getEntityName(value);
  }

  /**
   * Returns the name property of the given iriOption object.
   * If iriOption is null or undefined, returns an empty string.
   *
   * @param {IriOption} iriOption - The option object containing the name property.
   * @return {string} The name of the iriOption, or an empty string if the iriOption is null or undefined.
   */
  displayFn(iriOption: IriOption): string {
    return iriOption ? iriOption.name : '';
  }

  /**
   * Retrieves the ontology IRI associated with the given input IRI.
   *
   * @param {string} iri - The input IRI for which the ontology IRI is to be retrieved.
   * @return {string} The ontology IRI corresponding to the input IRI.
   */
  getOntologyIri(iri: string): string {
    return get(this.selectList, `['${iri}']`, this.os.listItem.ontologyId);
  }

  /**
   * Adds a new chip to the selected options and emits the updated selection.
   *
   * @param {MatChipInputEvent} event - The input event containing the chip value and input reference.
   * @return {void}
   */
  add(event: MatChipInputEvent): void {
    const input = event.input;
    const value = event.value;

    if (value) {
      const isBlankNode = isBlankNodeId(value);
      this.selectedOptions.push({ item: value, name: this.getName(value, isBlankNode), isBlankNode });
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
   * Removes the specified option from the selected options and updates the state.
   *
   * @param {IriOption} option - The option to be removed.
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
   * Handles the selection event triggered by the MatAutocomplete component.
   * Updates the selected items or options based on the single-select or multi-select mode.
   *
   * @param {MatAutocompleteSelectedEvent} event - The selection event containing the selected value and related metadata.
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
