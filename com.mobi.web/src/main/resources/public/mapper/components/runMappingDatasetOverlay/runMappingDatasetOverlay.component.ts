/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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

import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatAutocompleteSelectedEvent, MatDialogRef } from '@angular/material';
import { Observable } from 'rxjs';
import { debounceTime, map, startWith, switchMap } from 'rxjs/operators';

import { DCTERMS } from '../../../prefixes';
import { DatasetManagerService } from '../../../shared/services/datasetManager.service';
import { DelimitedManagerService } from '../../../shared/services/delimitedManager.service';
import { MapperStateService } from '../../../shared/services/mapperState.service';
import { UtilService } from '../../../shared/services/util.service';

interface DatasetPreview {
    id: string,
    title: string
}

/**
 * @class mapper.RunMappingDatasetOverlayComponent
 *
 * A component that creates content for a modal that contains a configuration settings for running the currently
 * selected {@link shared.MapperStateService#selected mapping} against the uploaded
 * {@link shared.DelimitedManagerService#dataRows}. This includes a `mat-autocomplete` to determine which dataset to
 * upload the results of a mapping into. Meant to be used in conjunction with the `MatDialog` service.
 */
@Component({
    selector: 'run-mapping-dataset-overlay',
    templateUrl: './runMappingDatasetOverlay.component.html'
})

export class RunMappingDatasetOverlayComponent implements OnInit {
    errorMessage = '';
    datasetRecordIRI = '';
    runMappingDatasetForm = this.fb.group({
        datasetSelect: ['', Validators.required]
    });

    filteredDatasets: Observable<DatasetPreview[]>;

    constructor(private dialogRef: MatDialogRef<RunMappingDatasetOverlayComponent>, private fb: FormBuilder,
        private state: MapperStateService, private dm: DelimitedManagerService, private dam: DatasetManagerService,
        private util: UtilService) {}

    ngOnInit(): void {
        this.filteredDatasets = this.runMappingDatasetForm.controls.datasetSelect.valueChanges
            .pipe(
                debounceTime(500),
                startWith<string | DatasetPreview>(''),
                switchMap(val => {
                    const searchText = typeof val === 'string' ?
                        val :
                        val ?
                            val.title :
                            undefined;
                    return this.dam.getDatasetRecords({
                        searchText,
                        limit: 100,
                        pageIndex: 0,
                        sortOption: {
                            label: 'Title',
                            field: DCTERMS + 'title',
                            asc: true
                        }
                    }).pipe(
                        map(response => {
                            return response.body.map(arr => {
                                const record = this.dam.getRecordFromArray(arr);
                                return {
                                    id: record['@id'],
                                    title: this.util.getDctermsValue(record, 'title')
                                };
                            });
                        })
                    );
                })
            );
    }
    selectDataset(event: MatAutocompleteSelectedEvent): void {
        this.datasetRecordIRI = event.option.value?.id;
    }
    getDisplayText(value: DatasetPreview): string {
        return value ? value.title : '';
    }
    run(): void {
        if (this.state.editMapping && this.state.isMappingChanged()) {
            this.state.saveMapping()
                .subscribe(id => this._runMapping(id), error => this._onError(error));
        } else {
            this._runMapping(this.state.selected.record.id);
        }
    }

    private _onError(errorMessage: string): void {
        this.errorMessage = errorMessage;
    }
    private _runMapping(id: string): void {
        this.dm.mapAndUpload(id, this.datasetRecordIRI)
            .subscribe(() => this._reset(), error => this._onError(error));
    }
    private _reset(): void {
        this.errorMessage = '';
        this.state.step = this.state.selectMappingStep;
        this.state.initialize();
        this.state.resetEdit();
        this.dm.reset();
        this.util.createSuccessToast('Successfully ran mapping');
        this.dialogRef.close();
    }
}
