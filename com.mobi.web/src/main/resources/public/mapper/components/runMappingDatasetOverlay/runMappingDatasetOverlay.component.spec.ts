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
import { HttpResponse } from '@angular/common/http';
import { DebugElement } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent, MatButtonModule, MatDialogModule, MatDialogRef, MatFormFieldModule, MatIconModule, MatInputModule } from '@angular/material';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { configureTestSuite } from 'ng-bullet';
import { MockComponent, MockProvider } from 'ng-mocks';
import { of, throwError } from 'rxjs';
import { skip } from 'rxjs/operators';

import { cleanStylesFromDOM } from '../../../../../../test/ts/Shared';
import { DCTERMS } from '../../../prefixes';
import { ErrorDisplayComponent } from '../../../shared/components/errorDisplay/errorDisplay.component';
import { Difference } from '../../../shared/models/difference.class';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { DatasetManagerService } from '../../../shared/services/datasetManager.service';
import { DelimitedManagerService } from '../../../shared/services/delimitedManager.service';
import { MapperStateService } from '../../../shared/services/mapperState.service';
import { UtilService } from '../../../shared/services/util.service';
import { RunMappingDatasetOverlayComponent } from './runMappingDatasetOverlay.component';

describe('Run Mapping Dataset Overlay component', function() {
    let component: RunMappingDatasetOverlayComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<RunMappingDatasetOverlayComponent>;
    let matDialogRef: jasmine.SpyObj<MatDialogRef<RunMappingDatasetOverlayComponent>>;
    let mapperStateStub: jasmine.SpyObj<MapperStateService>;
    let delimitedManagerStub: jasmine.SpyObj<DelimitedManagerService>;
    let datasetManagerStub: jasmine.SpyObj<DatasetManagerService>;
    let utilStub: jasmine.SpyObj<UtilService>;

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
                MatDialogModule,
                MatButtonModule,
                MatIconModule
            ],
            declarations: [
                RunMappingDatasetOverlayComponent,
                MockComponent(ErrorDisplayComponent),
            ],
            providers: [
                MockProvider(MapperStateService),
                MockProvider(DelimitedManagerService),
                MockProvider(DatasetManagerService),
                MockProvider(UtilService),
                { provide: MatDialogRef, useFactory: () => jasmine.createSpyObj('MatDialogRef', ['close'])}
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(RunMappingDatasetOverlayComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        mapperStateStub = TestBed.get(MapperStateService);
        delimitedManagerStub = TestBed.get(DelimitedManagerService);
        datasetManagerStub = TestBed.get(DatasetManagerService);
        matDialogRef = TestBed.get(MatDialogRef);
        utilStub = TestBed.get(UtilService);

        datasetManagerStub.getDatasetRecords.and.returnValue(of(new HttpResponse<JSONLDObject[][]>({body: [[record]]})));
        datasetManagerStub.getRecordFromArray.and.returnValue(record);
        delimitedManagerStub.mapAndUpload.and.returnValue(of(null));
        utilStub.getDctermsValue.and.returnValue('title');
        mapperStateStub.step = 2;
        mapperStateStub.selectMappingStep = 0;
        mapperStateStub.selected = {
            mapping: undefined,
            difference: new Difference(),
            record: {
                id: 'mappingRecordId',
                title: '',
                modified: '',
                description: '',
                keywords: [],
                branch: ''
            }
        };
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        matDialogRef = null;
        mapperStateStub = null;
        delimitedManagerStub = null;
        datasetManagerStub = null;
        utilStub = null;
    });

    describe('should handle updates to the dataset select value', function() {
        beforeEach(function() {
            component.ngOnInit();
        });
        it('if search text is provided', fakeAsync(function() {
            component.runMappingDatasetForm.controls.datasetSelect.setValue('text');
            component.runMappingDatasetForm.updateValueAndValidity();
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
                });
                expect(datasetManagerStub.getRecordFromArray).toHaveBeenCalledWith([record]);
            });
        }));
        it('if an object is provided', fakeAsync(function() {
            component.runMappingDatasetForm.controls.datasetSelect.setValue({
                id: recordId,
                title: 'title'
            });
            component.runMappingDatasetForm.updateValueAndValidity();
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
                });
                expect(datasetManagerStub.getRecordFromArray).toHaveBeenCalledWith([record]);
            });
        }));
        it('if no search text is provided', fakeAsync(function() {
            component.runMappingDatasetForm.updateValueAndValidity();
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
                });
                expect(datasetManagerStub.getRecordFromArray).toHaveBeenCalledWith([record]);
            });
        }));
    });
    describe('controller methods', function() {
        describe('should set the correct state for running mapping', function() {
            beforeEach(function() {
                component.datasetRecordIRI = recordId;
            });
            describe('if it is also being saved', function() {
                describe('and there are changes', function() {
                    beforeEach(function() {
                        mapperStateStub.editMapping = true;
                        mapperStateStub.isMappingChanged.and.returnValue(true);
                    });
                    it('unless an error occurs', fakeAsync(function() {
                        mapperStateStub.saveMapping.and.returnValue(throwError(error));
                        component.run();
                        tick();
                        expect(mapperStateStub.saveMapping).toHaveBeenCalledWith();
                        expect(delimitedManagerStub.mapAndUpload).not.toHaveBeenCalled();
                        expect(mapperStateStub.step).not.toBe(mapperStateStub.selectMappingStep);
                        expect(mapperStateStub.initialize).not.toHaveBeenCalled();
                        expect(mapperStateStub.resetEdit).not.toHaveBeenCalled();
                        expect(delimitedManagerStub.reset).not.toHaveBeenCalled();
                        expect(matDialogRef.close).not.toHaveBeenCalled();
                        expect(utilStub.createSuccessToast).not.toHaveBeenCalled();
                        expect(component.errorMessage).toEqual(error);
                    }));
                    it('successfully uploading the data', fakeAsync(function() {
                        mapperStateStub.saveMapping.and.returnValue(of('id'));
                        component.run();
                        tick();
                        expect(mapperStateStub.saveMapping).toHaveBeenCalledWith();
                        expect(delimitedManagerStub.mapAndUpload).toHaveBeenCalledWith('id', recordId);
                        expect(mapperStateStub.step).toBe(mapperStateStub.selectMappingStep);
                        expect(mapperStateStub.initialize).toHaveBeenCalledWith();
                        expect(mapperStateStub.resetEdit).toHaveBeenCalledWith();
                        expect(delimitedManagerStub.reset).toHaveBeenCalledWith();
                        expect(utilStub.createSuccessToast).toHaveBeenCalledWith(jasmine.any(String));
                        expect(matDialogRef.close).toHaveBeenCalledWith();
                        expect(component.errorMessage).toEqual('');
                    }));
                });
                it('and there are no changes and uploads the data', fakeAsync(function() {
                    mapperStateStub.isMappingChanged.and.returnValue(false);
                    component.run();
                    tick();
                    expect(mapperStateStub.saveMapping).not.toHaveBeenCalled();
                    expect(delimitedManagerStub.mapAndUpload).toHaveBeenCalledWith(mapperStateStub.selected.record.id, recordId);
                    expect(mapperStateStub.step).toBe(mapperStateStub.selectMappingStep);
                    expect(mapperStateStub.initialize).toHaveBeenCalledWith();
                    expect(mapperStateStub.resetEdit).toHaveBeenCalledWith();
                    expect(delimitedManagerStub.reset).toHaveBeenCalledWith();
                    expect(utilStub.createSuccessToast).toHaveBeenCalledWith(jasmine.any(String));
                    expect(matDialogRef.close).toHaveBeenCalledWith();
                }));
            });
            it('if it is not being saved and uploads the data', fakeAsync(function() {
                mapperStateStub.editMapping = false;
                component.run();
                tick();
                expect(mapperStateStub.saveMapping).not.toHaveBeenCalled();
                expect(delimitedManagerStub.mapAndUpload).toHaveBeenCalledWith(mapperStateStub.selected.record.id, component.datasetRecordIRI);
                expect(mapperStateStub.step).toBe(mapperStateStub.selectMappingStep);
                expect(mapperStateStub.initialize).toHaveBeenCalledWith();
                expect(mapperStateStub.resetEdit).toHaveBeenCalledWith();
                expect(delimitedManagerStub.reset).toHaveBeenCalledWith();
                expect(utilStub.createSuccessToast).toHaveBeenCalledWith(jasmine.any(String));
                expect(matDialogRef.close).toHaveBeenCalledWith();
            }));
        });
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
            expect(component.datasetRecordIRI).toEqual(recordId);
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('h1[mat-dialog-title]')).length).toEqual(1);
            expect(element.queryAll(By.css('form[mat-dialog-content]')).length).toEqual(1);
            expect(element.queryAll(By.css('div[mat-dialog-actions]')).length).toEqual(1);
        });
        ['mat-form-field', 'mat-autocomplete', 'input[aria-label="Dataset"]'].forEach(test => {
            it('with a ' + test, function() {
                expect(element.queryAll(By.css(test)).length).toBe(1);
            });
        });
        it('depending on whether there is an error', function() {
            expect(element.queryAll(By.css('error-display')).length).toEqual(0);
            component.errorMessage = 'Error message';
            fixture.detectChanges();
            expect(element.queryAll(By.css('error-display')).length).toEqual(1);
        });
        it('with buttons to cancel and submit', function() {
            const buttons = element.queryAll(By.css('.mat-dialog-actions button'));
            expect(buttons.length).toEqual(2);
            expect(['Cancel', 'Submit']).toContain(buttons[0].nativeElement.textContent.trim());
            expect(['Cancel', 'Submit']).toContain(buttons[1].nativeElement.textContent.trim());
        });
    });
    it('should call cancel when the button is clicked', function() {
        const cancelButton = element.queryAll(By.css('.mat-dialog-actions button:not([color="primary"])'))[0];
        cancelButton.triggerEventHandler('click', null);
        fixture.detectChanges();
        expect(matDialogRef.close).toHaveBeenCalledWith(undefined);
    });
    it('should call download when the button is clicked', function() {
        spyOn(component, 'run');
        const submitButton = element.queryAll(By.css('.mat-dialog-actions button[color="primary"]'))[0];
        submitButton.triggerEventHandler('click', null);
        fixture.detectChanges();
        expect(component.run).toHaveBeenCalledWith();
    });
});