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
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { Observable } from 'rxjs';
import { debounceTime, finalize, map, startWith, switchMap } from 'rxjs/operators';

import { DCTERMS } from '../../../prefixes';
import { DatasetManagerService } from '../../services/datasetManager.service';
import { DiscoverStateService } from '../../services/discoverState.service';
import { getDctermsValue } from '../../utility';

interface DatasetPreview {
    id: string,
    title: string
}

@Component({
    selector: 'dataset-select',
    templateUrl: './datasetSelect.component.html',
    styleUrls: ['./datasetSelect.component.scss']
})
export class DatasetSelectComponent implements OnInit {
    loading = false;

    @Input() parentForm: UntypedFormGroup;
    @Input() recordId: string;
    @Output() recordIdChange = new EventEmitter<{recordId: string, recordTitle: string}>();

    filteredDatasets: Observable<DatasetPreview[]>;

    constructor(private dam: DatasetManagerService, public state: DiscoverStateService) {}

    ngOnInit(): void {
        this.resetSearch();
        this.filteredDatasets = this.parentForm.controls.datasetSelect.valueChanges
            .pipe(
                debounceTime(500),
                startWith<string | DatasetPreview>(''),
                switchMap(val => {
                    const searchText = typeof val === 'string' ?
                        val :
                        val ?
                            val.title :
                            undefined;
                    this.loading = true;
                    return this.dam.getDatasetRecords({
                        searchText,
                        limit: 100,
                        pageIndex: 0,
                        sortOption: {
                            label: 'Title',
                            field: `${DCTERMS}title`,
                            asc: true
                        }
                    }, true).pipe(
                        map(response => {
                            return response.body.map(arr => {
                                const record = this.dam.getRecordFromArray(arr);
                                return {
                                    id: record['@id'],
                                    title: getDctermsValue(record, 'title')
                                };
                            });
                        }),
                        finalize(() => {
                            this.loading = false;
                        })
                    );
                })
            );
    }
    selectDataset(event: MatAutocompleteSelectedEvent): void {
        this.recordId = event.option.value?.id;
        this.parentForm.controls.datasetSelect.setValue({id: this.recordId, title: event.option.value?.title});
        this.recordIdChange.emit({'recordId': this.recordId, 'recordTitle': event.option.value?.title});
    }
    getDisplayText(value: DatasetPreview): string {
        return value ? value.title : '';
    }

    handleDropdown(status: string): void {
        if (status === 'closed' && this.parentForm.controls?.formName?.value === 'classesDisplay') {
            this.parentForm.controls.datasetSelect.setValue({id: this.state.explore.recordTitle,
                title: this.state.explore.recordTitle});
        } else if (status === 'closed' && this.parentForm.controls?.formName?.value === 'queryTab') {
            this.parentForm.controls.datasetSelect.setValue({id: this.state.query.recordId,
                title: this.state.query.recordTitle});
        } else {
            this.parentForm.controls.datasetSelect.setValue({});
        }
    }

    resetSearch(): void {
        if (this?.state?.explore?.recordTitle && this.parentForm.controls?.formName?.value === 'classesDisplay') {
            this.parentForm.controls.datasetSelect.setValue({id: this.state.explore.recordTitle,
                title: this.state.explore.recordTitle});
        } else if (this.state.query?.recordTitle && this.parentForm.controls?.formName?.value === 'queryTab') {
            this.parentForm.controls.datasetSelect.setValue({id: this.state.query.recordId,
                title: this.state.query.recordTitle});
        } else {
            this.parentForm.controls.datasetSelect.setValue({id: '', title: ''});
        }
    }
}
