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
import {ComponentFixture, fakeAsync, TestBed, tick} from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { configureTestSuite } from 'ng-bullet';
import { MockComponent, MockProvider } from 'ng-mocks';
import { of } from 'rxjs';

import { cleanStylesFromDOM } from '../../../../../../test/ts/Shared';
import { ErrorDisplayComponent } from '../../../shared/components/errorDisplay/errorDisplay.component';
import { FileInputComponent } from '../../../shared/components/fileInput/fileInput.component';
import { ShapesGraphManagerService } from '../../../shared/services/shapesGraphManager.service';
import { UploadRecordModalComponent } from './uploadRecordModal.component';
import { RdfUpdate } from '../../../shared/models/rdfUpdate.interface';
import { ShapesGraphStateService } from '../../../shared/services/shapesGraphState.service';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { ShapesGraphListItem } from '../../../shared/models/shapesGraphListItem.class';
import { Difference } from '../../../shared/models/difference.class';
import { UtilService } from '../../../shared/services/util.service';

describe('Upload Record Modal component', function() {
    let component: UploadRecordModalComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<UploadRecordModalComponent>;
    let matDialogRef: jasmine.SpyObj<MatDialogRef<UploadRecordModalComponent>>;
    let shapesGraphManagerStub: jasmine.SpyObj<ShapesGraphManagerService>;
    let shapesGraphStateStub: jasmine.SpyObj<ShapesGraphStateService>;
    let utilStub: jasmine.SpyObj<UtilService>;
    let catalogManagerStub: jasmine.SpyObj<CatalogManagerService>;
    const uploadResponse = {
        status: 200
    };
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

    configureTestSuite(function() {
        TestBed.configureTestingModule({
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
                { provide: MAT_DIALOG_DATA, useValue: {} },
                MockProvider(UtilService),
                MockProvider(CatalogManagerService),
                MockProvider(ShapesGraphManagerService),
                MockProvider(ShapesGraphStateService)
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(UploadRecordModalComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        matDialogRef = TestBed.get(MatDialogRef);
        shapesGraphManagerStub = TestBed.get(ShapesGraphManagerService);
        shapesGraphStateStub = TestBed.get(ShapesGraphStateService);
        shapesGraphStateStub.listItem = new ShapesGraphListItem();
        shapesGraphStateStub.listItem.inProgressCommit = new Difference();
        shapesGraphStateStub.listItem.versionedRdfRecord = {
            recordId: 'record1',
            branchId: 'branch1',
            commitId: 'commit1',
            title: 'title'
        };

        shapesGraphManagerStub.uploadChanges.and.resolveTo(uploadResponse);
        catalogManagerStub = TestBed.get(CatalogManagerService);
        catalogManagerStub.getInProgressCommit.and.returnValue(of(inProgressCommit));
        utilStub = TestBed.get(UtilService);
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        matDialogRef = null;
        shapesGraphManagerStub = null;
        shapesGraphStateStub = null;
        utilStub = null;
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
                expect(utilStub.createSuccessToast).toHaveBeenCalledWith(jasmine.any(String));
                expect(matDialogRef.close).toHaveBeenCalledWith(true);
            });
            it('unless an error occurs', async function() {
                component.selectedFile = file;
                shapesGraphManagerStub.uploadChanges.and.rejectWith('');
                expect(shapesGraphStateStub.listItem.inProgressCommit).toEqual(new Difference());
                component.uploadChanges();
                fixture.detectChanges();
                await fixture.whenStable();

                expect(shapesGraphManagerStub.uploadChanges).toHaveBeenCalledWith(rdfUpdate);
                expect(shapesGraphStateStub.listItem.inProgressCommit).toEqual(new Difference());
                expect(utilStub.createSuccessToast).not.toHaveBeenCalled();
                expect(matDialogRef.close).not.toHaveBeenCalled();
            });
            it('unless there are no changes in the uploaded file', fakeAsync (function() {
                fixture.detectChanges();
                component.selectedFile = file;
                shapesGraphManagerStub.uploadChanges.and.resolveTo({status: 204});
                expect(shapesGraphStateStub.listItem.inProgressCommit).toEqual(new Difference());
                component.uploadChanges();
                fixture.detectChanges();
                tick(500);

                expect(shapesGraphManagerStub.uploadChanges).toHaveBeenCalledWith(rdfUpdate);
                expect(shapesGraphStateStub.listItem.inProgressCommit).toEqual(new Difference());
                expect(utilStub.createWarningToast).not.toHaveBeenCalled();
                expect(utilStub.createErrorToast).not.toHaveBeenCalled();
                console.log(component.error)
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
