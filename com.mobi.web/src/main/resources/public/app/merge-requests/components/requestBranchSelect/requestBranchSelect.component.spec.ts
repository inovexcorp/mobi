/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2024 iNovex Information Systems, Inc.
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
import { HttpResponse } from '@angular/common/http';
import { DebugElement } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MockComponent, MockProvider } from 'ng-mocks';
import { of, throwError } from 'rxjs';

import {
    cleanStylesFromDOM,
} from '../../../../../public/test/ts/Shared';
import { BranchSelectComponent } from '../../../shared/components/branchSelect/branchSelect.component';
import { CommitDifferenceTabsetComponent } from '../../../shared/components/commitDifferenceTabset/commitDifferenceTabset.component';
import { ErrorDisplayComponent } from '../../../shared/components/errorDisplay/errorDisplay.component';
import { ProgressSpinnerService } from '../../../shared/components/progress-spinner/services/progressSpinner.service';
import { CommitDifference } from '../../../shared/models/commitDifference.interface';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { MergeRequestsStateService } from '../../../shared/services/mergeRequestsState.service';
import { ToastService } from '../../../shared/services/toast.service';
import { CATALOG, DCTERMS } from '../../../prefixes';
import { RequestBranchSelectComponent } from './requestBranchSelect.component';

