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
import { HttpResponse } from '@angular/common/http';
import { DebugElement } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule, MatCheckboxModule, MatDialogModule, MatDialogRef, MatFormFieldModule, MatInputModule } from '@angular/material';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { configureTestSuite } from 'ng-bullet';
import { MockComponent, MockProvider } from 'ng-mocks';
import { of, throwError } from 'rxjs';

import {
    cleanStylesFromDOM,
} from '../../../../../../test/ts/Shared';
import { DCTERMS, MERGEREQ, XSD } from '../../../prefixes';
import { BranchSelectComponent } from '../../../shared/components/branchSelect/branchSelect.component';
import { ErrorDisplayComponent } from '../../../shared/components/errorDisplay/errorDisplay.component';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { MergeRequest } from '../../../shared/models/mergeRequest.interface';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { MergeRequestManagerService } from '../../../shared/services/mergeRequestManager.service';
import { MergeRequestsStateService } from '../../../shared/services/mergeRequestsState.service';
import { UserManagerService } from '../../../shared/services/userManager.service';
import { UtilService } from '../../../shared/services/util.service';
import { AssigneeInputComponent } from '../assigneeInput/assigneeInput.component';
import { EditRequestOverlayComponent } from './editRequestOverlay.component';

describe('Edit Request Overlay Component', function() {
    let component: EditRequestOverlayComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<EditRequestOverlayComponent>;
    let matDialogRef: jasmine.SpyObj<MatDialogRef<EditRequestOverlayComponent>>;
    let catalogManagerStub: jasmine.SpyObj<CatalogManagerService>;
    let mergeRequestManagerStub: jasmine.SpyObj<MergeRequestManagerService>;
    let mergeRequestsStateStub: jasmine.SpyObj<MergeRequestsStateService>;
    let userManagerStub: jasmine.SpyObj<UserManagerService>;
    let utilStub: jasmine.SpyObj<UtilService>;
    
    const catalogId = 'catalogId';
    const requestId = 'urn://test/merge-request/1';
    const recordId = 'urn://test/record/1';
    const branches = [{'@id': 'branch'}];
    const userId = 'urn://test/user/user-1';
    const username = 'username';
    const requestTitle = 'Merge Request 1';
    const error = 'error';
    const sourceBranch: JSONLDObject = {'@id': 'urn://test/branch/source'};
    const branch: JSONLDObject = {'@id': 'urn://test/branch/target', '@type': []};
    const emptyRequest: MergeRequest = {
        title: '',
        date: '',
        creator: '',
        assignees: [],
        removeSource: false,
        recordIri: '',
        jsonld: {'@id': requestId}
    };

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [
                ReactiveFormsModule,
                MatDialogModule,
                MatFormFieldModule,
                MatInputModule,
                MatButtonModule,
                MatCheckboxModule,
                NoopAnimationsModule
            ],
            declarations: [
                EditRequestOverlayComponent,
                MockComponent(ErrorDisplayComponent),
                MockComponent(AssigneeInputComponent),
                MockComponent(BranchSelectComponent)
            ],
            providers: [
                MockProvider(CatalogManagerService),
                MockProvider(MergeRequestManagerService),
                MockProvider(MergeRequestsStateService),
                MockProvider(UserManagerService),
                MockProvider(UtilService),
                { provide: MatDialogRef, useFactory: () => jasmine.createSpyObj('MatDialogRef', ['close'])}
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(EditRequestOverlayComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        matDialogRef = TestBed.get(MatDialogRef);
        catalogManagerStub = TestBed.get(CatalogManagerService);
        mergeRequestManagerStub = TestBed.get(MergeRequestManagerService);
        mergeRequestsStateStub = TestBed.get(MergeRequestsStateService);
        userManagerStub = TestBed.get(UserManagerService);
        utilStub = TestBed.get(UtilService);

        mergeRequestsStateStub.selected = {
            recordIri: recordId,
            title: 'Merge Request 1',
            description: '',
            jsonld: {
                '@id': requestId,
                [DCTERMS + 'title']: [{'@value': 'Merge Request 1'}],
                [DCTERMS + 'description']: [{'@value': ''}],
                [MERGEREQ + 'sourceBranch']: [{'@id': sourceBranch['@id']}],
                [MERGEREQ + 'targetBranch']: [{'@id': branch['@id']}],
                [MERGEREQ + 'assignee']: [{'@id': userId}],
                [MERGEREQ + 'removeSource']: [{'@type': XSD + 'boolean', '@value': 'true'}]
            },
            sourceBranch: sourceBranch,
            targetBranch: branch,
            removeSource: true,
            date: '',
            creator: '',
            assignees: [username]
        };
        catalogManagerStub.localCatalog = {'@id': catalogId};
        catalogManagerStub.getRecordBranches.and.returnValue(of(new HttpResponse<JSONLDObject[]>({body: branches})));
        userManagerStub.users = [{
            username,
            iri: userId,
            firstName: '',
            lastName: '',
            email: '',
            roles: [],
            external: false
        }];
        mergeRequestsStateStub.setRequestDetails.and.returnValue(of(null));
        mergeRequestsStateStub.getRequestObj.and.returnValue(emptyRequest);
        utilStub.updateDctermsValue.and.callFake((obj, prop, val) => {
            obj[DCTERMS + prop] = [{'@value': val}];
        });
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        mergeRequestsStateStub = null;
        mergeRequestManagerStub = null;
        utilStub = null;
    });

    describe('initializes with the correct values', function() {
        it('successfully', fakeAsync(function() {
            component.ngOnInit();
            tick();
            expect(component.editRequestForm.controls.title.value).toEqual(requestTitle);
            expect(component.editRequestForm.controls.description.value).toEqual('');
            expect(component.editRequestForm.controls.assignees.value).toEqual('');
            expect(component.editRequestForm.controls.removeSource.value).toEqual(true);
            expect(component.targetBranch).toEqual(branch);
            expect(component.assignees).toEqual(mergeRequestsStateStub.selected.assignees);
            expect(catalogManagerStub.getRecordBranches).toHaveBeenCalledWith(recordId, catalogId);
            expect(utilStub.createErrorToast).not.toHaveBeenCalled();
            expect(component.branches).toEqual(branches);
        }));
        it('unless getRecordBranches fails', fakeAsync(function() {
            catalogManagerStub.getRecordBranches.and.returnValue(throwError(error));
            component.ngOnInit();
            tick();
            expect(component.editRequestForm.controls.title.value).toEqual(requestTitle);
            expect(component.editRequestForm.controls.description.value).toEqual('');
            expect(component.editRequestForm.controls.assignees.value).toEqual('');
            expect(component.editRequestForm.controls.removeSource.value).toEqual(true);
            expect(component.targetBranch).toEqual(branch);
            expect(component.assignees).toEqual(mergeRequestsStateStub.selected.assignees);
            expect(catalogManagerStub.getRecordBranches).toHaveBeenCalledWith(recordId, catalogId);
            expect(utilStub.createErrorToast).toHaveBeenCalledWith(error);
            expect(component.branches).toEqual([]);
        }));
    });
    describe('controller method', function() {
        describe('submits the overlay', function() {
            beforeEach(function() {
                this.expectedJsonld = {
                    '@id': 'urn://test/merge-request/1',
                    [DCTERMS + 'title']: [{'@value': 'New title'}],
                    [DCTERMS + 'description']: [{'@value': 'description'}],
                    [MERGEREQ + 'sourceBranch']: [{'@id': 'urn://test/branch/source'}],
                    [MERGEREQ + 'targetBranch']: [{'@id': 'new branch'}],
                    [MERGEREQ + 'assignee']: [],
                    [MERGEREQ + 'removeSource']: [{'@type': XSD + 'boolean', '@value': 'false'}]
                };
                component.ngOnInit();
                component.editRequestForm.controls.title.setValue('New title');
                component.editRequestForm.controls.description.setValue('description');
                component.editRequestForm.controls.removeSource.setValue('false');
                component.targetBranch = {'@id': 'new branch'};
                component.assignees = [];
            });
            it('successfully', fakeAsync(function() {
                mergeRequestManagerStub.updateRequest.and.returnValue(of(null));
                component.submit();
                tick();
                expect(mergeRequestManagerStub.updateRequest).toHaveBeenCalledWith(requestId, this.expectedJsonld);
                expect(utilStub.createSuccessToast).toHaveBeenCalledWith(jasmine.any(String));
                expect(mergeRequestsStateStub.getRequestObj).toHaveBeenCalledWith(this.expectedJsonld);
                expect(mergeRequestsStateStub.setRequestDetails).toHaveBeenCalledWith(emptyRequest);
                expect(matDialogRef.close).toHaveBeenCalledWith();
                expect(component.errorMessage).toEqual('');
            }));
            it('unless an error occurs', fakeAsync(function() {
                mergeRequestManagerStub.updateRequest.and.returnValue(throwError(error));
                component.submit();
                tick();
                expect(mergeRequestManagerStub.updateRequest).toHaveBeenCalledWith(requestId, this.expectedJsonld);
                expect(utilStub.createSuccessToast).not.toHaveBeenCalled();
                expect(mergeRequestsStateStub.getRequestObj).not.toHaveBeenCalled();
                expect(mergeRequestsStateStub.setRequestDetails).not.toHaveBeenCalled();
                expect(matDialogRef.close).not.toHaveBeenCalled();
                expect(component.errorMessage).toEqual(error);
            }));
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('h1[mat-dialog-title]')).length).toEqual(1);
            expect(element.queryAll(By.css('div[mat-dialog-content]')).length).toEqual(1);
            expect(element.queryAll(By.css('div[mat-dialog-actions]')).length).toEqual(1);
        });
        it('with mat-form-fields', function() {
            expect(element.queryAll(By.css('mat-form-field')).length).toBe(2);
        });
        ['input[name="title"]', 'textarea', '.source-details', 'branch-select', 'assignee-input'].forEach(test => {
            it('with a ' + test, function() {
                expect(element.queryAll(By.css(test)).length).toBe(1);
            });
        });
        it('depending on whether the sourceBranch is the master branch', function() {
            expect(element.queryAll(By.css('mat-checkbox')).length).toEqual(0);

            mergeRequestsStateStub.selected.sourceTitle = 'source';
            fixture.detectChanges();
            expect(element.queryAll(By.css('mat-checkbox')).length).toEqual(1);

            mergeRequestsStateStub.selected.sourceTitle = 'MASTER';
            fixture.detectChanges();
            expect(element.queryAll(By.css('mat-checkbox')).length).toEqual(0);
        });
        it('depending on the validity of the form', function() {
            component.ngOnInit();
            fixture.detectChanges();
            const button = element.queryAll(By.css('.mat-dialog-actions button[color="primary"]'))[0];
            expect(button).not.toBeNull();
            expect(button.properties['disabled']).toBeFalsy();
            
            component.editRequestForm.controls.title.setValue(null);
            fixture.detectChanges();
            expect(button.properties['disabled']).toBeTruthy();
    
            component.editRequestForm.controls.title.setValue('test');
            fixture.detectChanges();
            expect(button.properties['disabled']).toBeFalsy();
        });
        it('depending on whether the selected target branch is the same as the source branch', function() {
            component.ngOnInit();
            fixture.detectChanges();
            const button = element.queryAll(By.css('.mat-dialog-actions button[color="primary"]'))[0];
            expect(button).not.toBeNull();
            expect(button.properties['disabled']).toBeFalsy();

            component.targetBranch = sourceBranch;
            fixture.detectChanges();
            expect(button.properties['disabled']).toBeTruthy();
        });
        it('depending on whether there is an error', function() {
            expect(element.queryAll(By.css('error-display')).length).toEqual(0);
            component.errorMessage = 'Error message';
            fixture.detectChanges();
            expect(element.queryAll(By.css('error-display')).length).toEqual(1);
        });
        it('with buttons to cancel and submit', function() {
            const buttons = element.queryAll(By.css('.mat-dialog-actions button'));
            expect(buttons.length).toEqual(2);
            expect(['Cancel', 'Submit']).toContain(buttons[0].nativeElement.textContent.trim());
            expect(['Cancel', 'Submit']).toContain(buttons[1].nativeElement.textContent.trim());
        });
    });
    it('should call cancel when the button is clicked', function() {
        const cancelButton = element.queryAll(By.css('.mat-dialog-actions button:not([color="primary"])'))[0];
        cancelButton.triggerEventHandler('click', null);
        fixture.detectChanges();
        expect(matDialogRef.close).toHaveBeenCalledWith(undefined);
    });
    it('should call add when the button is clicked', function() {
        spyOn(component, 'submit');
        const submitButton = element.queryAll(By.css('.mat-dialog-actions button[color="primary"]'))[0];
        submitButton.triggerEventHandler('click', null);
        fixture.detectChanges();
        expect(component.submit).toHaveBeenCalledWith();
    });
});
