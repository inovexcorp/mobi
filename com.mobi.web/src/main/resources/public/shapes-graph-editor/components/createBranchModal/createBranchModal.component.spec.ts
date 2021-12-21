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
import { MatButtonModule, MatDialogModule, MatDialogRef } from '@angular/material';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { configureTestSuite } from 'ng-bullet';

import { cleanStylesFromDOM, mockUtil, mockCatalogManager } from '../../../../../../test/ts/Shared';
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { MockComponent, MockProvider } from "ng-mocks";
import { By } from "@angular/platform-browser";
import { MatInputModule } from "@angular/material/input";
import { MatChipsModule } from "@angular/material/chips";
import { ErrorDisplayComponent } from "../../../shared/components/errorDisplay/errorDisplay.component";
import { MatIconModule } from "@angular/material/icon";
import { ShapesGraphListItem } from '../../../shared/models/shapesGraphListItem.class';
import { ShapesGraphStateService } from '../../../shared/services/shapesGraphState.service';
import { CreateBranchModal } from './createBranchModal.component';

describe('Create branch component', function() {
    let component: CreateBranchModal;
    let element: DebugElement;
    let fixture: ComponentFixture<CreateBranchModal>;
    let matDialogRef: jasmine.SpyObj<MatDialogRef<CreateBranchModal>>;
    let shapesGraphStateStub;
    let catalogManagerStub;
    let utilStub;
    
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
                CreateBranchModal,
                MockComponent(ErrorDisplayComponent)
            ],
            providers: [
                { provide: MatDialogRef, useFactory: () => jasmine.createSpyObj('MatDialogRef', ['close'])},
                { provide: 'catalogManagerService', useClass: mockCatalogManager },
                { provide: 'utilService', useClass: mockUtil },
                MockProvider(ShapesGraphStateService)
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(CreateBranchModal);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        matDialogRef = TestBed.get(MatDialogRef);
        shapesGraphStateStub = TestBed.get(ShapesGraphStateService);
        shapesGraphStateStub.listItem = new ShapesGraphListItem();
        shapesGraphStateStub.listItem.versionedRdfRecord.recordId = 'recordId';
        shapesGraphStateStub.listItem.versionedRdfRecord.commitId = 'commitId';
        shapesGraphStateStub.changeShapesGraphVersion.and.returnValue(Promise.resolve());

        catalogManagerStub = TestBed.get('catalogManagerService');
        catalogManagerStub.localCatalog = {'@id': 'catalog'};
        catalogManagerStub.createRecordBranch.and.returnValue(Promise.resolve('newBranchId'));

        utilStub = TestBed.get('utilService');
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        matDialogRef = null;
        shapesGraphStateStub = null;
        catalogManagerStub = null;
    });

    describe('controller methods', function() {
        describe('should create a branch on a shapes graph record',  function() {
            beforeEach(function() {
                component.createBranchForm.controls['title'].setValue('New Branch');
                component.createBranchForm.controls['description'].setValue('New Branch Description');
                this.branchConfig = {
                    title: 'New Branch',
                    description: 'New Branch Description'
                };
            });
            describe('and change the shapes graph version', function() {
                it('successfully', async function() {
                    await component.createBranch();

                    expect(catalogManagerStub.createRecordBranch).toHaveBeenCalledWith('recordId', 'catalog', this.branchConfig, 'commitId');
                    expect(shapesGraphStateStub.changeShapesGraphVersion).toHaveBeenCalledWith('recordId', 'newBranchId', 'commitId', undefined, this.branchConfig.title);
                    expect(matDialogRef.close).toHaveBeenCalledWith(true);
                    expect(utilStub.createErrorToast).not.toHaveBeenCalled();
                });
                it('unless an error occurs', async function() {
                    shapesGraphStateStub.changeShapesGraphVersion.and.returnValue(Promise.reject('Error'));
                    await component.createBranch();

                    expect(catalogManagerStub.createRecordBranch).toHaveBeenCalledWith('recordId', 'catalog', this.branchConfig, 'commitId');
                    expect(shapesGraphStateStub.changeShapesGraphVersion).toHaveBeenCalledWith('recordId', 'newBranchId', 'commitId', undefined, this.branchConfig.title);
                    expect(matDialogRef.close).toHaveBeenCalledWith(false);
                    expect(utilStub.createErrorToast).toHaveBeenCalledWith('Error');
                });
            });
            it('unless an error occurs', async function() {
                catalogManagerStub.createRecordBranch.and.returnValue(Promise.reject('Error'));
                await component.createBranch();

                expect(catalogManagerStub.createRecordBranch).toHaveBeenCalledWith('recordId', 'catalog', this.branchConfig, 'commitId');
                expect(shapesGraphStateStub.changeShapesGraphVersion).not.toHaveBeenCalled();
                expect(matDialogRef.close).toHaveBeenCalledWith(false);
                expect(utilStub.createErrorToast).toHaveBeenCalledWith('Error');
            });
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('h1[mat-dialog-title]')).length).toEqual(1);
            expect(element.queryAll(By.css('.create-branch-modal')).length).toEqual(1);
            expect(element.queryAll(By.css('div[mat-dialog-content]')).length).toEqual(1);
            expect(element.queryAll(By.css('input')).length).toEqual(1);
            expect(element.queryAll(By.css('textarea')).length).toEqual(1);
        });
        it('with buttons to cancel and submit', function() {
            const buttons = element.queryAll(By.css('.mat-dialog-actions button'));
            expect(buttons.length).toEqual(2);
            expect(['Cancel', 'Submit']).toContain(buttons[0].nativeElement.textContent.trim());
            expect(['Cancel', 'Submit']).toContain(buttons[1].nativeElement.textContent.trim());
        });
    });
    it('should call commit when the submit button is clicked', function() {
        spyOn(component, 'createBranch');
        const setButton = element.queryAll(By.css('.mat-dialog-actions button[color="primary"]'))[0];
        setButton.triggerEventHandler('click', null);
        fixture.detectChanges();
        expect(component.createBranch).toHaveBeenCalled();
    });
});
