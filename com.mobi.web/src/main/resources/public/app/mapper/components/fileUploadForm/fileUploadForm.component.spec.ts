/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MockComponent, MockProvider } from 'ng-mocks';
import { of, throwError } from 'rxjs';

import { cleanStylesFromDOM } from '../../../../../public/test/ts/Shared';
import { ErrorDisplayComponent } from '../../../shared/components/errorDisplay/errorDisplay.component';
import { FileInputComponent } from '../../../shared/components/fileInput/fileInput.component';
import { DelimitedManagerService } from '../../../shared/services/delimitedManager.service';
import { MapperStateService } from '../../../shared/services/mapperState.service';
import { FileUploadFormComponent } from './fileUploadForm.component';

describe('File Upload Form component', function() {
    let component: FileUploadFormComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<FileUploadFormComponent>;
    let mapperStateStub: jasmine.SpyObj<MapperStateService>;
    let delimitedManagerStub: jasmine.SpyObj<DelimitedManagerService>;

    const error = 'Error message';
    const file: File = new File([''], 'test.xlsx');

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ 
                NoopAnimationsModule,
                FormsModule,
                ReactiveFormsModule,
                MatCheckboxModule,
                MatRadioModule
             ],
            declarations: [
                FileUploadFormComponent,
                MockComponent(ErrorDisplayComponent),
                MockComponent(FileInputComponent),
            ],
            providers: [
                MockProvider(MapperStateService),
                MockProvider(DelimitedManagerService),
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(FileUploadFormComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        mapperStateStub = TestBed.inject(MapperStateService) as jasmine.SpyObj<MapperStateService>;
        delimitedManagerStub = TestBed.inject(DelimitedManagerService) as jasmine.SpyObj<DelimitedManagerService>;
        delimitedManagerStub.previewFile.and.returnValue(of(null));
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        mapperStateStub = null;
        delimitedManagerStub = null;
    });

    describe('should correctly handle updates to', function() {
        beforeEach(function() {
            component.ngOnInit();
        });
        it('containsHeaders', fakeAsync(function() {
            component.uploadFileForm.controls.containsHeaders.setValue(false);
            tick();
            expect(delimitedManagerStub.containsHeaders).toBeFalse();
        }));
        it('separator', fakeAsync(function() {
            spyOn(component, 'changeSeparator');
            component.uploadFileForm.controls.separator.setValue(':');
            tick();
            expect(component.changeSeparator).toHaveBeenCalledWith(':');
        }));
    });
    describe('controller methods', function() {
        describe('should upload a file', function() {
            it('unless a file has not been selected', function() {
                component.upload(undefined);
                expect(delimitedManagerStub.fileObj).toBeUndefined();
                expect(component.isExcel).toBeFalse();
                expect(delimitedManagerStub.upload).not.toHaveBeenCalled();
            });
            describe('if a file has been selected', function() {
                beforeEach(function() {
                    delimitedManagerStub.fileName = 'No file selected';
                    delimitedManagerStub.dataRows = [];
                    mapperStateStub.invalidProps = [{
                        id: '',
                        index: 0
                    }];
                });
                it('unless an error occurs', fakeAsync(function() {
                    delimitedManagerStub.upload.and.returnValue(throwError(error));
                    component.upload(file);
                    tick();
                    expect(delimitedManagerStub.fileObj).toEqual(file);
                    expect(component.isExcel).toBeTrue();
                    expect(delimitedManagerStub.upload).toHaveBeenCalledWith(file);
                    expect(delimitedManagerStub.previewFile).not.toHaveBeenCalled();
                    expect(mapperStateStub.setInvalidProps).not.toHaveBeenCalled();
                    expect(component.errorMessage).toEqual(error);
                    expect(delimitedManagerStub.dataRows).toBeUndefined();
                    expect(mapperStateStub.invalidProps).toEqual([]);
                }));
                it('successfully', fakeAsync(function() {
                    const fileName = 'File Name';
                    delimitedManagerStub.upload.and.returnValue(of(fileName));
                    component.upload(file);
                    tick();
                    expect(delimitedManagerStub.fileObj).toEqual(file);
                    expect(component.isExcel).toBeTrue();
                    expect(delimitedManagerStub.upload).toHaveBeenCalledWith(file);
                    expect(component.errorMessage).toEqual('');
                    expect(delimitedManagerStub.previewFile).toHaveBeenCalledWith(50);
                    expect(mapperStateStub.setInvalidProps).toHaveBeenCalledWith();
                    expect(delimitedManagerStub.dataRows).toEqual([]);
                    expect(mapperStateStub.invalidProps).toEqual([{
                        id: '',
                        index: 0
                    }]);
                }));
            });
        });
        describe('should correctly handle when the separator changes', function() {
            beforeEach(function() {
                delimitedManagerStub.dataRows = [];
                mapperStateStub.invalidProps = [{
                    id: '',
                    index: 0
                }];
            });
            it('if error occurs', fakeAsync(function() {
                delimitedManagerStub.previewFile.and.returnValue(throwError(error));
                component.changeSeparator(';');
                tick();
                expect(delimitedManagerStub.separator).toEqual(';');
                expect(delimitedManagerStub.previewFile).toHaveBeenCalledWith(50);
                expect(component.errorMessage).toEqual(error);
                expect(mapperStateStub.setInvalidProps).not.toHaveBeenCalled();
                expect(delimitedManagerStub.dataRows).toBeUndefined();
                expect(mapperStateStub.invalidProps).toEqual([]);
            }));
            it('successfully', fakeAsync(function() {
                component.changeSeparator(';');
                tick();
                expect(delimitedManagerStub.separator).toEqual(';');
                expect(delimitedManagerStub.previewFile).toHaveBeenCalledWith(50);
                expect(component.errorMessage).toEqual('');
                expect(mapperStateStub.setInvalidProps).toHaveBeenCalledWith();
                expect(delimitedManagerStub.dataRows).toEqual([]);
                expect(mapperStateStub.invalidProps).toEqual([{
                    id: '',
                    index: 0
                }]);
            }));
        });
    });
    describe('contains with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.file-upload-form')).length).toEqual(1);
        });
        ['file-input', 'mat-checkbox'].forEach(test => {
            it('with a ' + test, function() {
                expect(element.queryAll(By.css(test)).length).toEqual(1);
            });
        });
        it('depending on the type of file', function() {
            delimitedManagerStub.fileObj = file;
            fixture.detectChanges();
            expect(element.queryAll(By.css('mat-radio-group')).length).toEqual(1);

            component.isExcel = true;
            fixture.detectChanges();
            expect(element.queryAll(By.css('mat-radio-group')).length).toEqual(0);
        });
        it('depending on whether there is an error', function() {
            expect(element.queryAll(By.css('error-display')).length).toEqual(0);
            component.errorMessage = 'Error message';
            fixture.detectChanges();
            expect(element.queryAll(By.css('error-display')).length).toEqual(1);
        });
    });
});
