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
import { HttpResponse } from '@angular/common/http';
import { DebugElement } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, MatProgressBarModule } from '@angular/material';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { configureTestSuite } from 'ng-bullet';
import { MockProvider } from 'ng-mocks';
import { of } from 'rxjs';
import { skip } from 'rxjs/operators';

import { cleanStylesFromDOM } from '../../../../../../test/ts/Shared';
import { DCTERMS } from '../../../prefixes';
import { JSONLDObject } from '../../models/JSONLDObject.interface';
import { DatasetManagerService } from '../../services/datasetManager.service';
import { DiscoverStateService } from '../../services/discoverState.service';
import { UtilService } from '../../services/util.service';
import { DatasetSelectComponent } from './datasetSelect.component';

describe('Dataset Select component', function() {
    let component: DatasetSelectComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<DatasetSelectComponent>;
    let datasetManagerStub: jasmine.SpyObj<DatasetManagerService>;
    let utilStub: jasmine.SpyObj<UtilService>;

    const recordId = 'recordId';
    const record = {'@id': recordId};
    const datasetPreview = {
        id: recordId,
        title: 'title'
    };

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [
                NoopAnimationsModule,
                FormsModule,
                ReactiveFormsModule,
                MatFormFieldModule,
                MatInputModule,
                MatAutocompleteModule,
                MatButtonModule,
                MatIconModule,
                MatProgressBarModule
            ],
            declarations: [
                DatasetSelectComponent,
            ],
            providers: [
                MockProvider(DatasetManagerService),
                MockProvider(UtilService),
                MockProvider(DiscoverStateService)
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(DatasetSelectComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        datasetManagerStub = TestBed.get(DatasetManagerService);
        utilStub = TestBed.get(UtilService);

        datasetManagerStub.getDatasetRecords.and.returnValue(of(new HttpResponse<JSONLDObject[][]>({body: [[record]]})));
        datasetManagerStub.getRecordFromArray.and.returnValue(record);
        utilStub.getDctermsValue.and.returnValue('title');

        component.parentForm = new FormGroup({
            datasetSelect: new FormControl('')
        });
        spyOn(component.recordIdChange, 'emit');
        component.loading = false;
        fixture.detectChanges();
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        datasetManagerStub = null;
        utilStub = null;
    });

    describe('should handle updates to the dataset select value', function() {
        beforeEach(function() {
            component.ngOnInit();
        });
        it('if search text is provided', fakeAsync(function() {
            component.parentForm.controls.datasetSelect.setValue('text');
            component.parentForm.updateValueAndValidity();
            tick();
            fixture.detectChanges();
            component.filteredDatasets.pipe(skip(1)).subscribe(results => {
                expect(results).toEqual([datasetPreview]);
                expect(datasetManagerStub.getDatasetRecords).toHaveBeenCalledWith({
                    searchText: 'text',
                    limit: 100,
                    pageIndex: 0,
                    sortOption: {
                        label: 'Title',
                        field: DCTERMS + 'title',
                        asc: true
                    }
                }, true);
                expect(datasetManagerStub.getRecordFromArray).toHaveBeenCalledWith([record]);
            });
        }));
        it('if an object is provided', fakeAsync(function() {
            component.parentForm.controls.datasetSelect.setValue({
                id: recordId,
                title: 'title'
            });
            component.parentForm.updateValueAndValidity();
            tick();
            fixture.detectChanges();
            component.filteredDatasets.pipe(skip(1)).subscribe(results => {
                expect(results).toEqual([datasetPreview]);
                expect(datasetManagerStub.getDatasetRecords).toHaveBeenCalledWith({
                    searchText: 'title',
                    limit: 100,
                    pageIndex: 0,
                    sortOption: {
                        label: 'Title',
                        field: DCTERMS + 'title',
                        asc: true
                    }
                }, true);
                expect(datasetManagerStub.getRecordFromArray).toHaveBeenCalledWith([record]);
            });
        }));
        it('if no search text is provided', fakeAsync(function() {
            component.parentForm.updateValueAndValidity();
            tick();
            component.filteredDatasets.pipe(skip(1)).subscribe(results => {
                expect(results).toEqual([datasetPreview]);
                expect(datasetManagerStub.getDatasetRecords).toHaveBeenCalledWith({
                    searchText: undefined,
                    limit: 100,
                    pageIndex: 0,
                    sortOption: {
                        label: 'Title',
                        field: DCTERMS + 'title',
                        asc: true
                    }
                }, true);
                expect(datasetManagerStub.getRecordFromArray).toHaveBeenCalledWith([record]);
            });
        }));
    });
    describe('controller methods', function() {
        it('should get the display text for a dataset', function() {
            expect(component.getDisplayText(datasetPreview)).toEqual(datasetPreview.title);
            expect(component.getDisplayText(undefined)).toEqual('');
        });
        it('should select a dataset', function() {
            const event: MatAutocompleteSelectedEvent = {
                option: {
                    value: datasetPreview
                }
            } as MatAutocompleteSelectedEvent;
            component.selectDataset(event);
            expect(component.recordId).toEqual(recordId);
            expect(component.recordIdChange.emit).toHaveBeenCalledWith({recordId, recordTitle: jasmine.any(String)});
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.dataset-select')).length).toEqual(1);
        });
        ['.mat-form-field', '.mat-autocomplete', 'input[aria-label="Dataset"]'].forEach(test => {
            it('with a ' + test, function() {
                expect(element.queryAll(By.css(test)).length).toBe(1);
            });
        });
        it('with a progress bar if things are loading', async function() {
            component.loading = true;
            fixture.detectChanges();
            await fixture.whenStable();
            expect(element.queryAll(By.css('mat-progress-bar')).length).toEqual(1);
        });
    });
});
