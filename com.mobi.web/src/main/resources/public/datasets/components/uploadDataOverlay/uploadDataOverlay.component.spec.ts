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
import { DebugElement } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { MatButtonModule, MatDialogModule, MatDialogRef } from '@angular/material';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { configureTestSuite } from 'ng-bullet';
import { MockComponent, MockProvider } from 'ng-mocks';
import { of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';

import {
    cleanStylesFromDOM,
} from '../../../../../../test/ts/Shared';
import { ErrorDisplayComponent } from '../../../shared/components/errorDisplay/errorDisplay.component';
import { FileInputComponent } from '../../../shared/components/fileInput/fileInput.component';
import { SpinnerComponent } from '../../../shared/components/progress-spinner/components/spinner/spinner.component';
import { Dataset } from '../../../shared/models/dataset.interface';
import { DatasetManagerService } from '../../../shared/services/datasetManager.service';
import { DatasetStateService } from '../../../shared/services/datasetState.service';
import { UtilService } from '../../../shared/services/util.service';
import { UploadDataOverlayComponent } from './uploadDataOverlay.component';

describe('Upload Data Overlay component', function() {
    let component: UploadDataOverlayComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<UploadDataOverlayComponent>;
    let matDialogRef: jasmine.SpyObj<MatDialogRef<UploadDataOverlayComponent>>;
    let datasetManagerStub: jasmine.SpyObj<DatasetManagerService>;
    let datasetStateStub: jasmine.SpyObj<DatasetStateService>;
    let utilStub: jasmine.SpyObj<UtilService>;

    const recordId = 'recordId';
    const record = {'@id': recordId};
    const dataset: Dataset = {record, identifiers: []};

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [
                MatDialogModule,
                MatButtonModule,
                NoopAnimationsModule
            ],
            declarations: [
                UploadDataOverlayComponent,
                MockComponent(ErrorDisplayComponent),
                MockComponent(FileInputComponent),
                MockComponent(SpinnerComponent)
            ],
            providers: [
                MockProvider(DatasetManagerService),
                MockProvider(DatasetStateService),
                MockProvider(UtilService),
                { provide: MatDialogRef, useFactory: () => jasmine.createSpyObj('MatDialogRef', ['close'])}
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(UploadDataOverlayComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        matDialogRef = TestBed.get(MatDialogRef);
        datasetManagerStub = TestBed.get(DatasetManagerService);
        datasetStateStub = TestBed.get(DatasetStateService);
        utilStub = TestBed.get(UtilService);

        datasetStateStub.selectedDataset = dataset;
        utilStub.getDctermsValue.and.returnValue('Test');
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        datasetManagerStub = null;
        datasetStateStub = null;
        utilStub = null;
    });

    it('initializes with the correct values', function() {
        component.ngOnInit();
        expect(utilStub.getDctermsValue).toHaveBeenCalledWith(record, 'title');
        expect(component.datasetTitle).toEqual('Test');
        expect(component.importing).toEqual(false);
    });
    describe('controller methods', function() {
        describe('should upload data to a dataset', function() {
            it('unless an error occurs', fakeAsync(function() {
                datasetManagerStub.uploadData.and.callFake(() => throwError('Error Message'));
                component.submit();
                tick();
                expect(datasetManagerStub.uploadData).toHaveBeenCalledWith(recordId, component.fileObj, true);
                expect(utilStub.createSuccessToast).not.toHaveBeenCalled();
                expect(matDialogRef.close).not.toHaveBeenCalled();
                expect(component.importing).toEqual(false);
                expect(component.error).toEqual('Error Message');
            }));
            it('successfully', fakeAsync(function() {
                datasetManagerStub.uploadData.and.callFake(() => of(null).pipe(delay(1)));
                component.fileObj = new File([''], '');
                component.submit();
                expect(component.importing).toEqual(true);
                tick(1);
                expect(datasetManagerStub.uploadData).toHaveBeenCalledWith(recordId, component.fileObj, true);
                expect(component.importing).toEqual(false);
                expect(utilStub.createSuccessToast).toHaveBeenCalledWith(jasmine.any(String));
                expect(matDialogRef.close).toHaveBeenCalledWith();
                expect(component.error).toEqual('');
            }));
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('h1[mat-dialog-title]')).length).toEqual(1);
            expect(element.queryAll(By.css('div[mat-dialog-content]')).length).toEqual(1);
            expect(element.queryAll(By.css('div[mat-dialog-actions]')).length).toEqual(1);
        });
        it('with a file-input', function() {
            expect(element.queryAll(By.css('file-input')).length).toBe(1);
        });
        it('depending on whether there is an error', function() {
            expect(element.queryAll(By.css('error-display')).length).toEqual(0);
            component.error = 'Error message';
            fixture.detectChanges();
            expect(element.queryAll(By.css('error-display')).length).toEqual(1);
        });
        it('depending on whether data is importing', function() {
            fixture.detectChanges();
            const button = element.queryAll(By.css('div[mat-dialog-actions] button[color="primary"]'))[0];
            expect(element.queryAll(By.css('.importing-indicator')).length).toEqual(0);
            expect(button.properties['disabled']).toBeTruthy();
            
            component.importing = true;
            fixture.detectChanges();
            expect(element.queryAll(By.css('.importing-indicator')).length).toEqual(1);
            expect(button.properties['disabled']).toBeTruthy();

            component.importing = false;
            component.fileObj = new File([''], '');
            fixture.detectChanges();
            expect(element.queryAll(By.css('.importing-indicator')).length).toEqual(0);
            expect(button.properties['disabled']).toBeFalsy();
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
    it('should call add when the submit button is clicked', function() {
        spyOn(component, 'submit');
        const submitButton = element.queryAll(By.css('.mat-dialog-actions button[color="primary"]'))[0];
        submitButton.triggerEventHandler('click', null);
        fixture.detectChanges();
        expect(component.submit).toHaveBeenCalledWith();
    });
});
