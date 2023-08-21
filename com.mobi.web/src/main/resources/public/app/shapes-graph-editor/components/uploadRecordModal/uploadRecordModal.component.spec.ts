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
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MockComponent, MockProvider } from 'ng-mocks';
import { HttpResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';

import { cleanStylesFromDOM } from '../../../../../public/test/ts/Shared';
import { ErrorDisplayComponent } from '../../../shared/components/errorDisplay/errorDisplay.component';
import { FileInputComponent } from '../../../shared/components/fileInput/fileInput.component';
import { ShapesGraphManagerService } from '../../../shared/services/shapesGraphManager.service';
import { RdfUpdate } from '../../../shared/models/rdfUpdate.interface';
import { ShapesGraphStateService } from '../../../shared/services/shapesGraphState.service';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { ShapesGraphListItem } from '../../../shared/models/shapesGraphListItem.class';
import { Difference } from '../../../shared/models/difference.class';
import { ToastService } from '../../../shared/services/toast.service';
import { UploadRecordModalComponent } from './uploadRecordModal.component';

describe('Upload Record Modal component', function() {
    let component: UploadRecordModalComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<UploadRecordModalComponent>;
    let matDialogRef: jasmine.SpyObj<MatDialogRef<UploadRecordModalComponent>>;
    let shapesGraphManagerStub: jasmine.SpyObj<ShapesGraphManagerService>;
    let shapesGraphStateStub: jasmine.SpyObj<ShapesGraphStateService>;
    let toastStub: jasmine.SpyObj<ToastService>;
    let catalogManagerStub: jasmine.SpyObj<CatalogManagerService>;
    const file: File = new File([''], 'filename', { type: 'text/html' });
    const rdfUpdate: RdfUpdate = {
        file: file,
        recordId: 'record1',
        branchId: 'branch1',
        commitId: 'commit1',
        replaceInProgressCommit: false
    };
    const inProgressCommit = new Difference();
    inProgressCommit.additions = [{'@id': '12345', '@type': []}];

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                FormsModule,
                ReactiveFormsModule,
                MatInputModule,
                MatFormFieldModule,
                MatSelectModule,
                MatDialogModule,
                MatButtonModule,
                NoopAnimationsModule,
                MatChipsModule,
                MatIconModule
            ],
            declarations: [
                UploadRecordModalComponent,
                MockComponent(ErrorDisplayComponent),
                MockComponent(FileInputComponent)
            ],
            providers: [
                { provide: MatDialogRef, useFactory: () => jasmine.createSpyObj('MatDialogRef', ['close'])},
                MockProvider(ToastService),
                MockProvider(CatalogManagerService),
                MockProvider(ShapesGraphManagerService),
                MockProvider(ShapesGraphStateService)
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(UploadRecordModalComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        matDialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<UploadRecordModalComponent>>;
        shapesGraphManagerStub = TestBed.inject(ShapesGraphManagerService) as jasmine.SpyObj<ShapesGraphManagerService>;
        shapesGraphStateStub = TestBed.inject(ShapesGraphStateService) as jasmine.SpyObj<ShapesGraphStateService>;
        shapesGraphStateStub.listItem = new ShapesGraphListItem();
        shapesGraphStateStub.listItem.inProgressCommit = new Difference();
        shapesGraphStateStub.listItem.versionedRdfRecord = {
            recordId: 'record1',
            branchId: 'branch1',
            commitId: 'commit1',
            title: 'title'
        };
        shapesGraphStateStub.updateShapesGraphMetadata.and.returnValue(of(null));

        shapesGraphManagerStub.uploadChanges.and.returnValue(of(new HttpResponse<null>({body: null, status: 200})));
        catalogManagerStub = TestBed.inject(CatalogManagerService) as jasmine.SpyObj<CatalogManagerService>;
        catalogManagerStub.getInProgressCommit.and.returnValue(of(inProgressCommit));
        toastStub = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        matDialogRef = null;
        shapesGraphManagerStub = null;
        shapesGraphStateStub = null;
        toastStub = null;
        catalogManagerStub = null;
    });

    describe('controller methods', function() {
        describe('should upload changes and update the inProgressCommit and close the dialog', function() {
            it('successfully', async function() {
                component.selectedFile = file;
                expect(shapesGraphStateStub.listItem.inProgressCommit).toEqual(new Difference());
                component.uploadChanges();
                fixture.detectChanges();
                await fixture.whenStable();

                expect(shapesGraphManagerStub.uploadChanges).toHaveBeenCalledWith(rdfUpdate);
                expect(shapesGraphStateStub.listItem.inProgressCommit).toEqual(inProgressCommit);
                expect(toastStub.createSuccessToast).toHaveBeenCalledWith(jasmine.any(String));
                expect(matDialogRef.close).toHaveBeenCalledWith(true);
            });
            it('unless an error occurs', async function() {
                component.selectedFile = file;
                shapesGraphManagerStub.uploadChanges.and.returnValue(throwError({error: '', errorMessage: '', errorDetails: []}));
                expect(shapesGraphStateStub.listItem.inProgressCommit).toEqual(new Difference());
                component.uploadChanges();
                fixture.detectChanges();
                await fixture.whenStable();

                expect(shapesGraphManagerStub.uploadChanges).toHaveBeenCalledWith(rdfUpdate);
                expect(shapesGraphStateStub.listItem.inProgressCommit).toEqual(new Difference());
                expect(toastStub.createSuccessToast).not.toHaveBeenCalled();
                expect(matDialogRef.close).not.toHaveBeenCalled();
            });
            it('unless there are no changes in the uploaded file', fakeAsync (function() {
                fixture.detectChanges();
                component.selectedFile = file;
                shapesGraphManagerStub.uploadChanges.and.returnValue(of(new HttpResponse<null>({body: null, status: 204})));
                expect(shapesGraphStateStub.listItem.inProgressCommit).toEqual(new Difference());
                component.uploadChanges();
                fixture.detectChanges();
                tick(500);

                expect(shapesGraphManagerStub.uploadChanges).toHaveBeenCalledWith(rdfUpdate);
                expect(shapesGraphStateStub.listItem.inProgressCommit).toEqual(new Difference());
                expect(toastStub.createWarningToast).not.toHaveBeenCalled();
                expect(toastStub.createErrorToast).not.toHaveBeenCalled();
                expect(component.error).toEqual({error: '', errorDetails: [], errorMessage: 'No changes'});
                expect(matDialogRef.close).not.toHaveBeenCalled();
            }));
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('h1[mat-dialog-title]')).length).toEqual(1);
            expect(element.queryAll(By.css('.upload-shapes-graph-record-changes-modal')).length).toEqual(1);
            expect(element.queryAll(By.css('file-input')).length).toEqual(1);
        });
        it('with buttons to cancel and submit', function() {
            const buttons = element.queryAll(By.css('.mat-dialog-actions button'));
            expect(buttons.length).toEqual(2);
            expect(['Cancel', 'Submit']).toContain(buttons[0].nativeElement.textContent.trim());
            expect(['Cancel', 'Submit']).toContain(buttons[1].nativeElement.textContent.trim());
        });
    });
    it('should call uploadChanges when the submit button is clicked', function() {
        spyOn(component, 'uploadChanges');
        const setButton = element.queryAll(By.css('.mat-dialog-actions button[color="primary"]'))[0];
        setButton.triggerEventHandler('click', null);
        fixture.detectChanges();
        expect(component.uploadChanges).toHaveBeenCalledWith();
    });
});
