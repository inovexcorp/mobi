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
import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { UserConfig } from 'gridjs';
import { TColumn } from 'gridjs/dist/src/types';
import { range } from 'lodash';

/**
 * @class mapper.PreviewDataGridComponent
 *
 * A component that creates a grid with the provided delimited `rows` array. The grid should automatically update
 * whenever new data is provided, the provided `highlightIndexes` change, and whether the data `containsHeaders`
 * changes. The grid is uneditable and the user cannot select a cell within it.
 * 
 * @param {string[][]} rows An array of arrays of delimited data.
 * @param {string[]} highlightIndexes An array of 0-based indexes in strings indicating which columns should be
 * highlighted.
 * @param {boolean} containsHeaders Whether the delimited data contains a header row
 */
@Component({
    selector: 'preview-data-grid',
    templateUrl: './previewDataGrid.component.html',
    styleUrls: ['./previewDataGrid.component.scss']
})
export class PreviewDataGridComponent implements OnInit, OnChanges {
    gridConfig: UserConfig;
    displayGrid: boolean;

    @Input() rows: string[][];
    @Input() highlightIndexes: string[];
    @Input() containsHeaders: boolean;

    constructor() {}

    ngOnInit(): void {
        this.setGridConfig(this.rows, this.containsHeaders);
    }
    ngOnChanges(changes: SimpleChanges): void {
        if (!changes.rows?.firstChange || !changes.containsHeaders?.firstChange || changes.highlightIndexes?.firstChange) {
            const containsHeaders = changes.containsHeaders ? changes.containsHeaders.currentValue : this.containsHeaders;
            const rows = changes.rows ? changes.rows.currentValue : this.rows;
            this.setGridConfig(rows, containsHeaders);
        }
    }
    setGridConfig(rows: string[][], containsHeaders: boolean): void {
        if (rows && rows.length) {
            this.displayGrid = true;
            if (containsHeaders) {
                this.gridConfig = {
                    columns: this.createColumns(rows[0]),
                    data: rows.slice(1)
                };
            } else {
                this.gridConfig = {
                    columns: this.createColumns(range(rows[0].length).map(num => 'Column ' + num)),
                    data: rows
                };
            }
        } else {
            this.displayGrid = false;
            this.gridConfig = {
                data: Array(10).fill('')
            };
        }
    }
    createColumns(headers: string[]): (TColumn|string)[] {
        if (this.highlightIndexes && this.highlightIndexes.length) {
            return headers.map((header, idx) => {
                const obj: TColumn = {
                    name: header
                };
                if (this.highlightIndexes.includes('' + idx)) {
                    obj.attributes = (cell) => {
                        if (cell) {
                            return {
                                class: 'highlight-col gridjs-td'
                            };
                        }
                    };
                }
                return obj;
            });
        } else {
            return headers;
        }
    }
}
