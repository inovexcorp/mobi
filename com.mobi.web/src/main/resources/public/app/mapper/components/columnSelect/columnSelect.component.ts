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
import { Component, Input, OnInit } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { get } from 'lodash';

import { DelimitedManagerService } from '../../../shared/services/delimitedManager.service';

interface ColumnOption {
    idx: number,
    header: string
}

/**
 * @class mapper.ColumnSelectComponent
 *
 * A component which creates a `mat-select` for a `column` control in the provided parent FormGroup. The value will be a
 * 0-based index.
 *
 * @param {FormGroup} parentForm The parent FormGroup for the select. Expects a control called "column"
 */
@Component({
    selector: 'column-select',
    templateUrl: './columnSelect.component.html'
})
export class ColumnSelectComponent implements OnInit {
    columns: ColumnOption[] = [];
    preview = '';

    @Input() parentForm: UntypedFormGroup;

    constructor(public dm: DelimitedManagerService) {}

    ngOnInit(): void {
        this.columns = [...Array(this.dm.dataRows[0].length).keys()].map(idx => ({
            idx,
            header: this.dm.getHeader(idx)
        }));
        this.setValuePreview(this.parentForm.controls.column.value);
        this.parentForm.controls.column.valueChanges
            .subscribe(val => {
                this.setValuePreview(val);
            });
    }
    setValuePreview(num: number): void {
        if (num !== undefined && num !== null) {
            const firstRowIndex = this.dm.containsHeaders ? 1 : 0;
            this.preview = get(this.dm.dataRows, `[${firstRowIndex}][${num}]`, '(None)');
        } else {
            this.preview = '(None)';
        }
    }
}
