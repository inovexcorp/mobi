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
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MockComponent, MockProvider } from 'ng-mocks';
import { By } from '@angular/platform-browser';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { of, throwError } from 'rxjs';

import { cleanStylesFromDOM, MockVersionedRdfState } from '../../../../test/ts/Shared';
import { ErrorDisplayComponent } from '../../../shared/components/errorDisplay/errorDisplay.component';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { CATALOG } from '../../../prefixes';
import { ToastService } from '../../../shared/services/toast.service';
import { VersionedRdfListItem } from '../../../shared/models/versionedRdfListItem.class';
import { VersionedRdfState } from '../../../shared/services/versionedRdfState.service';
import { stateServiceToken } from '../../injection-token';
import { CommitModalComponent } from './commit-modal.component';

describe('Commit Modal component', function() {
    let component: CommitModalComponent<VersionedRdfListItem>;
    let element: DebugElement;
    let fixture: ComponentFixture<CommitModalComponent<VersionedRdfListItem>>;
    let matDialogRef: jasmine.SpyObj<MatDialogRef<CommitModalComponent<VersionedRdfListItem>>>;
    let stateStub: jasmine.SpyObj<VersionedRdfState<VersionedRdfListItem>>;
    let catalogManagerStub: jasmine.SpyObj<CatalogManagerService>;
    let toastStub: jasmine.SpyObj<ToastService>;
    
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
                CommitModalComponent,
                MockComponent(ErrorDisplayComponent)
            ],
            providers: [
                { provide: MatDialogRef, useFactory: () => jasmine.createSpyObj('MatDialogRef', ['close'])},
                MockProvider(CatalogManagerService),
                MockProvider(ToastService),
                { provide: stateServiceToken, useClass: MockVersionedRdfState }
            ]
        });

        fixture = TestBed.createComponent(CommitModalComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        matDialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<CommitModalComponent<VersionedRdfListItem>>>;
        stateStub = TestBed.inject(stateServiceToken) as jasmine.SpyObj<VersionedRdfState<VersionedRdfListItem>>;
        stateStub.listItem = new VersionedRdfListItem();
        stateStub.listItem.versionedRdfRecord = {
            recordId: 'record1',
            branchId: 'branch1',
            commitId: 'commit1',
            title: 'title'
        };
        stateStub.changeVersion.and.returnValue(of(null));
        component.catalogId = 'catalog';
        catalogManagerStub = TestBed.inject(CatalogManagerService) as jasmine.SpyObj<CatalogManagerService>;
        catalogManagerStub.localCatalog = {'@id': 'catalog', '@type': []};
        catalogManagerStub.getRecordBranch.and.returnValue(of(
            {
                '@id': 'id',
                '@type': [],
                [`${CATALOG}head`]: [{'@id': 'commit1'}]
            } as JSONLDObject));
        toastStub = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        matDialogRef = null;
        stateStub = null;
        catalogManagerStub = null;
        toastStub = null;
    });

    describe('controller methods', function() {
        describe('should commit changes on a versioned RDF record and close the dialog',  function() {
            it('successfully', async function() {
                catalogManagerStub.createBranchCommit.and.returnValue(of('urn:newCommitIri'));
                stateStub.listItem.versionedRdfRecord.commitId = 'urn:originalCommitIri';
                component.createCommitForm.controls['comment'].setValue('testComment');
                component.createCommit('branch1');
                fixture.detectChanges();
                await fixture.whenStable();

                expect(catalogManagerStub.createBranchCommit).toHaveBeenCalledWith('branch1', 'record1', 'catalog', 'testComment');
                expect(stateStub.changeVersion).toHaveBeenCalledWith('record1', 'branch1', 'urn:newCommitIri', undefined, undefined, true, true, undefined);
                expect(matDialogRef.close).toHaveBeenCalledWith(true);
            });
            it('unless an error occurs', async function() {
                catalogManagerStub.createBranchCommit.and.returnValue(throwError('There was an error'));
                stateStub.listItem.versionedRdfRecord.commitId = 'urn:originalCommitIri';
                component.createCommitForm.controls['comment'].setValue('testComment');
                component.createCommit('branch1');
                fixture.detectChanges();
                await fixture.whenStable();

                expect(catalogManagerStub.createBranchCommit).toHaveBeenCalledWith('branch1', 'record1', 'catalog', 'testComment');
                expect(stateStub.changeVersion).not.toHaveBeenCalled();
                expect(stateStub.listItem.versionedRdfRecord.commitId).toEqual('urn:originalCommitIri');
                expect(component.errorMessage).toEqual('There was an error');
                expect(matDialogRef.close).not.toHaveBeenCalled();
            });
        });
        describe('should create a commit if',  function() {
            describe('getRecordBranch', function() {
                describe('returns successfully', function() {
                    it('the branch is up to date', fakeAsync(function() {
                        spyOn(component, 'createCommit');
                        component.commit();
                        tick();
                        expect(component.createCommit).toHaveBeenCalledWith(stateStub.listItem.versionedRdfRecord.branchId);
                        expect(stateStub.listItem.upToDate).toBeTrue();
                        expect(component.errorMessage).toEqual('');
                    }));
                  // TODO: Bring this back in when user branch stuff is setup
                  //   describe('when upToDate is false', function() {
                  //     beforeEach(function() {
                  //         ontologyStateStub.listItem.upToDate = false;
                  //         ontologyStateStub.listItem.branches = [{
                  //             '@id': ontologyStateStub.listItem.versionedRdfRecord.branchId,
                  //             [`${DCTERMS}title`]: [{ '@value': 'title'}],
                  //             [`${DCTERMS}description`]: [{ '@value': 'description'}]
                  //         }];
                  //     });
                  //     describe('when createRecordUserBranch is resolved', function() {
                  //         beforeEach(function() {
                  //             catalogManagerStub.createRecordUserBranch.and.returnValue(of(branchId));
                  //         });
                  //         describe('when getRecordBranch is resolved', function() {
                  //             beforeEach(function() {
                  //                 catalogManagerStub.getRecordBranch.and.returnValue(of(branch));
                  //             });
                  //             describe('when createBranchCommit is resolved', function() {
                  //                 beforeEach(function() {
                  //                     catalogManagerStub.createBranchCommit.and.returnValue(of(commitId));
                  //                 });
                  //                 it('and when updateState is resolved', fakeAsync(function() {
                  //                     const oldBranchId = ontologyStateStub.listItem.versionedRdfRecord.branchId;
                  //                     const oldCommitId = ontologyStateStub.listItem.versionedRdfRecord.commitId;
                  //                     ontologyStateStub.updateState.and.returnValue(of(null));
                  //                     component.commit();
                  //                     tick();
                  //                     expect(catalogManagerStub.createRecordUserBranch).toHaveBeenCalledWith(ontologyStateStub
                  //                         .listItem.versionedRdfRecord.recordId, catalogId, { title: 'title', description: 'description' }, 
                  //                         oldCommitId, oldBranchId);
                  //                     expect(catalogManagerStub.getRecordBranch).toHaveBeenCalledWith(branchId, ontologyStateStub
                  //                         .listItem.versionedRdfRecord.recordId, catalogId);
                  //                     expect(ontologyStateStub.listItem.branches.length).toEqual(2);
                  //                     expect(ontologyStateStub.listItem.branches.includes(branch)).toBeTrue();
                  //                     expect(ontologyStateStub.listItem.versionedRdfRecord.branchId).toEqual(branchId);
                  //                     expect(catalogManagerStub.createBranchCommit).toHaveBeenCalledWith(
                  //                         ontologyStateStub.listItem.versionedRdfRecord.branchId, ontologyStateStub.listItem.versionedRdfRecord.recordId, catalogId,
                  //                         component.commitForm.controls.comment.value);
                  //                     expect(ontologyStateStub.updateState).toHaveBeenCalledWith({recordId: ontologyStateStub.listItem.versionedRdfRecord.recordId, commitId: commitId, branchId: ontologyStateStub.listItem.versionedRdfRecord.branchId});
                  //                     expect(ontologyStateStub.listItem.versionedRdfRecord.commitId).toEqual(commitId);
                  //                     expect(ontologyStateStub.listItem.userBranch).toEqual(true);
                  //                     expect(ontologyStateStub.clearInProgressCommit).toHaveBeenCalledWith();
                  //                     expect(matDialogRef.close).toHaveBeenCalledWith(true);
                  //                 }));
                  //                 it('and when updateState is rejected', fakeAsync(function() {
                  //                     ontologyStateStub.updateState.and.returnValue(throwError(error));
                  //                     const oldBranchId = ontologyStateStub.listItem.versionedRdfRecord.branchId;
                  //                     const oldCommitId = ontologyStateStub.listItem.versionedRdfRecord.commitId;
                  //                     component.commit();
                  //                     tick();
                  //                     expect(catalogManagerStub.createRecordUserBranch).toHaveBeenCalledWith(ontologyStateStub
                  //                         .listItem.versionedRdfRecord.recordId, catalogId, { title: 'title', description: 'description' },
                  //                         oldCommitId, oldBranchId);
                  //                     expect(catalogManagerStub.getRecordBranch).toHaveBeenCalledWith(branchId, ontologyStateStub
                  //                         .listItem.versionedRdfRecord.recordId, catalogId);
                  //                     expect(ontologyStateStub.listItem.branches.length).toEqual(2);
                  //                     expect(ontologyStateStub.listItem.branches.includes(branch)).toBeTrue();
                  //                     expect(ontologyStateStub.listItem.versionedRdfRecord.branchId).toEqual(branchId);
                  //                     expect(catalogManagerStub.createBranchCommit).toHaveBeenCalledWith(
                  //                         ontologyStateStub.listItem.versionedRdfRecord.branchId, ontologyStateStub.listItem.versionedRdfRecord.recordId, catalogId,
                  //                         component.commitForm.controls.comment.value);
                  //                     expect(ontologyStateStub.updateState).toHaveBeenCalledWith({recordId: ontologyStateStub.listItem.versionedRdfRecord.recordId, commitId: commitId, branchId: ontologyStateStub.listItem.versionedRdfRecord.branchId});
                  //                     expect(component.error).toEqual(error);
                  //                 }));
                  //             });
                  //             it('when createBranchCommit is rejected', fakeAsync(function() {
                  //                 const oldBranchId = ontologyStateStub.listItem.versionedRdfRecord.branchId;
                  //                 const oldCommitId = ontologyStateStub.listItem.versionedRdfRecord.commitId;
                  //                 catalogManagerStub.createBranchCommit.and.returnValue(throwError(error));
                  //                 component.commit();
                  //                 tick();
                  //                 expect(catalogManagerStub.createRecordUserBranch).toHaveBeenCalledWith(ontologyStateStub
                  //                     .listItem.versionedRdfRecord.recordId, catalogId, { title: 'title', description: 'description' }, 
                  //                     oldCommitId, oldBranchId);
                  //                 expect(catalogManagerStub.getRecordBranch).toHaveBeenCalledWith(branchId, ontologyStateStub
                  //                     .listItem.versionedRdfRecord.recordId, catalogId);
                  //                 expect(ontologyStateStub.listItem.branches.length).toEqual(2);
                  //                   expect(ontologyStateStub.listItem.branches.includes(branch)).toBeTrue();
                  //                 expect(ontologyStateStub.listItem.versionedRdfRecord.branchId).toEqual(branchId);
                  //                 expect(catalogManagerStub.createBranchCommit).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.branchId,
                  //                     ontologyStateStub.listItem.versionedRdfRecord.recordId, catalogId, component.commitForm.controls.comment.value);
                  //                 expect(ontologyStateStub.updateState).not.toHaveBeenCalled();
                  //                 expect(component.error).toEqual(error);
                  //             }));
                  //         });
                  //         it('when getRecordBranch is rejected', fakeAsync(function() {
                  //             catalogManagerStub.getRecordBranch.and.returnValue(throwError(error));
                  //             component.commit();
                  //             tick();
                  //             expect(catalogManagerStub.createRecordUserBranch).toHaveBeenCalledWith(ontologyStateStub
                  //                 .listItem.versionedRdfRecord.recordId, catalogId, { title: 'title', description: 'description' },
                  //                 ontologyStateStub.listItem.versionedRdfRecord.commitId,
                  //                 ontologyStateStub.listItem.versionedRdfRecord.branchId);
                  //             expect(catalogManagerStub.getRecordBranch).toHaveBeenCalledWith(branchId, ontologyStateStub
                  //                 .listItem.versionedRdfRecord.recordId, catalogId);
                  //             expect(component.error).toEqual(error);
                  //         }));
                  //     });
                  //     it('when createRecordUserBranch is rejected', fakeAsync(function() {
                  //         catalogManagerStub.createRecordUserBranch.and.returnValue(throwError(error));
                  //         component.commit();
                  //         tick();
                  //         expect(catalogManagerStub.createRecordUserBranch).toHaveBeenCalledWith(ontologyStateStub
                  //             .listItem.versionedRdfRecord.recordId, catalogId, jasmine.any(Object), ontologyStateStub.listItem.versionedRdfRecord.commitId,
                  //             ontologyStateStub.listItem.versionedRdfRecord.branchId);
                  //         expect(catalogManagerStub.getRecordBranch).not.toHaveBeenCalled();
                  //         expect(component.error).toEqual(error);
                  //     }));
                  // });
                    it('not create a commit if the branch is up to date', fakeAsync(function() {
                        catalogManagerStub.getRecordBranch.and.returnValue(of(
                            {
                                '@id': 'id',
                                '@type': [],
                                [`${CATALOG}head`]: [{'@id': 'commit2'}]
                            } as JSONLDObject));
                        spyOn(component, 'createCommit');
                        component.commit();
                        tick();
                        expect(component.createCommit).not.toHaveBeenCalled();
                        expect(component.errorMessage).toEqual('Cannot commit. Branch is behind HEAD. Please update.');
                    }));
                });
                it('rejects', fakeAsync(function() {
                    spyOn(component, 'createCommit');
                    catalogManagerStub.getRecordBranch.and.returnValue(throwError('Error'));
                    component.commit();
                    tick();
                    expect(toastStub.createErrorToast).toHaveBeenCalledWith('Error');
                    expect(component.createCommit).not.toHaveBeenCalled();
                    expect(component.errorMessage).toEqual('');
                }));
            });
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('h1[mat-dialog-title]')).length).toEqual(1);
            expect(element.queryAll(By.css('form[mat-dialog-content]')).length).toEqual(1);
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
        expect(component.commit).toHaveBeenCalledWith();
    });
});
