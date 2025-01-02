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
import { MockComponent, MockProvider } from 'ng-mocks';
import { of, throwError } from 'rxjs';

import {
    cleanStylesFromDOM,
} from '../../../../../public/test/ts/Shared';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { MergeRequestManagerService } from '../../../shared/services/mergeRequestManager.service';
import { MergeRequestsStateService } from '../../../shared/services/mergeRequestsState.service';
import { SharedModule } from '../../../shared/shared.module';
import { RequestBranchSelectComponent } from '../requestBranchSelect/requestBranchSelect.component';
import { RequestDetailsFormComponent } from '../requestDetailsForm/requestDetailsForm.component';
import { RequestRecordSelectComponent } from '../requestRecordSelect/requestRecordSelect.component';
import { Commit } from '../../../shared/models/commit.interface';
import { ToastService } from '../../../shared/services/toast.service';
import { User } from '../../../shared/models/user.class';
import { USER } from '../../../prefixes';
import { CreateRequestComponent } from './createRequest.component';

describe('Create Request component', function() {
    let component: CreateRequestComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<CreateRequestComponent>;
    let mergeRequestManagerStub: jasmine.SpyObj<MergeRequestManagerService>;
    let mergeRequestsStateStub: jasmine.SpyObj<MergeRequestsStateService>;
    let toastStub: jasmine.SpyObj<ToastService>;
    let commit: Commit;

    const id = 'entityId';
    const emptyObj: JSONLDObject = {'@id': id};

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                SharedModule
            ],
            declarations: [
                CreateRequestComponent,
                MockComponent(RequestRecordSelectComponent),
                MockComponent(RequestBranchSelectComponent),
                MockComponent(RequestDetailsFormComponent)
            ],
            providers: [
                MockProvider(MergeRequestManagerService),
                MockProvider(MergeRequestsStateService),
                MockProvider(ToastService),
            ],
        }).compileComponents();
        fixture = TestBed.createComponent(CreateRequestComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        mergeRequestManagerStub = TestBed.inject(MergeRequestManagerService) as jasmine.SpyObj<MergeRequestManagerService>;
        mergeRequestsStateStub = TestBed.inject(MergeRequestsStateService) as jasmine.SpyObj<MergeRequestsStateService>;
        toastStub = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;

        mergeRequestsStateStub.requestConfig = {
            title: '',
            description: '',
            assignees: [],
            recordId: '',
            sourceBranchId: '',
            targetBranchId: '',
            removeSource: false
        };
        commit = {
            id: 'commit1',
            creator: {
                firstName: 'batman',
                lastName: '',
                username: 'string'
            },
            date: 'string',
            message: 'string',
            base: 'string',
            auxiliary: 'string',
            branch: 'string'
        };
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        mergeRequestManagerStub = null;
        mergeRequestsStateStub = null;
        toastStub = null;
    });

    it('should initialize properly', function() {
        mergeRequestsStateStub.createRequestStep = 1;
        component.ngOnInit();
        expect(component.requestStepper.selectedIndex).toEqual(1);
    });
    it('should destroy properly', function() {
        component.requestStepper.selectedIndex = 1;
        component.ngOnDestroy();
        expect(mergeRequestsStateStub.createRequestStep).toEqual(1);
    });
    describe('controller methods', function() {
        beforeEach(function() {
            mergeRequestsStateStub.createRequest = true;
        });
        describe('should submit the creation', function() {
            it('successfully', fakeAsync(function() {
                mergeRequestManagerStub.createRequest.and.returnValue(of(null));
                component.submit();
                tick();
                expect(mergeRequestManagerStub.createRequest).toHaveBeenCalledWith(mergeRequestsStateStub.requestConfig);
                expect(toastStub.createSuccessToast).toHaveBeenCalledWith(jasmine.any(String));
                expect(mergeRequestsStateStub.createRequest).toBeFalse();
                expect(toastStub.createErrorToast).not.toHaveBeenCalled();
            }));
            it('unless an error occurs', fakeAsync(function() {
                mergeRequestManagerStub.createRequest.and.returnValue(throwError('error'));
                component.submit();
                tick();
                expect(mergeRequestManagerStub.createRequest).toHaveBeenCalledWith(mergeRequestsStateStub.requestConfig);
                expect(toastStub.createSuccessToast).not.toHaveBeenCalled();
                expect(mergeRequestsStateStub.createRequest).toBeTrue();
                expect(toastStub.createErrorToast).toHaveBeenCalledWith(jasmine.any(String));
            }));
        });
        it('should reset the request branch select', function() {
            mergeRequestsStateStub.requestConfig.sourceBranchId = id;
            mergeRequestsStateStub.requestConfig.sourceBranch = emptyObj;
            mergeRequestsStateStub.requestConfig.targetBranchId = id;
            mergeRequestsStateStub.requestConfig.targetBranch = emptyObj;
            component.resetBranchSelect();
            expect(mergeRequestsStateStub.requestConfig.sourceBranchId).toEqual('');
            expect(mergeRequestsStateStub.requestConfig.sourceBranch).toBeUndefined();
            expect(mergeRequestsStateStub.requestConfig.targetBranchId).toEqual('');
            expect(mergeRequestsStateStub.requestConfig.targetBranch).toBeUndefined();
            expect(mergeRequestsStateStub.requestConfig.removeSource).toBeUndefined();
            expect(mergeRequestsStateStub.clearDifference).toHaveBeenCalledWith();
        });
        it('should reset the request details form', function() {
            mergeRequestsStateStub.requestConfig.title = 'title';
            mergeRequestsStateStub.requestConfig.description = 'description';
            mergeRequestsStateStub.requestConfig.assignees = [new User({
                '@id': 'userA',
                '@type': [`${USER}User`]
            })];
            mergeRequestsStateStub.requestConfig.removeSource = true;
            component.resetDetailsForm();
            expect(mergeRequestsStateStub.requestConfig.title).toEqual('');
            expect(mergeRequestsStateStub.requestConfig.description).toEqual('');
            expect(mergeRequestsStateStub.requestConfig.assignees).toEqual([]);
            expect(mergeRequestsStateStub.requestConfig.removeSource).toBeFalse();
        });
        describe('should determine whether the next button should be disabled if the step is', function() {
            it('0',  function() {
                mergeRequestsStateStub.createRequestStep = 0;
                fixture.detectChanges();
                const button = element.nativeElement.querySelector('.button-step-1');
                expect(button.disabled).toBeTruthy();
                mergeRequestsStateStub.requestConfig.recordId = 'record';
                fixture.detectChanges();
                expect(button.disabled).toBeFalsy();
            });
            describe('1',  function() {
                it('and both of the branches are the same',  function() {
                    mergeRequestsStateStub.createRequestStep = 1;
                    mergeRequestsStateStub.sameBranch = true;
                    fixture.detectChanges();
                    const button = element.nativeElement.querySelector('.button-step-2');
                    expect(button.disabled).toBeTruthy();
                    mergeRequestsStateStub.requestConfig.sourceBranchId = 'branch';
                    mergeRequestsStateStub.requestConfig.targetBranchId = 'branch';
                    expect(button.disabled).toBeTruthy();
                });
                it('and the two branches are different',  function() {
                    mergeRequestsStateStub.createRequestStep = 1;
                    mergeRequestsStateStub.sameBranch = false;
                    fixture.detectChanges();
                    const button = element.nativeElement.querySelector('.button-step-2');
                    expect(button.disabled).toBeTruthy();
                    mergeRequestsStateStub.requestConfig.sourceBranchId = 'branch';
                    mergeRequestsStateStub.requestConfig.targetBranchId = 'branch';
                    component.updateCommits({commits: [commit]});
                    fixture.detectChanges();
                    expect(button.disabled).toBeFalsy();
                });
            });
            it('2', function() {
                mergeRequestsStateStub.createRequestStep = 2;
                fixture.detectChanges();
                expect(component.isDisabled).toEqual(true);
                mergeRequestsStateStub.requestConfig.title = 'title';
                component.updateCommits({ commits: [commit] });
                fixture.detectChanges();
                expect(component.isDisabled).toEqual(false);
            });
        });
    });
    describe('contains the the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.create-request')).length).toEqual(1);
            expect(element.queryAll(By.css('mat-horizontal-stepper')).length).toEqual(1);
        });
        it('with steps for each part of the request creation process', function() {
            fixture.detectChanges();
            expect(element.queryAll(By.css('mat-step-header')).length).toEqual(3);
        });
        it('if the first step is selected', function() {
            mergeRequestsStateStub.createRequestStep = 0;
            fixture.detectChanges();
            expect(element.queryAll(By.css('request-record-select')).length).toEqual(1);
            const buttons = element.queryAll(By.css('.step-buttons button'));
            expect(buttons.length).toEqual(2);
            expect(['Cancel', 'Next']).toContain(buttons[0].nativeElement.textContent.trim());
            expect(['Cancel', 'Next']).toContain(buttons[1].nativeElement.textContent.trim());
        });
        it('if the second step is selected', function() {
            mergeRequestsStateStub.createRequestStep = 1;
            fixture.detectChanges();
            expect(element.queryAll(By.css('request-branch-select')).length).toEqual(1);
            const buttons = element.queryAll(By.css('.step-buttons button'));
            expect(buttons.length).toEqual(2);
            expect(['Back', 'Next']).toContain(buttons[0].nativeElement.textContent.trim());
            expect(['Back', 'Next']).toContain(buttons[1].nativeElement.textContent.trim());
        });
        it('if the third step is selected', function() {
            mergeRequestsStateStub.createRequestStep = 2;
            fixture.detectChanges();
            expect(element.queryAll(By.css('request-details-form')).length).toEqual(1);
            const buttons = element.queryAll(By.css('.step-buttons button'));
            expect(buttons.length).toEqual(2);
            expect(['Back', 'Submit']).toContain(buttons[0].nativeElement.textContent.trim());
            expect(['Back', 'Submit']).toContain(buttons[1].nativeElement.textContent.trim());
        });
    });
});
