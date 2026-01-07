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
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MockComponent, MockProvider, MockPipe } from 'ng-mocks';
import { of, throwError } from 'rxjs';

import {
    cleanStylesFromDOM,
} from '../../../../../public/test/ts/Shared';
import { ErrorDisplayComponent } from '../../../shared/components/errorDisplay/errorDisplay.component';
import { Difference } from '../../../shared/models/difference.class';
import { CamelCasePipe } from '../../../shared/pipes/camelCase.pipe';
import { DelimitedManagerService } from '../../../shared/services/delimitedManager.service';
import { MapperStateService } from '../../../shared/services/mapperState.service';
import { ToastService } from '../../../shared/services/toast.service';
import { MapperSerializationSelectComponent } from '../mapperSerializationSelect/mapperSerializationSelect.component';
import { RunMappingDownloadOverlayComponent } from './runMappingDownloadOverlay.component';

describe('Run Mapping Download Overlay component', function() {
    let component: RunMappingDownloadOverlayComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<RunMappingDownloadOverlayComponent>;
    let matDialogRef: jasmine.SpyObj<MatDialogRef<RunMappingDownloadOverlayComponent>>;
    let mapperStateStub: jasmine.SpyObj<MapperStateService>;
    let delimitedManagerStub: jasmine.SpyObj<DelimitedManagerService>;
    let camelCaseStub: jasmine.SpyObj<CamelCasePipe>;
    let toastStub: jasmine.SpyObj<ToastService>;

    const error = 'Error message';

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                NoopAnimationsModule,
                FormsModule,
                ReactiveFormsModule,
                MatFormFieldModule,
                MatInputModule,
                MatDialogModule,
                MatButtonModule,
                MatIconModule
            ],
            declarations: [
                RunMappingDownloadOverlayComponent,
                MockComponent(ErrorDisplayComponent),
                MockComponent(MapperSerializationSelectComponent),
            ],
            providers: [
                MockProvider(MapperStateService),
                MockProvider(DelimitedManagerService),
                { provide: CamelCasePipe, useClass: MockPipe(CamelCasePipe) },
                MockProvider(ToastService),
                { provide: MatDialogRef, useFactory: () => jasmine.createSpyObj('MatDialogRef', ['close'])}
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(RunMappingDownloadOverlayComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        matDialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<RunMappingDownloadOverlayComponent>>;
        mapperStateStub = TestBed.inject(MapperStateService) as jasmine.SpyObj<MapperStateService>;
        delimitedManagerStub = TestBed.inject(DelimitedManagerService) as jasmine.SpyObj<DelimitedManagerService>;
        camelCaseStub = TestBed.inject(CamelCasePipe) as jasmine.SpyObj<CamelCasePipe>;
        toastStub = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;

        camelCaseStub.transform.and.callFake(a => a);
        mapperStateStub.selected = {
            mapping: undefined,
            difference: new Difference(),
            config: {
                title: 'NewTitle'
            },
            record: {
                id: '',
                title: 'Title',
                description: '',
                modified: '',
                keywords: [],
                branch: ''
            }
        };
        mapperStateStub.step = 2;
        mapperStateStub.selectMappingStep = 0;
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        matDialogRef = null;
        mapperStateStub = null;
        delimitedManagerStub = null;
        camelCaseStub = null;
        toastStub = null;
    });

    describe('should initialize with the correct values', function() {
        it('if a new mapping is being created', function() {
            delete mapperStateStub.selected.record;
            component.ngOnInit();
            expect(component.runMappingDownloadForm.controls.fileName.value).toBe('NewTitle_Data');
            expect(camelCaseStub.transform).toHaveBeenCalledWith('NewTitle', 'class');
        });
        it('if an existing mapping is being used', function() {
            component.ngOnInit();
            expect(component.runMappingDownloadForm.controls.fileName.value).toBe('Title_Data');
            expect(camelCaseStub.transform).toHaveBeenCalledWith('Title', 'class');
        });
    });
    describe('controller methods', function() {
        describe('should set the correct state for running mapping', function() {
            beforeEach(function() {
                component.runMappingDownloadForm.controls.serialization.setValue('turtle');
                component.runMappingDownloadForm.controls.fileName.setValue('fileName');
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
                        expect(delimitedManagerStub.mapAndDownload).not.toHaveBeenCalled();
                        expect(mapperStateStub.step).toBe(2);
                        expect(mapperStateStub.initialize).not.toHaveBeenCalled();
                        expect(mapperStateStub.resetEdit).not.toHaveBeenCalled();
                        expect(delimitedManagerStub.reset).not.toHaveBeenCalled();
                        expect(matDialogRef.close).not.toHaveBeenCalled();
                        expect(component.errorMessage).toEqual(error);
                    }));
                    it('successfully downloading the data', fakeAsync(function() {
                        mapperStateStub.saveMapping.and.returnValue(of('id'));
                        component.run();
                        tick();
                        expect(mapperStateStub.saveMapping).toHaveBeenCalledWith();
                        expect(delimitedManagerStub.mapAndDownload).toHaveBeenCalledWith('id', 'turtle', 'fileName');
                        expect(mapperStateStub.step).toBe(mapperStateStub.selectMappingStep);
                        expect(mapperStateStub.initialize).toHaveBeenCalledWith();
                        expect(mapperStateStub.resetEdit).toHaveBeenCalledWith();
                        expect(delimitedManagerStub.reset).toHaveBeenCalledWith();
                        expect(toastStub.createSuccessToast).toHaveBeenCalledWith(jasmine.any(String));
                        expect(matDialogRef.close).toHaveBeenCalledWith();
                        expect(component.errorMessage).toEqual('');
                    }));
                });
                it('and there are no changes and downloads the data', function() {
                    mapperStateStub.isMappingChanged.and.returnValue(false);
                    component.run();
                    expect(mapperStateStub.saveMapping).not.toHaveBeenCalled();
                    expect(delimitedManagerStub.mapAndDownload).toHaveBeenCalledWith(mapperStateStub.selected.record.id, 'turtle', 'fileName');
                    expect(mapperStateStub.step).toBe(mapperStateStub.selectMappingStep);
                    expect(mapperStateStub.initialize).toHaveBeenCalledWith();
                    expect(mapperStateStub.resetEdit).toHaveBeenCalledWith();
                    expect(delimitedManagerStub.reset).toHaveBeenCalledWith();
                    expect(toastStub.createSuccessToast).toHaveBeenCalledWith(jasmine.any(String));
                    expect(matDialogRef.close).toHaveBeenCalledWith();
                });
            });
            it('if it is not being saved and downloads the data', function() {
                mapperStateStub.editMapping = false;
                component.run();
                expect(mapperStateStub.saveMapping).not.toHaveBeenCalled();
                expect(delimitedManagerStub.mapAndDownload).toHaveBeenCalledWith(mapperStateStub.selected.record.id, 'turtle', 'fileName');
                expect(mapperStateStub.step).toBe(mapperStateStub.selectMappingStep);
                expect(mapperStateStub.initialize).toHaveBeenCalledWith();
                expect(mapperStateStub.resetEdit).toHaveBeenCalledWith();
                expect(delimitedManagerStub.reset).toHaveBeenCalledWith();
                expect(matDialogRef.close).toHaveBeenCalledWith();
            });
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('h1[mat-dialog-title]')).length).toEqual(1);
            expect(element.queryAll(By.css('form[mat-dialog-content]')).length).toEqual(1);
            expect(element.queryAll(By.css('div[mat-dialog-actions]')).length).toEqual(1);
        });
        ['mat-form-field', 'input[aria-label="File Name"]', 'mapper-serialization-select'].forEach(test => {
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
        it('depending on the validity of the form', function() {
            fixture.detectChanges();
            const button = element.queryAll(By.css('.mat-dialog-actions button[color="primary"]'))[0];
            expect(button.properties['disabled']).toBeFalsy();
            
            component.runMappingDownloadForm.controls.fileName.setValue('');
            fixture.detectChanges();
            expect(button.properties['disabled']).toBeTruthy();
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
        cancelButton.triggerEventHandler('click', {});
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
