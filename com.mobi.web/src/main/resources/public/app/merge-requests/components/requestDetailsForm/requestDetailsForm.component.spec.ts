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
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MockComponent, MockProvider } from 'ng-mocks';
import { of, throwError } from 'rxjs';

import {
    cleanStylesFromDOM,
} from '../../../../../public/test/ts/Shared';
import { CommitDifferenceTabsetComponent } from '../../../shared/components/commitDifferenceTabset/commitDifferenceTabset.component';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { MergeRequestsStateService } from '../../../shared/services/mergeRequestsState.service';
import { ToastService } from '../../../shared/services/toast.service';
import { AssigneeInputComponent } from '../assigneeInput/assigneeInput.component';
import { CATALOG, DCTERMS } from '../../../prefixes';
import { RequestDetailsFormComponent } from './requestDetailsForm.component';

describe('Request Details Form component', function() {
    let component: RequestDetailsFormComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<RequestDetailsFormComponent>;
    let catalogManagerStub: jasmine.SpyObj<CatalogManagerService>;
    let mergeRequestsStateStub: jasmine.SpyObj<MergeRequestsStateService>;
    let toastStub: jasmine.SpyObj<ToastService>;

    const catalogId = 'catalogId';
    const recordId = 'recordId';
    const branchId = 'branchId';
    const commitId = 'commitId';
    const branch = {
      '@id': branchId,
      [`${DCTERMS}title`]: [{ '@value': 'title' }],
      [`${CATALOG}head`]: [{ '@id': commitId }]
    };
    const branches = [branch];
    const error = 'error';
  
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                NoopAnimationsModule,
                FormsModule,
                ReactiveFormsModule,
                MatFormFieldModule,
                MatInputModule,
                MatButtonModule,
                MatCheckboxModule,
            ],
            declarations: [
                RequestDetailsFormComponent,
                MockComponent(AssigneeInputComponent),
                MockComponent(CommitDifferenceTabsetComponent)
            ],
            providers: [
                MockProvider(CatalogManagerService),
                MockProvider(MergeRequestsStateService),
                MockProvider(ToastService),
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(RequestDetailsFormComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        catalogManagerStub = TestBed.inject(CatalogManagerService) as jasmine.SpyObj<CatalogManagerService>;
        mergeRequestsStateStub = TestBed.inject(MergeRequestsStateService) as  jasmine.SpyObj<MergeRequestsStateService>;
        toastStub = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;

        catalogManagerStub.localCatalog = {'@id': catalogId};
        catalogManagerStub.getRecordBranches.and.returnValue(of(new HttpResponse<JSONLDObject[]>({body: branches})));
        mergeRequestsStateStub.requestConfig = {
            title: '',
            recordId,
            sourceBranchId: branchId,
            targetBranchId: branchId,
            removeSource: false
        };
        mergeRequestsStateStub.updateRequestConfigDifference.and.returnValue(of(null));
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
        beforeEach(function() {
            mergeRequestsStateStub.createRequestStep = 2;
        });
        it('getRecordBranches resolves and branches are set', fakeAsync(function() {
            mergeRequestsStateStub.requestConfig.sourceBranch = branch;
            mergeRequestsStateStub.requestConfig.targetBranch = branch;
            component.ngOnInit();
            tick();
            expect(mergeRequestsStateStub.clearDifference).toHaveBeenCalledWith();
            expect(component.recordTitle).toEqual('title');
            expect(mergeRequestsStateStub.requestConfig.title).toEqual('title');
            expect(catalogManagerStub.getRecordBranches).toHaveBeenCalledWith(recordId, catalogId);
            expect(mergeRequestsStateStub.updateRequestConfigBranch).toHaveBeenCalledWith('sourceBranch', branches);
            expect(mergeRequestsStateStub.updateRequestConfigBranch).toHaveBeenCalledWith('targetBranch', branches);
            expect(component.branchTitle).toEqual('title');
            expect(component.sourceCommitId).toEqual(commitId);
            expect(component.targetBranchTitle).toEqual('title');
            expect(component.targetCommitId).toEqual(commitId);
            expect(mergeRequestsStateStub.updateRequestConfigDifference).toHaveBeenCalledWith();
            expect(mergeRequestsStateStub.createRequestStep).toEqual(2);
        }));
        it('getRecordBranches resolves and a branch is not set', fakeAsync(function() {
            mergeRequestsStateStub.requestConfig.sourceBranch = branch;
            mergeRequestsStateStub.requestConfig.targetBranch = undefined;
            mergeRequestsStateStub.createRequestStep = 2;
            component.ngOnInit();
            tick();
            expect(mergeRequestsStateStub.clearDifference).toHaveBeenCalledWith();
            expect(component.recordTitle).toEqual('title');
            expect(mergeRequestsStateStub.requestConfig.title).toEqual('title');
            expect(catalogManagerStub.getRecordBranches).toHaveBeenCalledWith(recordId, catalogId);
            expect(mergeRequestsStateStub.updateRequestConfigBranch).toHaveBeenCalledWith('sourceBranch', branches);
            expect(mergeRequestsStateStub.updateRequestConfigBranch).toHaveBeenCalledWith('targetBranch', branches);
            expect(mergeRequestsStateStub.updateRequestConfigDifference).not.toHaveBeenCalled();
            expect(mergeRequestsStateStub.createRequestStep).toEqual(1);
            expect(mergeRequestsStateStub.difference).toBeUndefined();
            expect(toastStub.createErrorToast).toHaveBeenCalledWith('Branch was deleted');
        }));
        it('getRecordBranches rejects', fakeAsync(function() {
            catalogManagerStub.getRecordBranches.and.returnValue(throwError(error));
            component.ngOnInit();
            tick();
            expect(mergeRequestsStateStub.clearDifference).toHaveBeenCalledWith();
            expect(component.recordTitle).toEqual('title');
            expect(mergeRequestsStateStub.requestConfig.title).toEqual('');
            expect(catalogManagerStub.getRecordBranches).toHaveBeenCalledWith(recordId, catalogId);
            expect(mergeRequestsStateStub.updateRequestConfigBranch).not.toHaveBeenCalled();
            expect(mergeRequestsStateStub.updateRequestConfigBranch).not.toHaveBeenCalled();
            expect(toastStub.createErrorToast).toHaveBeenCalledWith(error);
        }));
    });
    it('cleans up on destroy', function() {
        component.ngOnDestroy();
        expect(mergeRequestsStateStub.clearDifference).toHaveBeenCalledWith();
    });
    describe('controller methods', function() {
        it('get an entity\'s name', function() {
            mergeRequestsStateStub.getEntityNameLabel.and.returnValue('label');
            expect(component.getEntityName(commitId)).toEqual('label');
            expect(mergeRequestsStateStub.getEntityNameLabel).toHaveBeenCalledWith(commitId);
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.request-details-form')).length).toEqual(1);
            expect(element.queryAll(By.css('.details-form-container')).length).toEqual(1);
            expect(element.queryAll(By.css('.summary-line')).length).toEqual(1);
        });
        ['input[name="title"]', 'textarea', '.summary-line', 'commit-difference-tabset', 'assignee-input'].forEach(test => {
            it('with a ' + test, function() {
                expect(element.queryAll(By.css(test)).length).toEqual(1);
            });
        });
        it('with mat-form-fields', function() {
            expect(element.queryAll(By.css('mat-form-field')).length).toEqual(2);
        });
        it('depending on whether the source branch is the MASTER branch', function() {
            fixture.detectChanges();
            expect(element.queryAll(By.css('mat-checkbox')).length).toEqual(1);

            component.branchTitle = 'MASTER';
            fixture.detectChanges();
            expect(element.queryAll(By.css('mat-checkbox')).length).toEqual(0);
        });
    });
});
