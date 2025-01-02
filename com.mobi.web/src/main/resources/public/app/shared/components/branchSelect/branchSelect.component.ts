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

import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

import { JSONLDObject } from '../../models/JSONLDObject.interface';
import { getDctermsValue } from '../../utility';

interface BranchDisplay {
  branch: JSONLDObject,
  title: string
}

/**
 * @class shared.BranchSelectComponent
 *
 * A component which creates an Angular Material `mat-form-field` containing a `mat-autocomplete` to select a
 * Branch JSON-LD object from within the provided array of Branch JSON-LD objects. The selected Branch is bound to
 * `model`. The select can be disabled and set to be required using parameters.
 *
 * @param {JSONLDObject} model The variable to bind the value of the select field to
 * @param {Function} modelChange An event emitted when value of the select is changed. Should update the value
 * of `model`.
 * @param {JSONLDObject[]} branches An array of JSON-LD objects representing Branches
 * @param {boolean} required An expression that determines whether the select is required
 * @param {boolean} isDisabledWhen An expression that determines whether the select is disabled
 */
@Component({
    selector: 'branch-select',
    templateUrl: './branchSelect.component.html',
})
export class BranchSelectComponent implements OnInit, OnChanges {
    @Input() model: JSONLDObject;
    @Output() modelChange = new EventEmitter<JSONLDObject>();

    @Input() branches: JSONLDObject[];
    @Input() required: boolean;
    @Input() isDisabledWhen: boolean;

    branchControl = new UntypedFormControl();
    filteredBranches: Observable<BranchDisplay[]>;

    constructor() {}

    ngOnInit(): void {
        this._setFilteredBranches();
        if (this.model) {
            this.branchControl.setValue({ branch: this.model, title: getDctermsValue(this.model, 'title') });
        }
    }
    ngOnChanges(changes: SimpleChanges): void {
        if (changes?.isDisabledWhen) {
            if (changes?.isDisabledWhen) {
                this.branchControl.enable();
            } else {
                this.branchControl.disable();
            }
        }
        if (changes?.model) {
            this.branchControl.setValue({
              branch: changes.model.currentValue,
              title: getDctermsValue(changes.model.currentValue, 'title')
            });
        }
        if (changes?.branches) {
            this._setFilteredBranches();
        }
    }
    selectedBranch(event: MatAutocompleteSelectedEvent): void {
        const branch: JSONLDObject = event.option.value.branch;
        this.modelChange.emit(branch);
    }
    getDisplayText(value: BranchDisplay): string {
        if (!value) {
            return '';
        }
        return value.title;
    }

    private _setFilteredBranches(): void {
        this.filteredBranches = this.branchControl.valueChanges.pipe(
            startWith(''),
            map(value => this._filter(value)),
        );
    }
    private _filter(value: string): BranchDisplay[] {
        const branchDisplays = this.branches.map(branch => ({ branch, title: getDctermsValue(branch, 'title')}));
        if (typeof value !== 'string') {
            return branchDisplays;
        }
        const filterValue = value.toLowerCase();
        return branchDisplays
          .filter(branch => branch.title.toLowerCase().includes(filterValue));
    }
}
