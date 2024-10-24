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

import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatDialogRef } from '@angular/material/dialog';
import { EMPTY, Observable } from 'rxjs';
import { catchError, debounceTime, finalize, map, startWith, switchMap, tap } from 'rxjs/operators';

import { DCTERMS } from '../../../prefixes';
import { DatasetManagerService } from '../../../shared/services/datasetManager.service';
import { DelimitedManagerService } from '../../../shared/services/delimitedManager.service';
import { MapperStateService } from '../../../shared/services/mapperState.service';
import { ToastService } from '../../../shared/services/toast.service';
import { getDctermsValue } from '../../../shared/utility';
import { HttpResponse } from '@angular/common/http';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';

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
    private readonly DEBOUNCE_TIME = 500;
    private readonly LIMIT = 100;

    errorMessage = '';
    datasetRecordIRI = '';
    runMappingDatasetForm = this.fb.group({
        datasetSelect: ['', Validators.required]
    });

    filteredDatasets: Observable<DatasetPreview[]>;

    constructor(private dialogRef: MatDialogRef<RunMappingDatasetOverlayComponent>, private fb: UntypedFormBuilder,
        private state: MapperStateService, private dm: DelimitedManagerService, private dam: DatasetManagerService,
        private toast: ToastService) {}

    ngOnInit(): void {
        this.filteredDatasets = this._initDatasetSelectValueChanges();
    }

    /**
     * Initializes the dataset select value changes stream with debouncing and switching logic.
     * 
     * This method handles the value changes from the `datasetSelect` control in the form,
     * applies a debounce time to limit the number of changes being processed,
     * and then uses a switchMap to process the value changes by invoking `_handleDatasetSelectChange`.
     * 
     * @returns {Observable<DatasetPreview[]>} An observable of filtered datasets.
     */
    private _initDatasetSelectValueChanges(): Observable<DatasetPreview[]> {
        return this.runMappingDatasetForm.controls.datasetSelect.valueChanges.pipe(
            debounceTime(this.DEBOUNCE_TIME),
            startWith<string | DatasetPreview>(''),
            switchMap(val => this._handleDatasetSelectChange(val))
        );
    }
    private _handleDatasetSelectChange (val: string | DatasetPreview): Observable<DatasetPreview[]> {
        let mapExecuted = false;
        let catchErrorExecuted = false;
        const searchText = typeof val === 'string' ?
            val : val ? val.title : '';
        return this.dam.getDatasetRecords({
            searchText,
            limit: this.LIMIT,
            pageIndex: 0,
            sortOption: {
                label: 'Title',
                field: `${DCTERMS}title`,
                asc: true
            }
        }).pipe(
            map(response => {
                mapExecuted = true;
                return response.body.map(arr => {
                    const record = this.dam.getRecordFromArray(arr);
                    return {
                        id: record['@id'],
                        title: getDctermsValue(record, 'title')
                    };
                });
            }),
            catchError(() => {
                catchErrorExecuted = true; 
                return [];
            }),
            finalize(() => { // Used to detect HttpInterceptor observable.empty events
                if (!(mapExecuted || catchErrorExecuted)) {
                    this.dialogRef.close();
                }
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
        let isDialogClosed = false;
        let requestErrorFlag = false;
        // If the mapping is in edit mode and changes are detected, save mapping and run it
        // Otherwise, run the mapping directly
        const run$: Observable<void> = (this.state.editMapping && this.state.isMappingChanged()) ?
            this.state.saveMapping().pipe(
                tap(() => this.state.newMapping = false),
                switchMap(id => this._runMapping(id)),
            ) :
            this._runMapping(this.state.selected.record.id);

        run$.pipe(
            tap(() => {
                this.dialogRef.close();
                isDialogClosed = true;
            }),
            catchError(errorMessage => {
                requestErrorFlag = true;
                this.errorMessage = errorMessage;
                return EMPTY;
            }),
            finalize(() => {
                if (!isDialogClosed && !requestErrorFlag) {
                    this.dialogRef.close();
                    isDialogClosed = true;
                }
            })
        ).subscribe();
    }

    private _runMapping(id: string): Observable<void> {
        return this.dm.mapAndUpload(id, this.datasetRecordIRI).pipe(
            tap(() => this._reset()),  // Reset state after successful mapping
        );
    }
    
    private _reset(): void {
        this.errorMessage = '';
        this.state.step = this.state.selectMappingStep;
        this.state.initialize();
        this.state.resetEdit();
        this.dm.reset();
        this.toast.createSuccessToast('Successfully ran mapping');
    }
}