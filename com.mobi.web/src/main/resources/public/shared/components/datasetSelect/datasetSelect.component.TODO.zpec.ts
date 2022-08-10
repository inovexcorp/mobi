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
// TODO RENAME BACK TO .spec.ts
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

import { cleanStylesFromDOM, mockUtil } from '../../../../../../test/ts/Shared';
import { DCTERMS } from '../../../prefixes';
import { JSONLDObject } from '../../models/JSONLDObject.interface';
import { DatasetManagerService } from '../../services/datasetManager.service';
import { DatasetSelectComponent } from './datasetSelect.component';

describe('Dataset Select component', function() {
    let component: DatasetSelectComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<DatasetSelectComponent>;
    let datasetManagerStub: jasmine.SpyObj<DatasetManagerService>;
    let utilStub;

    const error = 'Error message';
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
                { provide: 'utilService', useClass: mockUtil },
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(DatasetSelectComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        datasetManagerStub = TestBed.get(DatasetManagerService);
        utilStub = TestBed.get('utilService');

        datasetManagerStub.getDatasetRecords.and.returnValue(of(new HttpResponse<JSONLDObject[][]>({body: [[record]]})));
        datasetManagerStub.getRecordFromArray.and.returnValue(record);
        utilStub.getDctermsValue.and.returnValue('title');

        component.parentForm = new FormGroup({
            datasetSelect: new FormControl('')
        });
        spyOn(component.recordIdChange, 'emit');
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
            expect(component.recordIdChange.emit).toHaveBeenCalledWith(recordId);
        });
    });
    describe('replaces the element with the correct html', function() {
        // TODO
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.dataset-select')).length).toEqual(1);
            // expect(element.queryAll(By.css('h1[mat-dialog-title]')).length).toEqual(1);
            // expect(element.queryAll(By.css('form[mat-dialog-content]')).length).toEqual(1);
            // expect(element.queryAll(By.css('div[mat-dialog-actions]')).length).toEqual(1);
        });
        // ['mat-form-field', 'mat-autocomplete', 'input[aria-label="Dataset"]'].forEach(test => {
        //     it('with a ' + test, function() {
        //         expect(element.queryAll(By.css(test)).length).toBe(1);
        //     });
        // });
        // it('depending on whether there is an error', function() {
        //     expect(element.queryAll(By.css('error-display')).length).toEqual(0);
        //     component.errorMessage = 'Error message';
        //     fixture.detectChanges();
        //     expect(element.queryAll(By.css('error-display')).length).toEqual(1);
        // });
        // it('with buttons to cancel and submit', function() {
        //     const buttons = element.queryAll(By.css('.mat-dialog-actions button'));
        //     expect(buttons.length).toEqual(2);
        //     expect(['Cancel', 'Submit']).toContain(buttons[0].nativeElement.textContent.trim());
        //     expect(['Cancel', 'Submit']).toContain(buttons[1].nativeElement.textContent.trim());
        // });
    });
});
