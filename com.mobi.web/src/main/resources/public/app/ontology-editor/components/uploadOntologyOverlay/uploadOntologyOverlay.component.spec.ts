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
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MockComponent, MockProvider } from 'ng-mocks';
import { Observable, of, Subscription, throwError } from 'rxjs';

import { cleanStylesFromDOM } from '../../../../../public/test/ts/Shared';
import { KeywordSelectComponent } from '../../../shared/components/keywordSelect/keywordSelect.component';
import { RESTError } from '../../../shared/models/RESTError.interface';
import { OntologyManagerService } from '../../../shared/services/ontologyManager.service';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { UploadOntologyOverlayComponent } from './uploadOntologyOverlay.component';

describe('Upload Ontology Overlay component', function() {
    let component: UploadOntologyOverlayComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<UploadOntologyOverlayComponent>;
    let matDialogRef: jasmine.SpyObj<MatDialogRef<UploadOntologyOverlayComponent>>;
    let ontologyManagerStub: jasmine.SpyObj<OntologyManagerService>;
    let ontologyStateStub: jasmine.SpyObj<OntologyStateService>;

    const file1: File = new File([], 'ont1.ttl');
    const file2: File = new File([], 'ont2.ttl');
    const error: RESTError = {
        error: 'Error',
        errorMessage: 'Error Message',
        errorDetails: []
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                NoopAnimationsModule,
                ReactiveFormsModule,
                FormsModule,
                MatInputModule,
                MatFormFieldModule,
                MatDialogModule,
                MatButtonModule,
                MatIconModule
            ],
            declarations: [
                UploadOntologyOverlayComponent,
                MockComponent(KeywordSelectComponent),
            ],
            providers: [
                MockProvider(OntologyManagerService),
                MockProvider(OntologyStateService),
                { provide: MatDialogRef, useFactory: () => jasmine.createSpyObj('MatDialogRef', ['close'])}
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(UploadOntologyOverlayComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        matDialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<UploadOntologyOverlayComponent>>;
        ontologyManagerStub = TestBed.inject(OntologyManagerService) as jasmine.SpyObj<OntologyManagerService>;
        ontologyStateStub = TestBed.inject(OntologyStateService) as jasmine.SpyObj<OntologyStateService>;

        ontologyStateStub.uploadFiles = [file1, file2];
        ontologyStateStub.uploadList = [];
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        matDialogRef = null;
        ontologyStateStub = null;
        ontologyManagerStub = null;
    });

    it('should initialize with the correct values', function() {
        component.ngOnInit();
        expect(component.total).toEqual(2);
        expect(component.uploadOffset).toEqual(0);
        expect(component.uploadOntologyForm.controls.title.value).toEqual('ont1');
        expect(component.uploadOntologyForm.controls.description.value).toEqual('');
        expect(component.uploadOntologyForm.controls.keywords.value).toEqual([]);
    });
    describe('controller methods', function() {
        describe('submit should call the correct method', function() {
            beforeEach(function() {
                ontologyStateStub.uploadPending = 0;
                component.uploadOntologyForm.controls.title.setValue('title');
                component.uploadOntologyForm.controls.description.setValue('description');
                component.uploadOntologyForm.controls.keywords.setValue([' keywords ']);
                component.index = 0;
                component.total = 2;
                component.file = file1;
                spyOn(component.uploadStarted, 'emit');
                ontologyManagerStub.uploadOntology.and.returnValue(of(null));
            });
            describe('and set the values correctly if the adjusted index is', function() {
                it('less than files length', function() {
                    component.submit();
                    expect(ontologyManagerStub.uploadOntology).toHaveBeenCalledWith({
                        file: file1,
                        title: 'title',
                        description: 'description',
                        keywords: ['keywords']
                    });
                    expect(component.index).toEqual(1);
                    expect(component.uploadOntologyForm.controls.title.value).toEqual('ont1');
                    expect(component.uploadOntologyForm.controls.description.value).toEqual('');
                    expect(component.uploadOntologyForm.controls.keywords.value).toEqual([]);
                    expect(component.uploadStarted.emit).toHaveBeenCalledWith(true);
                    expect(ontologyStateStub.uploadFiles).toEqual([file2]);
                    expect(ontologyStateStub.uploadList).toContain({
                        sub: jasmine.any(Subscription),
                        id: 'upload-0',
                        title: 'title',
                        status: jasmine.any(Observable),
                        error: undefined
                    });
                    expect(matDialogRef.close).not.toHaveBeenCalled();
                });
                it('equal to files length', function() {
                    component.index = 1;
                    component.submit();
                    expect(component.index).toEqual(1);
                    expect(component.uploadOntologyForm.controls.title.value).toEqual('title');
                    expect(component.uploadOntologyForm.controls.description.value).toEqual('description');
                    expect(component.uploadOntologyForm.controls.keywords.value).toEqual([' keywords ']);
                    expect(ontologyManagerStub.uploadOntology).toHaveBeenCalledWith({
                        file: file1,
                        title: 'title',
                        description: 'description',
                        keywords: ['keywords']
                    });
                    expect(component.uploadStarted.emit).toHaveBeenCalledWith(true);
                    expect(ontologyStateStub.uploadFiles).toEqual([]);
                    expect(ontologyStateStub.uploadList).toContain({
                        sub: jasmine.any(Subscription),
                        id: 'upload-1',
                        title: 'title',
                        status: jasmine.any(Observable),
                        error: undefined
                    });
                    expect(matDialogRef.close).toHaveBeenCalledWith();
                });
            });
            describe('when uploadOntology is', function() {
                it('resolved', fakeAsync(function() {
                    component.submit();
                    fixture.detectChanges();
                    tick();
                    expect(ontologyStateStub.uploadList.length).toEqual(1);
                   
                    ontologyStateStub.uploadList[0].status.subscribe(status => {
                        expect(status).toEqual('complete');
    
                    });
                    fixture.detectChanges();
                    expect(component.uploadStarted.emit).toHaveBeenCalledWith(false);
                    expect(ontologyStateStub.addErrorToUploadItem).not.toHaveBeenCalled();
                }));
                it('rejected', fakeAsync(function() {
                    ontologyManagerStub.uploadOntology.and.returnValue(throwError(error));
                    component.submit();
                    tick();
                    expect(ontologyStateStub.uploadList.length).toEqual(1);
                
                    ontologyStateStub.uploadList[0].status.subscribe(status => {
                        expect(status).toEqual('error');
                    });
                    expect(component.uploadStarted.emit).toHaveBeenCalledWith(false);
                    expect(ontologyStateStub.addErrorToUploadItem).toHaveBeenCalledWith('upload-0', error);
                }));
            });
        });
        it('submitAll should call the submit method enough times', function() {
            const spy = spyOn(component, 'submit').and.callFake(() => {
                component.index++;
            });
            component.index = 0;
            component.total = 2;
            component.submitAll();
            expect(spy.calls.count()).toEqual(2);
        });
        it('cancel should call the correct method and set the correct variable', function() {
            component.cancel();
            expect(ontologyStateStub.uploadFiles).toEqual([]);
            expect(matDialogRef.close).toHaveBeenCalledWith();
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('h1[mat-dialog-title]')).length).toEqual(1);
            expect(element.queryAll(By.css('form[mat-dialog-content]')).length).toEqual(1);
            expect(element.queryAll(By.css('div[mat-dialog-actions]')).length).toEqual(1);
        });
        ['input[name="title"]', 'textarea', 'keyword-select'].forEach(function(tag) {
            it('with a ' + tag, function() {
                expect(element.queryAll(By.css(tag)).length).toEqual(1);
            });
        });
        it('with mat-form-fields', function() {
            expect(element.queryAll(By.css('mat-form-field')).length).toEqual(2);
        });
        it('depending on which file is being processed', function() {
            fixture.detectChanges();
            const counter = element.queryAll(By.css('h1 span'))[0];
            expect(counter).toBeDefined();
            expect(counter.nativeElement.textContent.trim()).toEqual('(1 of 2)');
        });
        it('depending on the validity of the form', function() {
            fixture.detectChanges();
            const button = element.queryAll(By.css('.mat-dialog-actions button[color="primary"]'))[0];
            expect(button).not.toBeNull();
            expect(button.properties['disabled']).toBeFalsy();
            
            component.uploadOntologyForm.controls.title.setValue(null);
            fixture.detectChanges();
            expect(button.properties['disabled']).toBeTruthy();

            component.uploadOntologyForm.controls.title.setValue('test');
            fixture.detectChanges();
            expect(button.properties['disabled']).toBeFalsy();
        });
        it('with buttons to cancel, submit, and submit all', function() {
            const buttons = element.queryAll(By.css('.mat-dialog-actions button'));
            expect(buttons.length).toEqual(3);
            expect(['Cancel', 'Submit', 'Submit All']).toContain(buttons[0].nativeElement.textContent.trim());
            expect(['Cancel', 'Submit', 'Submit All']).toContain(buttons[1].nativeElement.textContent.trim());
            expect(['Cancel', 'Submit', 'Submit All']).toContain(buttons[2].nativeElement.textContent.trim());
        });
    });
});
