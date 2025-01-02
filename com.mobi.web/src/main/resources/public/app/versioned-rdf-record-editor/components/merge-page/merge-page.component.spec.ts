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
import { By } from '@angular/platform-browser';
import { forEach } from 'lodash';
import { MockComponent, MockProvider } from 'ng-mocks';
import { HttpResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { cleanStylesFromDOM, MockVersionedRdfState } from '../../../../test/ts/Shared';
import { BranchSelectComponent } from '../../../shared/components/branchSelect/branchSelect.component';
import { CommitDifferenceTabsetComponent } from '../../../shared/components/commitDifferenceTabset/commitDifferenceTabset.component';
import { ErrorDisplayComponent } from '../../../shared/components/errorDisplay/errorDisplay.component';
import { ResolveConflictsBlock } from '../../../shared/components/resolveConflictsBlock/resolveConflictsBlock.component';
import { Difference } from '../../../shared/models/difference.class';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { CATALOG, DCTERMS } from '../../../prefixes';
import { ToastService } from '../../../shared/services/toast.service';
import { PolicyEnforcementService } from '../../../shared/services/policyEnforcement.service';
import { UserManagerService } from '../../../shared/services/userManager.service';
import { LoginManagerService } from '../../../shared/services/loginManager.service';
import { VersionedRdfListItem } from '../../../shared/models/versionedRdfListItem.class';
import { stateServiceToken } from '../../injection-token';
import { VersionedRdfState } from '../../../shared/services/versionedRdfState.service';
import { MergePageComponent } from './merge-page.component';

describe('Merge Page component', function() {
    let component: MergePageComponent<VersionedRdfListItem>;
    let element: DebugElement;
    let fixture: ComponentFixture<MergePageComponent<VersionedRdfListItem>>;
    let stateStub: jasmine.SpyObj<VersionedRdfState<VersionedRdfListItem>>;
    let toastStub: jasmine.SpyObj<ToastService>;
    let catalogManagerStub: jasmine.SpyObj<CatalogManagerService>;
    let policyEnforcementStub: jasmine.SpyObj<PolicyEnforcementService>;

    const branch1Iri = 'branch1';
    const branch2Iri = 'branch2';
    const branch1Commit = 'branch1Commit';
    const branch2Commit = 'branch2Commit';
    const branch1Title = 'branch1Title';
    const branch2Title = 'branch2Title';
    let branch1;
    let branch2;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ 
                NoopAnimationsModule,
                FormsModule,
                ReactiveFormsModule,
                MatCheckboxModule
            ],
            declarations: [
                MergePageComponent,
                MockComponent(ErrorDisplayComponent),
                MockComponent(CommitDifferenceTabsetComponent),
                MockComponent(BranchSelectComponent),
                MockComponent(ResolveConflictsBlock)
            ],
            providers: [
                MockProvider(ToastService),
                MockProvider(CatalogManagerService),
                { provide: stateServiceToken, useClass: MockVersionedRdfState },
                MockProvider(PolicyEnforcementService),
                MockProvider(UserManagerService),
                MockProvider(LoginManagerService),
            ]
        }).compileComponents();

        catalogManagerStub = TestBed.inject(CatalogManagerService) as jasmine.SpyObj<CatalogManagerService>;
        policyEnforcementStub = TestBed.inject(PolicyEnforcementService) as jasmine.SpyObj<PolicyEnforcementService>;
        catalogManagerStub.localCatalog = {'@id': 'catalog', '@type': []};
        fixture = TestBed.createComponent(MergePageComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        stateStub = TestBed.inject(stateServiceToken) as jasmine.SpyObj<VersionedRdfState<VersionedRdfListItem>>;
        toastStub = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;

        branch1 = {
            '@id': branch1Iri,
            '@type': [],
            [`${CATALOG}head`]: [{'@id': branch1Commit}],
            [`${DCTERMS}title`]: [{'@value': branch1Title}]
        };
        branch2 = {
            '@id': branch2Iri,
            '@type': [],
            [`${CATALOG}head`]: [{'@id': branch2Commit}],
            [`${DCTERMS}title`]: [{'@value': branch2Title}]
        };

        policyEnforcementStub.evaluateRequest.and.returnValue(of('Permit'));
        policyEnforcementStub.permit = 'Permit';
        policyEnforcementStub.deny = 'Deny';
        catalogManagerStub.getRecordBranches.and.returnValue(of(new HttpResponse({body: [branch1, branch2]})));
        stateStub.listItem = new VersionedRdfListItem();
        stateStub.listItem.versionedRdfRecord = {
            recordId: 'record1',
            branchId: 'branch1',
            commitId: 'commit1',
            title: 'title'
        };
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        fixture = null;
        element = null;
        toastStub = null;
        catalogManagerStub = null;
        stateStub = null;
    });

    describe('controller methods', function() {
        describe('ngOnInit retrieves record branches',function() {
            it('successfully', fakeAsync(function() {
                component.ngOnInit();
                tick();
                expect(component.branches).toEqual([branch2]);
                expect(catalogManagerStub.getRecordBranches).toHaveBeenCalledWith('record1', 'catalog');
                expect(toastStub.createErrorToast).not.toHaveBeenCalled();
            }));
            it('unless an error occurs', fakeAsync(function() {
                catalogManagerStub.getRecordBranches.and.returnValue(throwError('Error'));
                component.ngOnInit();
                tick();
                expect(catalogManagerStub.getRecordBranches).toHaveBeenCalledWith('record1', 'catalog');
                expect(toastStub.createErrorToast).toHaveBeenCalledWith('Error');
            }));
        });
        it('ngOnDestroy resets merge', function() {
            stateStub.listItem.merge.difference = new Difference();
            stateStub.listItem.merge.startIndex = 100;
            component.ngOnDestroy();
            expect(stateStub.listItem.merge.difference).toBeUndefined();
            expect(stateStub.listItem.merge.startIndex).toEqual(0);
        });
        describe('should change target', function() {
            beforeEach(function() {
                component.catalogId = 'catalog';
            });
            it('unless an error occurs', fakeAsync(function() {
                policyEnforcementStub.evaluateRequest.and.returnValue(of('Deny'));
                catalogManagerStub.getRecordBranch.and.returnValue(of(branch2));
                stateStub.getMergeDifferences.and.returnValue(throwError('Error'));
                component.changeTarget(branch2);
                tick();

                expect(stateStub.listItem.merge.target).toEqual(branch2);
                expect(catalogManagerStub.getRecordBranch).toHaveBeenCalledWith(branch2Iri, 'record1', 'catalog');
                expect(stateStub.getMergeDifferences).toHaveBeenCalledWith('commit1', branch2Commit, catalogManagerStub.differencePageSize, 0);
                expect(toastStub.createErrorToast).toHaveBeenCalledWith('Error');
                expect(stateStub.listItem.merge.difference).toBeUndefined();
                expect(component.isSubmitDisabled).toBeTruthy();
                expect(component.error).toEqual(component.permissionMessage);
            }));
            it('successfully', fakeAsync(function() {
                policyEnforcementStub.evaluateRequest.and.returnValue(of('Permit'));
                catalogManagerStub.getRecordBranch.and.returnValue(of(branch2));
                stateStub.getMergeDifferences.and.returnValue(of(null));
                component.changeTarget(branch2);
                tick();
                expect(stateStub.listItem.merge.target).toEqual(branch2);
                expect(catalogManagerStub.getRecordBranch).toHaveBeenCalledWith(branch2Iri, 'record1', 'catalog');
                expect(stateStub.getMergeDifferences).toHaveBeenCalledWith('commit1', branch2Commit, catalogManagerStub.differencePageSize, 0);
                expect(toastStub.createErrorToast).not.toHaveBeenCalled();
                expect(component.isSubmitDisabled).toBeFalsy();
                expect(component.error).not.toEqual(component.permissionMessage);
            }));
        });
        describe('should retrieve more results', function() {
            it('successfully', fakeAsync(function() {
                stateStub.getMergeDifferences.and.returnValue(of(null));
                component.targetHeadCommitId = 'targetCommitId';
                component.retrieveMoreResults({limit: 100, offset: 100});
                tick();
                expect(stateStub.getMergeDifferences).toHaveBeenCalledWith('commit1', 'targetCommitId', 100, 100);
                expect(toastStub.createErrorToast).not.toHaveBeenCalled();
            }));
            it('unless an error occurs', fakeAsync(function() {
                stateStub.getMergeDifferences.and.returnValue(throwError('Error'));
                component.targetHeadCommitId = 'targetCommitId';
                component.retrieveMoreResults({limit: 100, offset: 100});
                tick();
                expect(stateStub.getMergeDifferences).toHaveBeenCalledWith('commit1', 'targetCommitId', 100, 100);
                expect(toastStub.createErrorToast).toHaveBeenCalledWith('Error');
            }));
        });
        describe('should submit the merge', function() {
            it('unless attemptMerge rejects', fakeAsync(function() {
                stateStub.attemptMerge.and.returnValue(throwError('Error message'));
                component.submit();
                tick();
                expect(stateStub.attemptMerge).toHaveBeenCalledWith();
                expect(toastStub.createSuccessToast).not.toHaveBeenCalled();
                expect(stateStub.cancelMerge).not.toHaveBeenCalled();
                expect(component.error).toEqual('Error message');
            }));
            it('if attemptMerge resolves', fakeAsync(function() {
                stateStub.attemptMerge.and.returnValue(of(null));
                component.submit();
                tick();
                expect(stateStub.attemptMerge).toHaveBeenCalledWith();
                expect(toastStub.createSuccessToast).toHaveBeenCalledWith(jasmine.any(String));
                expect(stateStub.cancelMerge).toHaveBeenCalledWith();
                expect(component.error).toEqual('');
            }));
        });
        describe('should submit a merge after resolving conflicts', function() {
            it('successfully', fakeAsync(function() {
                stateStub.merge.and.returnValue(of(null));
                component.submitConflictMerge();
                tick();
                expect(stateStub.merge).toHaveBeenCalledWith();
                expect(toastStub.createSuccessToast).toHaveBeenCalledWith(jasmine.any(String));
                expect(stateStub.cancelMerge).toHaveBeenCalledWith();
                expect(component.conflictError).toEqual('');
            }));
            it('unless an error occurs', fakeAsync(function() {
                stateStub.merge.and.returnValue(throwError('Error Message'));
                component.submitConflictMerge();
                tick();
                expect(stateStub.merge).toHaveBeenCalledWith();
                expect(toastStub.createSuccessToast).not.toHaveBeenCalled();
                expect(stateStub.cancelMerge).not.toHaveBeenCalled();
                expect(component.conflictError).toEqual('Error Message');
            }));
        });
        it('should cancel a merge', function() {
            component.cancelMerge();
            expect(stateStub.cancelMerge).toHaveBeenCalledWith();
        });
    });

    describe('contains the correct html', function() {
        describe('when there is not a conflict', function() {
            beforeEach(async function() {
                stateStub.listItem.merge.conflicts = [];
                fixture.detectChanges();
                await fixture.whenStable();
            });
            it('for wrapping containers', function() {
                expect(element.queryAll(By.css('.merge-page')).length).toEqual(1);
                expect(element.queryAll(By.css('.merge-block')).length).toEqual(1);
                expect(element.queryAll(By.css('resolve-conflicts-block')).length).toEqual(0);
            });
            forEach(['branch-select', 'mat-checkbox'], item => {
                it('with a ' + item, function() {
                    expect(element.queryAll(By.css(item)).length).toEqual(1);
                });
            });
            it('with a .merge-message', function() {
                expect(element.queryAll(By.css('.merge-message')).length).toEqual(1);
            });
            it('with buttons to submit and cancel', function() {
                const buttons = element.queryAll(By.css('.btn-container button'));
                expect(buttons.length).toEqual(2);
                expect(['Cancel', 'Submit'].indexOf(buttons[0].nativeElement.textContent)).toBeGreaterThanOrEqual(0);
                expect(['Cancel', 'Submit'].indexOf(buttons[1].nativeElement.textContent)).toBeGreaterThanOrEqual(0);
            });
            it('depending on whether there is an error', async function() {
                expect(element.queryAll(By.css('error-display')).length).toEqual(0);
                component.error = 'Error';
                fixture.detectChanges();
                await fixture.whenStable();
                expect(element.queryAll(By.css('error-display')).length).toEqual(1);
            });
            it('depending on whether the branch is the master branch', async function() {
                expect(element.queryAll(By.css('mat-checkbox')).length).toEqual(1);

                component.branchTitle = 'MASTER';
                fixture.detectChanges();
                await fixture.whenStable();
                expect(element.queryAll(By.css('mat-checkbox')).length).toEqual(0);
            });
            it('depending on whether a target has been selected', async function() {
                expect(element.queryAll(By.css('commit-difference-tabset')).length).toEqual(0);

                stateStub.listItem.merge.target = branch2;
                fixture.detectChanges();
                await fixture.whenStable();
                expect(element.queryAll(By.css('commit-difference-tabset')).length).toEqual(1);
            });
        });
        it('when there is a conflict', async function() {
            stateStub.listItem.merge.conflicts = [{
                iri: 'id',
                left: new Difference(),
                right: new Difference(),
                resolved: false
            }];
            fixture.detectChanges();
            await fixture.whenStable();
            expect(element.queryAll(By.css('.merge-page')).length).toEqual(1);
            expect(element.queryAll(By.css('.merge-block')).length).toEqual(0);
            expect(element.queryAll(By.css('resolve-conflicts-block')).length).toEqual(1);
        });
    });
});