describe('Request Branch Select component', function() {
    let component: RequestBranchSelectComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<RequestBranchSelectComponent>;
    let catalogManagerStub: jasmine.SpyObj<CatalogManagerService>;
    let mergeRequestsStateStub: jasmine.SpyObj<MergeRequestsStateService>;
    let progressSpinnerStub: jasmine.SpyObj<ProgressSpinnerService>;
    let toastStub: jasmine.SpyObj<ToastService>;

    const catalogId = 'catalogId';
    const recordId = 'recordId';
    const branchId = 'branchId';
    const commitId = 'commitId';
    const error = 'error';
    const branch: JSONLDObject = {
      '@id': branchId,
      [`${DCTERMS}title`]: [{ '@value': 'title' }],
      [`${CATALOG}head`]: [{ '@id': commitId }]
    };
    const branches = [branch];

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [],
            declarations: [
                RequestBranchSelectComponent,
                MockComponent(BranchSelectComponent),
                MockComponent(CommitDifferenceTabsetComponent),
                MockComponent(ErrorDisplayComponent)
            ],
            providers: [
                MockProvider(CatalogManagerService),
                MockProvider(MergeRequestsStateService),
                MockProvider(ProgressSpinnerService),
                MockProvider(ToastService),
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(RequestBranchSelectComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        catalogManagerStub = TestBed.inject(CatalogManagerService) as jasmine.SpyObj<CatalogManagerService>;
        mergeRequestsStateStub = TestBed.inject(MergeRequestsStateService) as jasmine.SpyObj<MergeRequestsStateService>;
        progressSpinnerStub = TestBed.inject(ProgressSpinnerService) as jasmine.SpyObj<ProgressSpinnerService>;
        toastStub = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;

        catalogManagerStub.localCatalog = {'@id': catalogId};
        catalogManagerStub.differencePageSize = 100;
        catalogManagerStub.getRecordBranches.and.returnValue(of(new HttpResponse<JSONLDObject[]>({body: branches})));
        mergeRequestsStateStub.requestConfig = {
            title: '',
            recordId: '',
            sourceBranchId: '',
            targetBranchId: '',
            removeSource: false
        };
        mergeRequestsStateStub.updateRequestConfigDifference.and.returnValue(of(null));
        mergeRequestsStateStub.requestConfig.recordId = recordId;
        mergeRequestsStateStub.selectedRecord = {
          '@id': recordId,
          [`${DCTERMS}title`]: [{ '@value': 'title' }]
        };
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        mergeRequestsStateStub = null;
        catalogManagerStub = null;
        toastStub = null;
    });

    describe('should initialize with the correct values when', function() {
        describe('getRecordBranches resolves and branches are set', function() {
            beforeEach(function() {
                mergeRequestsStateStub.requestConfig.sourceBranch = branch;
                mergeRequestsStateStub.requestConfig.targetBranch = branch;
            });
            it('and the difference is set successfully', fakeAsync(function() {
                component.ngOnInit();
                tick();
                expect(mergeRequestsStateStub.clearDifference).toHaveBeenCalledWith();
                expect(component.recordTitle).toEqual('title');
                expect(catalogManagerStub.getRecordBranches).toHaveBeenCalledWith(recordId, catalogId);
                expect(mergeRequestsStateStub.updateRequestConfigBranch).toHaveBeenCalledWith('sourceBranch', branches);
                expect(mergeRequestsStateStub.updateRequestConfigBranch).toHaveBeenCalledWith('targetBranch', branches);
                expect(component.branches).toEqual(branches);
                expect(component.sourceBranchTitle).toEqual('title');
                expect(component.sourceCommitId).toEqual(commitId);
                expect(component.targetCommitId).toEqual(commitId);
                expect(progressSpinnerStub.startLoadingForComponent).toHaveBeenCalledWith(component.commitDifferenceTabset);
                expect(mergeRequestsStateStub.updateRequestConfigDifference).toHaveBeenCalledWith();
                expect(progressSpinnerStub.finishLoadingForComponent).toHaveBeenCalledWith(component.commitDifferenceTabset);
            }));
            it('and fetching the difference fails', fakeAsync(function() {
                mergeRequestsStateStub.updateRequestConfigDifference.and.returnValue(throwError(error));
                component.ngOnInit();
                tick();
                expect(mergeRequestsStateStub.clearDifference).toHaveBeenCalledWith();
                expect(component.recordTitle).toEqual('title');
                expect(catalogManagerStub.getRecordBranches).toHaveBeenCalledWith(recordId, catalogId);
                expect(mergeRequestsStateStub.updateRequestConfigBranch).toHaveBeenCalledWith('sourceBranch', branches);
                expect(mergeRequestsStateStub.updateRequestConfigBranch).toHaveBeenCalledWith('targetBranch', branches);
                expect(component.branches).toEqual([]);
                expect(component.sourceBranchTitle).toEqual('title');
                expect(component.sourceCommitId).toEqual(commitId);
                expect(component.targetCommitId).toEqual(commitId);
                expect(progressSpinnerStub.startLoadingForComponent).toHaveBeenCalledWith(component.commitDifferenceTabset);
                expect(mergeRequestsStateStub.updateRequestConfigDifference).toHaveBeenCalledWith();
                expect(progressSpinnerStub.finishLoadingForComponent).toHaveBeenCalledWith(component.commitDifferenceTabset);
            }));
        });
        it('getRecordBranches resolves and a branch is not set', fakeAsync(function() {
            mergeRequestsStateStub.requestConfig.sourceBranch = branch;
            mergeRequestsStateStub.requestConfig.targetBranch = undefined;
            component.ngOnInit();
            tick();
            expect(mergeRequestsStateStub.clearDifference).toHaveBeenCalledWith();
            expect(component.recordTitle).toEqual('title');
            expect(catalogManagerStub.getRecordBranches).toHaveBeenCalledWith(recordId, catalogId);
            expect(mergeRequestsStateStub.updateRequestConfigBranch).toHaveBeenCalledWith('sourceBranch', branches);
            expect(mergeRequestsStateStub.updateRequestConfigBranch).toHaveBeenCalledWith('targetBranch', branches);
            expect(mergeRequestsStateStub.updateRequestConfigDifference).not.toHaveBeenCalled();
            expect(component.branches).toEqual(branches);
            expect(component.sourceBranchTitle).toEqual('');
            expect(component.sourceCommitId).toEqual('');
            expect(component.targetCommitId).toEqual('');
        }));
        it('getRecordBranches rejects', fakeAsync(function() {
            catalogManagerStub.getRecordBranches.and.returnValue(throwError(error));
            component.ngOnInit();
            tick();
            expect(mergeRequestsStateStub.clearDifference).toHaveBeenCalledWith();
            expect(component.recordTitle).toEqual('title');
            expect(catalogManagerStub.getRecordBranches).toHaveBeenCalledWith(recordId, catalogId);
            expect(component.branches).toEqual([]);
            expect(mergeRequestsStateStub.updateRequestConfigBranch).not.toHaveBeenCalled();
            expect(mergeRequestsStateStub.updateRequestConfigBranch).not.toHaveBeenCalled();
            expect(toastStub.createErrorToast).toHaveBeenCalledWith(error);
        }));
    });
    it('should clean up on destroy', function() {
        component.ngOnDestroy();
        expect(mergeRequestsStateStub.sameBranch).toBeFalse();
        expect(mergeRequestsStateStub.clearDifference).toHaveBeenCalledWith();
    });
    describe('controller methods', function() {
        describe('should handle changing the target branch', function() {
            describe('if one has been selected and source branch is', function() {
                describe('set', function() {
                    it('and is the same', fakeAsync(function() {
                        mergeRequestsStateStub.requestConfig.sourceBranch = branch;
                        component.changeTargetBranch(branch);
                        tick();
                        expect(mergeRequestsStateStub.requestConfig.targetBranch).toEqual(branch);
                        expect(mergeRequestsStateStub.clearDifference).toHaveBeenCalledWith();
                        expect(component.targetCommitId).toEqual(commitId);
                        expect(mergeRequestsStateStub.requestConfig.targetBranchId).toEqual(branchId);
                        expect(mergeRequestsStateStub.sameBranch).toBeTrue();
                        expect(mergeRequestsStateStub.updateRequestConfigDifference).toHaveBeenCalledWith();
                        expect(progressSpinnerStub.startLoadingForComponent).toHaveBeenCalledWith(component.commitDifferenceTabset);
                        expect(progressSpinnerStub.finishLoadingForComponent).toHaveBeenCalledWith(component.commitDifferenceTabset);
                    }));
                    it('and is not the same', fakeAsync(function() {
                        mergeRequestsStateStub.requestConfig.sourceBranch = {
                          '@id': 'other',
                          [`${DCTERMS}title`]: [{ '@value': 'title' }]
                        };
                        component.changeTargetBranch(branch);
                        tick();
                        expect(mergeRequestsStateStub.requestConfig.targetBranch).toEqual(branch);
                        expect(mergeRequestsStateStub.clearDifference).toHaveBeenCalledWith();
                        expect(component.targetCommitId).toEqual(commitId);
                        expect(mergeRequestsStateStub.requestConfig.targetBranchId).toEqual(branchId);
                        expect(mergeRequestsStateStub.sameBranch).toBeFalse();
                        expect(mergeRequestsStateStub.updateRequestConfigDifference).toHaveBeenCalledWith();
                        expect(progressSpinnerStub.startLoadingForComponent).toHaveBeenCalledWith(component.commitDifferenceTabset);
                        expect(progressSpinnerStub.finishLoadingForComponent).toHaveBeenCalledWith(component.commitDifferenceTabset);
                    }));
                });
                it('not set', fakeAsync(function() {
                    component.changeTargetBranch(branch);
                    tick();
                    expect(mergeRequestsStateStub.requestConfig.targetBranch).toEqual(branch);
                    expect(mergeRequestsStateStub.clearDifference).toHaveBeenCalledWith();
                    expect(component.targetCommitId).toEqual(commitId);
                    expect(mergeRequestsStateStub.requestConfig.targetBranchId).toEqual(branchId);
                    expect(mergeRequestsStateStub.updateRequestConfigDifference).not.toHaveBeenCalled();
                    expect(mergeRequestsStateStub.sameBranch).toBeFalse();
                    expect(mergeRequestsStateStub.difference).toBeUndefined();
                }));
            });
            it('if one has not been selected', fakeAsync(function() {
                component.changeTargetBranch(undefined);
                tick();
                expect(mergeRequestsStateStub.requestConfig.targetBranch).toBeUndefined();
                expect(mergeRequestsStateStub.clearDifference).toHaveBeenCalledWith();
                expect(mergeRequestsStateStub.requestConfig.targetBranchId).toEqual('');
                expect(component.targetCommitId).toEqual('');
                expect(mergeRequestsStateStub.sameBranch).toBeFalse();
                expect(mergeRequestsStateStub.updateRequestConfigDifference).not.toHaveBeenCalled();
            }));
        });
        describe('should handle changing the source branch', function() {
            describe('if one has been selected and target branch is', function() {
                describe('set', function() {
                    it('and is the same', fakeAsync(function() {
                        mergeRequestsStateStub.requestConfig.targetBranch = branch;
                        component.changeSourceBranch(branch);
                        tick();
                        expect(mergeRequestsStateStub.requestConfig.sourceBranch).toEqual(branch);
                        expect(mergeRequestsStateStub.clearDifference).toHaveBeenCalledWith();
                        expect(component.sourceBranchTitle).toEqual('title');
                        expect(component.sourceCommitId).toEqual(commitId);
                        expect(mergeRequestsStateStub.requestConfig.sourceBranchId).toEqual(branchId);
                        expect(mergeRequestsStateStub.sameBranch).toBeTrue();
                        expect(mergeRequestsStateStub.updateRequestConfigDifference).toHaveBeenCalledWith();
                        expect(progressSpinnerStub.startLoadingForComponent).toHaveBeenCalledWith(component.commitDifferenceTabset);
                        expect(progressSpinnerStub.finishLoadingForComponent).toHaveBeenCalledWith(component.commitDifferenceTabset);
                    }));
                    it('and is not the same', fakeAsync(function() {
                        mergeRequestsStateStub.requestConfig.targetBranch = {
                          '@id': 'other',
                          [`${DCTERMS}title`]: [{ '@value': 'title' }]
                        };
                        component.changeSourceBranch(branch);
                        tick();
                        expect(mergeRequestsStateStub.requestConfig.sourceBranch).toEqual(branch);
                        expect(mergeRequestsStateStub.clearDifference).toHaveBeenCalledWith();
                        expect(component.sourceBranchTitle).toEqual('title');
                        expect(component.sourceCommitId).toEqual(commitId);
                        expect(mergeRequestsStateStub.requestConfig.sourceBranchId).toEqual(branchId);
                        expect(mergeRequestsStateStub.sameBranch).toBeFalse();
                        expect(mergeRequestsStateStub.updateRequestConfigDifference).toHaveBeenCalledWith();
                        expect(progressSpinnerStub.startLoadingForComponent).toHaveBeenCalledWith(component.commitDifferenceTabset);
                        expect(progressSpinnerStub.finishLoadingForComponent).toHaveBeenCalledWith(component.commitDifferenceTabset);
                    }));
                });
                it('not set', fakeAsync(function() {
                    component.changeSourceBranch(branch);
                    tick();
                    expect(mergeRequestsStateStub.requestConfig.sourceBranch).toEqual(branch);
                    expect(mergeRequestsStateStub.clearDifference).toHaveBeenCalledWith();
                    expect(component.sourceBranchTitle).toEqual('title');
                    expect(component.sourceCommitId).toEqual(commitId);
                    expect(mergeRequestsStateStub.requestConfig.sourceBranchId).toEqual(branchId);
                    expect(mergeRequestsStateStub.difference).toBeUndefined();
                    expect(mergeRequestsStateStub.sameBranch).toBeFalse();
                    expect(mergeRequestsStateStub.updateRequestConfigDifference).not.toHaveBeenCalled();
                }));
            });
            it('if one has not been selected', fakeAsync(function() {
                component.changeSourceBranch(undefined);
                tick();
                expect(mergeRequestsStateStub.requestConfig.sourceBranch).toBeUndefined();
                expect(mergeRequestsStateStub.clearDifference).toHaveBeenCalledWith();
                expect(component.sourceBranchTitle).toEqual('');
                expect(component.sourceCommitId).toEqual('');
                expect(mergeRequestsStateStub.requestConfig.sourceBranchId).toEqual('');
                expect(mergeRequestsStateStub.sameBranch).toBeFalse();
                expect(mergeRequestsStateStub.updateRequestConfigDifference).not.toHaveBeenCalled();
            }));
        });
        it('get an entity\'s name', function() {
            mergeRequestsStateStub.getEntityNameLabel.and.returnValue('label');
            expect(component.getEntityName(commitId)).toEqual('label');
            expect(mergeRequestsStateStub.getEntityNameLabel).toHaveBeenCalledWith(commitId);
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.request-branch-select')).length).toEqual(1);
            expect(element.queryAll(By.css('.form-container')).length).toEqual(1);
        });
        it('depending on whether the same branch is selected', function() {
            fixture.detectChanges();
            expect(element.queryAll(By.css('error-display')).length).toEqual(0);
            
            mergeRequestsStateStub.sameBranch = true;
            fixture.detectChanges();
            expect(element.queryAll(By.css('error-display')).length).toEqual(1);
        });
        it('depending on whether there is a difference', function() {
            fixture.detectChanges();
            expect(element.queryAll(By.css('commit-difference-tabset')).length).toEqual(0);

            mergeRequestsStateStub.difference = new CommitDifference();
            fixture.detectChanges();
            expect(element.queryAll(By.css('commit-difference-tabset')).length).toEqual(1);
        });
        it('with branch-selects', function() {
            expect(element.queryAll(By.css('branch-select')).length).toEqual(2);
        });
    });
});
