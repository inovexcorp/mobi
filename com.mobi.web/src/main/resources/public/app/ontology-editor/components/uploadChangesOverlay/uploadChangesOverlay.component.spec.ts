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
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MockComponent, MockProvider } from 'ng-mocks';
import { of, throwError } from 'rxjs';

import { cleanStylesFromDOM } from '../../../../../public/test/ts/Shared';
import { ErrorDisplayComponent } from '../../../shared/components/errorDisplay/errorDisplay.component';
import { FileInputComponent } from '../../../shared/components/fileInput/fileInput.component';
import { OntologyListItem } from '../../../shared/models/ontologyListItem.class';
import { RESTError } from '../../../shared/models/RESTError.interface';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { ToastService } from '../../../shared/services/toast.service';
import { UploadChangesOverlayComponent } from './uploadChangesOverlay.component';

describe('Upload Changes Overlay component', function() {
    let component: UploadChangesOverlayComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<UploadChangesOverlayComponent>;
    let matDialogRef: jasmine.SpyObj<MatDialogRef<UploadChangesOverlayComponent>>;
    let ontologyStateStub: jasmine.SpyObj<OntologyStateService>;

    const error: RESTError = {
        errorMessage: 'Error Message',
        error: '',
        errorDetails: []
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                NoopAnimationsModule,
                MatDialogModule,
                MatButtonModule,
                MatIconModule
            ],
            declarations: [
                UploadChangesOverlayComponent,
                MockComponent(ErrorDisplayComponent),
                MockComponent(FileInputComponent),
            ],
            providers: [
                MockProvider(OntologyStateService),
                MockProvider(ToastService),
                { provide: MatDialogRef, useFactory: () => jasmine.createSpyObj('MatDialogRef', ['close'])}
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(UploadChangesOverlayComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        ontologyStateStub = TestBed.inject(OntologyStateService) as jasmine.SpyObj<OntologyStateService>;
        matDialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<UploadChangesOverlayComponent>>;
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        matDialogRef = null;
        ontologyStateStub = null;
    });

    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('h1[mat-dialog-title]')).length).toEqual(1);
            expect(element.queryAll(By.css('div[mat-dialog-content]')).length).toEqual(1);
            expect(element.queryAll(By.css('div[mat-dialog-actions]')).length).toEqual(1);
        });
        it('with a file-input', function() {
            expect(element.queryAll(By.css('file-input')).length).toEqual(1);
        });
        it('with buttons to cancel and submit', function() {
            const buttons = element.queryAll(By.css('.mat-dialog-actions button'));
            expect(buttons.length).toEqual(2);
            expect(['Cancel', 'Submit']).toContain(buttons[0].nativeElement.textContent.trim());
            expect(['Cancel', 'Submit']).toContain(buttons[1].nativeElement.textContent.trim());
        });
        it('depending on whether a file is selected', function() {
            fixture.detectChanges();
            const button = element.queryAll(By.css('.mat-dialog-actions button[color="primary"]'))[0];
            expect(button).not.toBeNull();
            expect(button.properties['disabled']).toBeTruthy();
            
            component.file = new File([], '');
            fixture.detectChanges();
            expect(button.properties['disabled']).toBeFalsy();
        });
        it('depending on whether an error occurred', function() {
            expect(element.queryAll(By.css('error-display')).length).toEqual(0);

            component.error = error;
            fixture.detectChanges();
            expect(element.queryAll(By.css('error-display')).length).toEqual(1);
        });
    });
    describe('controller methods', function() {
        describe('should upload an ontology', function() {
            beforeEach(function() {
                ontologyStateStub.listItem = new OntologyListItem();
                ontologyStateStub.listItem.versionedRdfRecord.recordId = 'recordId';
                ontologyStateStub.listItem.versionedRdfRecord.branchId = 'branchId',
                ontologyStateStub.listItem.versionedRdfRecord.commitId = 'commitId';
                component.file = new File([], '');
            });
            it('unless the user has an in progress commit', function() {
                ontologyStateStub.hasInProgressCommit.and.returnValue(true);
                component.submit();
                expect(component.error).toEqual(jasmine.objectContaining({errorMessage: jasmine.stringContaining('Unable to upload')}));
                expect(ontologyStateStub.uploadChanges).not.toHaveBeenCalled();
            });
            describe('if the user does not have an in progress commit', function() {
                it('unless an error occurs', fakeAsync(function() {
                    ontologyStateStub.uploadChanges.and.returnValue(throwError(error));
                    component.submit();
                    tick();
                    expect(ontologyStateStub.uploadChanges).toHaveBeenCalledWith(component.file, 'recordId', 'branchId', 'commitId');
                    expect(ontologyStateStub.listItem.tabIndex).toEqual(OntologyListItem.PROJECT_TAB);
                    expect(component.error).toEqual(error);
                    expect(matDialogRef.close).not.toHaveBeenCalled();
                }));
                it('successfully', fakeAsync(function() {
                    ontologyStateStub.uploadChanges.and.returnValue(of(null));
                    component.submit();
                    tick();
                    expect(ontologyStateStub.uploadChanges).toHaveBeenCalledWith(component.file, 'recordId', 'branchId', 'commitId');
                    expect(ontologyStateStub.listItem.tabIndex).toEqual(OntologyListItem.SAVED_CHANGES_TAB);
                    expect(component.error).toBeFalsy();
                    expect(matDialogRef.close).toHaveBeenCalledWith();
                }));
            });
        });
    });
    it('should call cancel when the button is clicked', function() {
        const cancelButton = element.queryAll(By.css('.mat-dialog-actions button:not([color="primary"])'))[0];
        cancelButton.triggerEventHandler('click', {});
        fixture.detectChanges();
        expect(matDialogRef.close).toHaveBeenCalledWith(undefined);
    });
    it('should call submit when the button is clicked', function() {
        spyOn(component, 'submit');
        const submitButton = element.queryAll(By.css('.mat-dialog-actions button[color="primary"]'))[0];
        submitButton.triggerEventHandler('click', null);
        fixture.detectChanges();
        expect(component.submit).toHaveBeenCalledWith();
    });
});
