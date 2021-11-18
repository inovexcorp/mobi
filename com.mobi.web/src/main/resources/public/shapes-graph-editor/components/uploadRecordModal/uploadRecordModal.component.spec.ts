/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2021 iNovex Information Systems, Inc.
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
import { ComponentFixture, TestBed } from '@angular/core/testing';
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

import { cleanStylesFromDOM, mockUtil, mockCatalogManager } from '../../../../../../test/ts/Shared';
import { ErrorDisplayComponent } from '../../../shared/components/errorDisplay/errorDisplay.component';
import { FileInputComponent } from '../../../shared/components/fileInput/fileInput.component';
import { ShapesGraphManagerService } from '../../../shared/services/shapesGraphManager.service';
import { UploadRecordModalComponent } from './uploadRecordModal.component';
import { RdfUpdate } from '../../../shared/models/rdfUpdate.interface';
import { ShapesGraphStateService } from '../../../shared/services/shapesGraphState.service';

describe('Upload Record Modal component', function() {
    let component: UploadRecordModalComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<UploadRecordModalComponent>;
    let matDialogRef: jasmine.SpyObj<MatDialogRef<UploadRecordModalComponent>>;
    let shapesGraphManagerStub;
    let shapesGraphStateStub;
    let utilStub;
    let catalogManagerStub;
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
                { provide: 'utilService', useClass: mockUtil },
                { provide: 'catalogManagerService', useClass: mockCatalogManager },
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
        shapesGraphStateStub.inProgressCommit = {
            additions: [],
            deletions: []
        };
        shapesGraphStateStub.currentShapesGraphRecordIri = 'record1';
        shapesGraphStateStub.currentShapesGraphBranchIri = 'branch1';
        shapesGraphStateStub.currentShapesGraphCommitIri = 'commit1';
        shapesGraphManagerStub.uploadChanges.and.returnValue(Promise.resolve(uploadResponse));
        catalogManagerStub = TestBed.get('catalogManagerService');
        catalogManagerStub.getInProgressCommit.and.returnValue({
            additions: [{'@id': '12345'}],
            deletions: []
        });
        utilStub = TestBed.get('utilService');
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
                expect(shapesGraphStateStub.inProgressCommit).toEqual({
                    additions: [],
                    deletions: []
                });
                component.uploadChanges();
                fixture.detectChanges();
                await fixture.whenStable();

                expect(shapesGraphManagerStub.uploadChanges).toHaveBeenCalledWith(rdfUpdate);
                expect(shapesGraphStateStub.inProgressCommit).toEqual({
                    additions: [{'@id': '12345'}],
                    deletions: []
                });
                expect(utilStub.createSuccessToast).toHaveBeenCalled();
                expect(matDialogRef.close).toHaveBeenCalledWith(true);
            });
            it('unless an error occurs', async function() {
                component.selectedFile = file;
                shapesGraphManagerStub.uploadChanges.and.returnValue(Promise.reject(''));
                expect(shapesGraphStateStub.inProgressCommit).toEqual({
                    additions: [],
                    deletions: []
                });
                component.uploadChanges();
                fixture.detectChanges();
                await fixture.whenStable();

                expect(shapesGraphManagerStub.uploadChanges).toHaveBeenCalledWith(rdfUpdate);
                expect(shapesGraphStateStub.inProgressCommit).toEqual({
                    additions: [],
                    deletions: []
                });
                expect(utilStub.createSuccessToast).not.toHaveBeenCalled();
                expect(matDialogRef.close).not.toHaveBeenCalled();
            });
            it('unless there are no changes in the uploaded file', async function() {
                component.selectedFile = file;
                shapesGraphManagerStub.uploadChanges.and.returnValue(Promise.resolve({status: 204}));
                expect(shapesGraphStateStub.inProgressCommit).toEqual({
                    additions: [],
                    deletions: []
                });
                component.uploadChanges();
                fixture.detectChanges();
                await fixture.whenStable();

                expect(shapesGraphManagerStub.uploadChanges).toHaveBeenCalledWith(rdfUpdate);
                expect(shapesGraphStateStub.inProgressCommit).toEqual({
                    additions: [],
                    deletions: []
                });
                expect(utilStub.createWarningToast).toHaveBeenCalled();
                expect(utilStub.createErrorToast).not.toHaveBeenCalled();
                expect(matDialogRef.close).not.toHaveBeenCalled();
            });
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
        expect(component.uploadChanges).toHaveBeenCalled();
    });
});
