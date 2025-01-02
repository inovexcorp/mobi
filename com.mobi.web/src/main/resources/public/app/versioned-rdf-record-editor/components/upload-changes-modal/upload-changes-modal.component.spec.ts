/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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
import { of, throwError } from 'rxjs';

import { cleanStylesFromDOM, MockVersionedRdfState } from '../../../../test/ts/Shared';
import { ErrorDisplayComponent } from '../../../shared/components/errorDisplay/errorDisplay.component';
import { FileInputComponent } from '../../../shared/components/fileInput/fileInput.component';
import { RdfUpdate } from '../../../shared/models/rdfUpdate.interface';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { ShapesGraphListItem } from '../../../shared/models/shapesGraphListItem.class';
import { Difference } from '../../../shared/models/difference.class';
import { ToastService } from '../../../shared/services/toast.service';
import { VersionedRdfListItem } from '../../../shared/models/versionedRdfListItem.class';
import { stateServiceToken } from '../../injection-token';
import { VersionedRdfState } from '../../../shared/services/versionedRdfState.service';
import { UploadChangesModalComponent } from './upload-changes-modal.component';

describe('Upload Record Modal component', function() {
    let component: UploadChangesModalComponent<VersionedRdfListItem>;
    let element: DebugElement;
    let fixture: ComponentFixture<UploadChangesModalComponent<VersionedRdfListItem>>;
    let matDialogRef: jasmine.SpyObj<MatDialogRef<UploadChangesModalComponent<VersionedRdfListItem>>>;
    let stateStub: jasmine.SpyObj<VersionedRdfState<VersionedRdfListItem>>;
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
                UploadChangesModalComponent,
                MockComponent(ErrorDisplayComponent),
                MockComponent(FileInputComponent)
            ],
            providers: [
                { provide: MatDialogRef, useFactory: () => jasmine.createSpyObj('MatDialogRef', ['close'])},
                MockProvider(ToastService),
                MockProvider(CatalogManagerService),
                { provide: stateServiceToken, useClass: MockVersionedRdfState },
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(UploadChangesModalComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        matDialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<UploadChangesModalComponent<VersionedRdfListItem>>>;
        stateStub = TestBed.inject(stateServiceToken) as jasmine.SpyObj<VersionedRdfState<VersionedRdfListItem>>;
        stateStub.listItem = new ShapesGraphListItem();
        stateStub.listItem.inProgressCommit = new Difference();
        stateStub.listItem.versionedRdfRecord = {
            recordId: 'record1',
            branchId: 'branch1',
            commitId: 'commit1',
            title: 'title'
        };
        stateStub.uploadChanges.and.returnValue(of(null));
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
        stateStub = null;
        toastStub = null;
        catalogManagerStub = null;
    });

    describe('controller methods', function() {
        describe('should upload changes and update the inProgressCommit and close the dialog', function() {
            it('successfully', async function() {
                component.selectedFile = file;
                component.uploadChanges();
                fixture.detectChanges();
                await fixture.whenStable();

                expect(stateStub.uploadChanges).toHaveBeenCalledWith(rdfUpdate);
                expect(toastStub.createSuccessToast).toHaveBeenCalledWith(jasmine.any(String));
                expect(matDialogRef.close).toHaveBeenCalledWith(true);
            });
            it('unless an error occurs', async function() {
                component.selectedFile = file;
                stateStub.uploadChanges.and.returnValue(throwError({error: '', errorMessage: '', errorDetails: []}));
                component.uploadChanges();
                fixture.detectChanges();
                await fixture.whenStable();

                expect(stateStub.uploadChanges).toHaveBeenCalledWith(rdfUpdate);
                expect(toastStub.createSuccessToast).not.toHaveBeenCalled();
                expect(matDialogRef.close).not.toHaveBeenCalled();
            });
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
          expect(element.queryAll(By.css('.upload-record-changes-modal')).length).toEqual(1);
            expect(element.queryAll(By.css('h1[mat-dialog-title]')).length).toEqual(1);
            expect(element.queryAll(By.css('div[mat-dialog-content]')).length).toEqual(1);
            expect(element.queryAll(By.css('div[mat-dialog-actions]')).length).toEqual(1);
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
