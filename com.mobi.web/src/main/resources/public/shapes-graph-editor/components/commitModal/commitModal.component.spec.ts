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
import { CommitModalComponent } from './commitModal.component';
import { ShapesGraphStateService } from '../../../shared/services/shapesGraphState.service';

describe('Commit Modal component', function() {
    let component: CommitModalComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<CommitModalComponent>;
    let matDialogRef: jasmine.SpyObj<MatDialogRef<CommitModalComponent>>;
    let shapesGraphStateStub;
    let catalogManagerStub;
    
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
                CommitModalComponent,
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
        fixture = TestBed.createComponent(CommitModalComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        matDialogRef = TestBed.get(MatDialogRef);
        shapesGraphStateStub = TestBed.get(ShapesGraphStateService);
        shapesGraphStateStub.listItem = new ShapesGraphListItem();
        shapesGraphStateStub.listItem.versionedRdfRecord = {
            recordId: 'record1',
            branchId: 'branch1',
            commitId: 'commit1',
            title: 'title'
        };
        shapesGraphStateStub.changeShapesGraphVersion.and.returnValue(Promise.resolve());
        component.catalogId = 'catalog';
        catalogManagerStub = TestBed.get('catalogManagerService');
        catalogManagerStub.localCatalog = {'@id': 'catalog'};
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
        describe('should commit changes on a shapes graph record and close the dialog',  function() {
            it('successfully', async function() {
                catalogManagerStub.createBranchCommit.and.returnValue(Promise.resolve('urn:newCommitIri'));
                shapesGraphStateStub.listItem.versionedRdfRecord.commitId = 'urn:originalCommitIri';
                component.createCommitForm.controls['comment'].setValue('testComment');
                component.createCommit('branch1');
                fixture.detectChanges();
                await fixture.whenStable();

                expect(catalogManagerStub.createBranchCommit).toHaveBeenCalledWith('branch1', 'record1', 'catalog', 'testComment');
                expect(shapesGraphStateStub.changeShapesGraphVersion).toHaveBeenCalledWith('record1', 'branch1', 'urn:newCommitIri', undefined, undefined, true);
                expect(matDialogRef.close).toHaveBeenCalledWith(true);
            });
            it('unless an error occurs', async function() {
                catalogManagerStub.createBranchCommit.and.returnValue(Promise.reject('There was an error'));
                shapesGraphStateStub.listItem.versionedRdfRecord.commitId = 'urn:originalCommitIri';
                component.createCommitForm.controls['comment'].setValue('testComment');
                component.createCommit('branch1');
                fixture.detectChanges();
                await fixture.whenStable();

                expect(catalogManagerStub.createBranchCommit).toHaveBeenCalledWith('branch1', 'record1', 'catalog', 'testComment');
                expect(shapesGraphStateStub.changeShapesGraphVersion).not.toHaveBeenCalled();
                expect(shapesGraphStateStub.listItem.versionedRdfRecord.commitId).toEqual('urn:originalCommitIri');
                expect(component.errorMessage).toEqual('There was an error');
                expect(matDialogRef.close).not.toHaveBeenCalled();
            });
        });
        describe('should',  function() {
            it('create a commit if the branch is up to date', function() {
                shapesGraphStateStub.listItem.upToDate = true;
                spyOn(component, 'createCommit');
                component.commit();
                expect(component.createCommit).toHaveBeenCalled();
            });
            it('not create a commit if the branch is up to date', function() {
                shapesGraphStateStub.listItem.upToDate = false;
                spyOn(component, 'createCommit');
                component.commit();
                expect(component.createCommit).not.toHaveBeenCalled();
            });
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('h1[mat-dialog-title]')).length).toEqual(1);
            expect(element.queryAll(By.css('.shapes-graph-commit-modal')).length).toEqual(1);
            expect(element.queryAll(By.css('div[mat-dialog-content]')).length).toEqual(1);
            expect(element.queryAll(By.css('textarea')).length).toEqual(1);
        });
        it('with buttons to cancel and submit', function() {
            const buttons = element.queryAll(By.css('.mat-dialog-actions button'));
            expect(buttons.length).toEqual(2);
            expect(['Cancel', 'Submit']).toContain(buttons[0].nativeElement.textContent.trim());
            expect(['Cancel', 'Submit']).toContain(buttons[1].nativeElement.textContent.trim());
        });
        it('when there is an error', async function() {
            let errorDisplay = element.queryAll(By.css('error-display'));
            expect(errorDisplay.length).toEqual(0);

            component.errorMessage = 'error';
            fixture.detectChanges();
            await fixture.whenStable();
            errorDisplay = element.queryAll(By.css('error-display'));

            expect(errorDisplay.length).toBe(1);
            expect(errorDisplay[0].nativeElement.innerText).toEqual('error');
        });
    });
    it('should call commit when the submit button is clicked', function() {
        spyOn(component, 'commit');
        const setButton = element.queryAll(By.css('.mat-dialog-actions button[color="primary"]'))[0];
        setButton.triggerEventHandler('click', null);
        fixture.detectChanges();
        expect(component.commit).toHaveBeenCalled();
    });
});
