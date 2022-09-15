/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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
import { MatButtonModule, MatDialogModule, MatDialogRef, MatFormFieldModule, MatIconModule, MatInputModule } from '@angular/material';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { configureTestSuite } from 'ng-bullet';
import { MockComponent, MockProvider } from 'ng-mocks';
import { of, throwError } from 'rxjs';

import { cleanStylesFromDOM } from '../../../../../../test/ts/Shared';
import { ErrorDisplayComponent } from '../../../shared/components/errorDisplay/errorDisplay.component';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { OntologyListItem } from '../../../shared/models/ontologyListItem.class';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { UtilService } from '../../../shared/services/util.service';
import { CommitOverlayComponent } from './commitOverlay.component';

describe('Commit Overlay component', function() {
    let component: CommitOverlayComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<CommitOverlayComponent>;
    let matDialogRef: jasmine.SpyObj<MatDialogRef<CommitOverlayComponent>>;
    let ontologyStateStub: jasmine.SpyObj<OntologyStateService>;
    let catalogManagerStub: jasmine.SpyObj<CatalogManagerService>;

    const error = 'Error';
    const catalogId = 'catalogId';
    const branchId = 'branchId';
    const commitId = 'commitId';
    const branch: JSONLDObject = {'@id': branchId};

    configureTestSuite(function() {
        TestBed.configureTestingModule({
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
                CommitOverlayComponent,
                MockComponent(ErrorDisplayComponent),
            ],
            providers: [
                MockProvider(OntologyStateService),
                MockProvider(CatalogManagerService),
                MockProvider(UtilService),
                { provide: MatDialogRef, useFactory: () => jasmine.createSpyObj('MatDialogRef', ['close'])}
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(CommitOverlayComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        ontologyStateStub = TestBed.get(OntologyStateService);
        catalogManagerStub = TestBed.get(CatalogManagerService);
        matDialogRef = TestBed.get(MatDialogRef);

        catalogManagerStub.localCatalog = {'@id': catalogId};
        ontologyStateStub.listItem = new OntologyListItem();
        ontologyStateStub.listItem.upToDate = true;
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        matDialogRef = null;
        ontologyStateStub = null;
        catalogManagerStub = null;
    });

    it('should initialize correctly', function() {
        component.ngOnInit();
        expect(component.catalogId).toEqual(catalogId);
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('h1[mat-dialog-title]')).length).toEqual(1);
            expect(element.queryAll(By.css('form[mat-dialog-content]')).length).toEqual(1);
            expect(element.queryAll(By.css('div[mat-dialog-actions]')).length).toEqual(1);
        });
        it('depending on whether there is a error message', function() {
            expect(element.queryAll(By.css('error-display')).length).toEqual(0);
            component.error = 'error';
            fixture.detectChanges();
            expect(element.queryAll(By.css('error-display')).length).toEqual(1);
        });
        it('with a textarea', function() {
            expect(element.queryAll(By.css('textarea')).length).toEqual(1);
        });
        it('depending on the form validity', function() {
            fixture.detectChanges();
            const button = element.queryAll(By.css('.mat-dialog-actions button[color="primary"]'))[0];
            expect(button.properties['disabled']).toBeTruthy();
            
            component.commitForm.controls.comment.setValue('test');
            fixture.detectChanges();
            expect(button.properties['disabled']).toBeFalsy();
        });
        it('with buttons to cancel and submit', function() {
            const buttons = element.queryAll(By.css('.mat-dialog-actions button'));
            expect(buttons.length).toEqual(2);
            expect(['Cancel', 'Submit']).toContain(buttons[0].nativeElement.textContent.trim());
            expect(['Cancel', 'Submit']).toContain(buttons[1].nativeElement.textContent.trim());
        });
    });
    describe('controller methods', function() {
        describe('commit should call the correct manager functions', function() {
            beforeEach(function() {
                component.catalogId = catalogId;
            });
            describe('when upToDate is true', function() {
                beforeEach(function() {
                    ontologyStateStub.listItem.upToDate = true;
                });
                describe('when createBranchCommit is resolved', function() {
                    beforeEach(function() {
                        catalogManagerStub.createBranchCommit.and.returnValue(of(commitId));
                    });
                    it('and when updateState is resolved', fakeAsync(function() {
                        ontologyStateStub.updateState.and.returnValue(of(null));
                        component.commit();
                        tick();
                        expect(catalogManagerStub.createBranchCommit).toHaveBeenCalledWith(
                            ontologyStateStub.listItem.versionedRdfRecord.branchId, ontologyStateStub.listItem.versionedRdfRecord.recordId, catalogId,
                            component.commitForm.controls.comment.value);
                        expect(ontologyStateStub.updateState).toHaveBeenCalledWith({recordId: ontologyStateStub.listItem.versionedRdfRecord.recordId,
                            commitId: commitId, branchId: ontologyStateStub.listItem.versionedRdfRecord.branchId});
                        expect(ontologyStateStub.listItem.versionedRdfRecord.commitId).toEqual(commitId);
                        expect(ontologyStateStub.clearInProgressCommit).toHaveBeenCalledWith();
                        expect(matDialogRef.close).toHaveBeenCalledWith(true);
                    }));
                    it('and when updateState is rejected', fakeAsync(function() {
                        ontologyStateStub.updateState.and.returnValue(throwError(error));
                        component.commit();
                        tick();
                        expect(catalogManagerStub.createBranchCommit).toHaveBeenCalledWith(
                            ontologyStateStub.listItem.versionedRdfRecord.branchId, ontologyStateStub.listItem.versionedRdfRecord.recordId, catalogId,
                            component.commitForm.controls.comment.value);
                        expect(ontologyStateStub.updateState).toHaveBeenCalledWith({recordId: ontologyStateStub.listItem.versionedRdfRecord.recordId, commitId: commitId, branchId: ontologyStateStub.listItem.versionedRdfRecord.branchId});
                        expect(component.error).toEqual(error);
                    }));
                });
                it('when createBranchCommit is rejected', fakeAsync(function() {
                    catalogManagerStub.createBranchCommit.and.returnValue(throwError(error));
                    component.commit();
                    tick();
                    expect(catalogManagerStub.createBranchCommit).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.branchId,
                        ontologyStateStub.listItem.versionedRdfRecord.recordId, catalogId, component.commitForm.controls.comment.value);
                    expect(ontologyStateStub.updateState).not.toHaveBeenCalled();
                    expect(component.error).toEqual(error);
                }));
            });
            describe('when upToDate is false', function() {
                beforeEach(function() {
                    ontologyStateStub.listItem.upToDate = false;
                });
                describe('when createRecordUserBranch is resolved', function() {
                    beforeEach(function() {
                        catalogManagerStub.createRecordUserBranch.and.returnValue(of(branchId));
                    });
                    describe('when getRecordBranch is resolved', function() {
                        beforeEach(function() {
                            catalogManagerStub.getRecordBranch.and.returnValue(of(branch));
                        });
                        describe('when createBranchCommit is resolved', function() {
                            beforeEach(function() {
                                catalogManagerStub.createBranchCommit.and.returnValue(of(commitId));
                            });
                            it('and when updateState is resolved', fakeAsync(function() {
                                const oldBranchId = ontologyStateStub.listItem.versionedRdfRecord.branchId;
                                const oldCommitId = ontologyStateStub.listItem.versionedRdfRecord.commitId;
                                ontologyStateStub.updateState.and.returnValue(of(null));
                                component.commit();
                                tick();
                                expect(catalogManagerStub.createRecordUserBranch).toHaveBeenCalledWith(ontologyStateStub
                                    .listItem.versionedRdfRecord.recordId, catalogId, jasmine.any(Object), oldCommitId,
                                    oldBranchId);
                                expect(catalogManagerStub.getRecordBranch).toHaveBeenCalledWith(branchId, ontologyStateStub
                                    .listItem.versionedRdfRecord.recordId, catalogId);
                                expect(ontologyStateStub.listItem.branches.length).toEqual(1);
                                expect(ontologyStateStub.listItem.branches[0]).toEqual(branch);
                                expect(ontologyStateStub.listItem.versionedRdfRecord.branchId).toEqual(branchId);
                                expect(catalogManagerStub.createBranchCommit).toHaveBeenCalledWith(
                                    ontologyStateStub.listItem.versionedRdfRecord.branchId, ontologyStateStub.listItem.versionedRdfRecord.recordId, catalogId,
                                    component.commitForm.controls.comment.value);
                                expect(ontologyStateStub.updateState).toHaveBeenCalledWith({recordId: ontologyStateStub.listItem.versionedRdfRecord.recordId, commitId: commitId, branchId: ontologyStateStub.listItem.versionedRdfRecord.branchId});
                                expect(ontologyStateStub.listItem.versionedRdfRecord.commitId).toEqual(commitId);
                                expect(ontologyStateStub.listItem.userBranch).toEqual(true);
                                expect(ontologyStateStub.clearInProgressCommit).toHaveBeenCalledWith();
                                expect(matDialogRef.close).toHaveBeenCalledWith(true);
                            }));
                            it('and when updateState is rejected', fakeAsync(function() {
                                ontologyStateStub.updateState.and.returnValue(throwError(error));
                                const oldBranchId = ontologyStateStub.listItem.versionedRdfRecord.branchId;
                                const oldCommitId = ontologyStateStub.listItem.versionedRdfRecord.commitId;
                                component.commit();
                                tick();
                                expect(catalogManagerStub.createRecordUserBranch).toHaveBeenCalledWith(ontologyStateStub
                                    .listItem.versionedRdfRecord.recordId, catalogId, jasmine.any(Object), oldCommitId,
                                    oldBranchId);
                                expect(catalogManagerStub.getRecordBranch).toHaveBeenCalledWith(branchId, ontologyStateStub
                                    .listItem.versionedRdfRecord.recordId, catalogId);
                                expect(ontologyStateStub.listItem.branches.length).toEqual(1);
                                expect(ontologyStateStub.listItem.branches[0]).toEqual(branch);
                                expect(ontologyStateStub.listItem.versionedRdfRecord.branchId).toEqual(branchId);
                                expect(catalogManagerStub.createBranchCommit).toHaveBeenCalledWith(
                                    ontologyStateStub.listItem.versionedRdfRecord.branchId, ontologyStateStub.listItem.versionedRdfRecord.recordId, catalogId,
                                    component.commitForm.controls.comment.value);
                                expect(ontologyStateStub.updateState).toHaveBeenCalledWith({recordId: ontologyStateStub.listItem.versionedRdfRecord.recordId, commitId: commitId, branchId: ontologyStateStub.listItem.versionedRdfRecord.branchId});
                                expect(component.error).toEqual(error);
                            }));
                        });
                        it('when createBranchCommit is rejected', fakeAsync(function() {
                            const oldBranchId = ontologyStateStub.listItem.versionedRdfRecord.branchId;
                            const oldCommitId = ontologyStateStub.listItem.versionedRdfRecord.commitId;
                            catalogManagerStub.createBranchCommit.and.returnValue(throwError(error));
                            component.commit();
                            tick();
                            expect(catalogManagerStub.createRecordUserBranch).toHaveBeenCalledWith(ontologyStateStub
                                .listItem.versionedRdfRecord.recordId, catalogId, jasmine.any(Object), oldCommitId,
                                oldBranchId);
                            expect(catalogManagerStub.getRecordBranch).toHaveBeenCalledWith(branchId, ontologyStateStub
                                .listItem.versionedRdfRecord.recordId, catalogId);
                            expect(ontologyStateStub.listItem.branches.length).toEqual(1);
                            expect(ontologyStateStub.listItem.branches[0]).toEqual(branch);
                            expect(ontologyStateStub.listItem.versionedRdfRecord.branchId).toEqual(branchId);
                            expect(catalogManagerStub.createBranchCommit).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.branchId,
                                ontologyStateStub.listItem.versionedRdfRecord.recordId, catalogId, component.commitForm.controls.comment.value);
                            expect(ontologyStateStub.updateState).not.toHaveBeenCalled();
                            expect(component.error).toEqual(error);
                        }));
                    });
                    it('when getRecordBranch is rejected', fakeAsync(function() {
                        catalogManagerStub.getRecordBranch.and.returnValue(throwError(error));
                        component.commit();
                        tick();
                        expect(catalogManagerStub.createRecordUserBranch).toHaveBeenCalledWith(ontologyStateStub
                            .listItem.versionedRdfRecord.recordId, catalogId, jasmine.any(Object), ontologyStateStub.listItem.versionedRdfRecord.commitId,
                            ontologyStateStub.listItem.versionedRdfRecord.branchId);
                        expect(catalogManagerStub.getRecordBranch).toHaveBeenCalledWith(branchId, ontologyStateStub
                            .listItem.versionedRdfRecord.recordId, catalogId);
                        expect(component.error).toEqual(error);
                    }));
                });
                it('when createRecordUserBranch is rejected', fakeAsync(function() {
                    catalogManagerStub.createRecordUserBranch.and.returnValue(throwError(error));
                    component.commit();
                    tick();
                    expect(catalogManagerStub.createRecordUserBranch).toHaveBeenCalledWith(ontologyStateStub
                        .listItem.versionedRdfRecord.recordId, catalogId, jasmine.any(Object), ontologyStateStub.listItem.versionedRdfRecord.commitId,
                        ontologyStateStub.listItem.versionedRdfRecord.branchId);
                    expect(catalogManagerStub.getRecordBranch).not.toHaveBeenCalled();
                    expect(component.error).toEqual(error);
                }));
            });
        });
    });
    it('should call cancel when the button is clicked', function() {
        const cancelButton = element.queryAll(By.css('.mat-dialog-actions button:not([color="primary"])'))[0];
        cancelButton.triggerEventHandler('click', null);
        fixture.detectChanges();
        expect(matDialogRef.close).toHaveBeenCalledWith(undefined);
    });
    it('should call commit when the button is clicked', function() {
        spyOn(component, 'commit');
        const submitButton = element.queryAll(By.css('.mat-dialog-actions button[color="primary"]'))[0];
        submitButton.triggerEventHandler('click', null);
        fixture.detectChanges();
        expect(component.commit).toHaveBeenCalledWith();
    });
});
