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
import { DebugElement } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MockComponent, MockProvider } from 'ng-mocks';
import { of, throwError } from 'rxjs';
import { HttpResponse } from '@angular/common/http';
import { cloneDeep } from 'lodash';

import {
    cleanStylesFromDOM,
} from '../../../../test/ts/Shared';
import { ConfirmModalComponent } from '../../../shared/components/confirmModal/confirmModal.component';
import { ErrorDisplayComponent } from '../../../shared/components/errorDisplay/errorDisplay.component';
import { ResolveConflictsFormComponent } from '../../../shared/components/resolveConflictsForm/resolveConflictsForm.component';
import { Conflict } from '../../../shared/models/conflict.interface';
import { Difference } from '../../../shared/models/difference.class';
import { MergeRequestManagerService } from '../../../shared/services/mergeRequestManager.service';
import { MergeRequestsStateService } from '../../../shared/services/mergeRequestsState.service';
import { EditRequestOverlayComponent } from '../editRequestOverlay/editRequestOverlay.component';
import { MergeRequestTabsetComponent } from '../mergeRequestTabset/mergeRequestTabset.component';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { ToastService } from '../../../shared/services/toast.service';
import { OntologyListItem } from '../../../shared/models/ontologyListItem.class';
import { UserManagerService } from '../../../shared/services/userManager.service';
import { LoginManagerService } from '../../../shared/services/loginManager.service';
import { PolicyEnforcementService } from '../../../shared/services/policyEnforcement.service';
import { User } from '../../../shared/models/user.class';
import { CATALOG, DCTERMS, FOAF, MERGEREQ, USER } from '../../../prefixes';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { RecordIconComponent } from '../../../shared/components/recordIcon/recordIcon.component';
import { MergeRequest } from '../../../shared/models/mergeRequest.interface';
import { XACMLRequest } from '../../../shared/models/XACMLRequest.interface';
import { MergeRequestViewComponent } from './mergeRequestView.component';

describe('Merge Request View component', function() {
    let component: MergeRequestViewComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<MergeRequestViewComponent>;
    let catalogManagerStub: jasmine.SpyObj<CatalogManagerService>;
    let mergeRequestManagerStub: jasmine.SpyObj<MergeRequestManagerService>;
    let mergeRequestsStateStub: jasmine.SpyObj<MergeRequestsStateService>;
    let ontologyStateStub: jasmine.SpyObj<OntologyStateService>;
    let userManagerStub: jasmine.SpyObj<UserManagerService>;
    let loginManagerStub: jasmine.SpyObj<LoginManagerService>;
    let policyEnforcementStub: jasmine.SpyObj<PolicyEnforcementService>;
    let toastStub: jasmine.SpyObj<ToastService>;
    let matDialog: jasmine.SpyObj<MatDialog>;
    let nativeElement: HTMLElement;

    const error = 'Error Message';
    const requestId = 'requestId';
    const recordId = 'recordId';
    const sourceBranchId = 'sourceBranchId';
    const targetBranchId = 'targetBranchId';
    const userIri = 'urn:test';
    const creatorIri = 'urn:creator';
    const mergeRequestJsonLd: JSONLDObject = {
      '@id': requestId,
      '@type': [
        'http://www.w3.org/2002/07/owl#Thing',
        'http://mobi.com/ontologies/merge-requests#MergeRequest'
      ],
      [`${MERGEREQ}onRecord`]: [{'@id': 'https://mobi.com/records#bc470b85-ecb4-4428-9dc4-1e64ff2863d6'}],
      [`${MERGEREQ}assignee`]: [{'@id': 'http://mobi.com/users/12dea96fec20593566ab75692c9949596833adc9'}],
      [`${MERGEREQ}removeSource`]: [
          {
              '@type': 'http://www.w3.org/2001/XMLSchema#boolean',
              '@value': 'false'
          }
      ],
      [`${MERGEREQ}sourceBranch`]: [{'@id': sourceBranchId}],
      [`${MERGEREQ}targetBranch`]: [{'@id': targetBranchId}],
      [`${DCTERMS}creator`]: [{'@id': creatorIri}],
      [`${DCTERMS}description`]: [{'@value': ''}],
      [`${DCTERMS}issued`]: [
          {
              '@type': 'http://www.w3.org/2001/XMLSchema#dateTime',
              '@value': '2023-12-18T15:39:50.706952-05:00'
          }
      ],
      [`${DCTERMS}modified`]: [
          {
              '@type': 'http://www.w3.org/2001/XMLSchema#dateTime',
              '@value': '2023-12-18T15:39:50.706952-05:00'
          }
      ],
      [`${DCTERMS}title`]: [{'@value': 'a'}]
      
    };

    const user: User = new User({
      '@id': userIri,
      '@type': [`${USER}User`],
      [`${USER}username`]: [{ '@value': 'bruce' }],
      [`${FOAF}firstName`]: [{ '@value': 'Bruce' }],
      [`${USER}lastName`]: [{ '@value': 'user' }]
    });

    const assignees = [user, new User({
      '@id': 'urn:superman',
      '@type': [`${USER}User`],
      [`${USER}username`]: [{ '@value': 'clark' }],
    })];

    const conflict: Conflict = {iri: 'iri', left: new Difference(), right: new Difference()};
    const catalogId = 'catalog';
    const branch: JSONLDObject = {
        '@id': 'branch123',
        [`${CATALOG}head`]: [{'@id': 'commit123'}],
        [`${DCTERMS}title`]: [{'@value': 'MASTER'}]
    };
    const branches = [branch];

    const creatorUserId = 'urn://test/user/creator-user-1';
    const creatorUsername = 'creator';
    const creator: User = new User({
        '@id': creatorUserId,
        '@type': [`${USER}User`],
        [`${USER}username`]: [{ '@value': creatorUsername }],
        [`${USER}hasUserRole`]: [],
    });

    let mergeRequest: MergeRequest;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                NoopAnimationsModule,
                FormsModule,
                MatChipsModule,
                MatButtonModule,
                MatCheckboxModule
            ],
            declarations: [
                MergeRequestViewComponent,
                MockComponent(ErrorDisplayComponent),
                MockComponent(MergeRequestTabsetComponent),
                MockComponent(ResolveConflictsFormComponent),
                MockComponent(RecordIconComponent)
            ],
            providers: [
                MockProvider(CatalogManagerService),
                MockProvider(MergeRequestManagerService),
                MockProvider(MergeRequestsStateService),
                MockProvider(OntologyStateService),
                MockProvider(UserManagerService),
                MockProvider(LoginManagerService),
                MockProvider(PolicyEnforcementService),
                MockProvider(ToastService),
                { provide: MatDialog, useFactory: () => jasmine.createSpyObj('MatDialog', {
                    open: { afterClosed: () => of(true)}
                }) }
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(MergeRequestViewComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        mergeRequestManagerStub = TestBed.inject(MergeRequestManagerService) as jasmine.SpyObj<MergeRequestManagerService>;
        mergeRequestsStateStub = TestBed.inject(MergeRequestsStateService) as jasmine.SpyObj<MergeRequestsStateService>;
        ontologyStateStub = TestBed.inject(OntologyStateService) as jasmine.SpyObj<OntologyStateService>;
        loginManagerStub = TestBed.inject(LoginManagerService) as jasmine.SpyObj<LoginManagerService>;
        userManagerStub = TestBed.inject(UserManagerService) as jasmine.SpyObj<UserManagerService>;
        policyEnforcementStub = TestBed.inject(PolicyEnforcementService) as jasmine.SpyObj<PolicyEnforcementService>;
        mergeRequestManagerStub = TestBed.inject(MergeRequestManagerService) as jasmine.SpyObj<MergeRequestManagerService>;
        toastStub = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;
        matDialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
        nativeElement = element.nativeElement as HTMLElement;
        catalogManagerStub = TestBed.inject(CatalogManagerService) as jasmine.SpyObj<CatalogManagerService>;
        catalogManagerStub.localCatalog = {'@id': catalogId, '@type': []};
        catalogManagerStub.getRecordBranches.and.returnValue(of(new HttpResponse<JSONLDObject[]>({body: [{'@id': catalogId, data: branches}]})));
        catalogManagerStub.getRecordVersions.and.returnValue(of(new HttpResponse<JSONLDObject[]>({body: [{'@id': 'urn:tag'}]})));
        mergeRequestManagerStub.getRequest.and.returnValue(of(mergeRequestJsonLd));
        mergeRequestManagerStub.requestStatus.and.returnValue('open');
        mergeRequestsStateStub.setRequestDetails.and.returnValue(of(null));
        mergeRequestsStateStub.selected = {
            title: 'title',
            date: '',
            creator: creator,
            recordIri: recordId,
            sourceBranch: {'@id': sourceBranchId},
            targetBranch: {'@id': targetBranchId},
            removeSource: true,
            assignees: [],
            jsonld: mergeRequestJsonLd
        };
        mergeRequest = cloneDeep(mergeRequestsStateStub.selected);
        loginManagerStub.currentUserIRI = userIri;
        userManagerStub.users = [user];
        userManagerStub.isAdminUser.and.returnValue(false);
        policyEnforcementStub.evaluateRequest.and.returnValue(of('Permit'));
        policyEnforcementStub.deny = 'Deny';
        policyEnforcementStub.permit = 'Permit';
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        mergeRequestsStateStub = null;
        mergeRequestManagerStub = null;
        toastStub = null;
        ontologyStateStub = null;
        matDialog = null;
        userManagerStub = null;
        loginManagerStub = null;
        policyEnforcementStub = null;
    });

    describe('should initialize correctly if getRequest', function() {
        beforeEach(function() {
            mergeRequestsStateStub.selected.jsonld = {
              '@id': requestId,
              '@type': [],
              [`${MERGEREQ}`]: [{ '@id': sourceBranchId }]
            };
            mergeRequestManagerStub.requestStatus.and.returnValue('open');
            policyEnforcementStub.evaluateRequest.and.returnValue(of('Permit'));
            userManagerStub.isAdminUser.and.returnValue(false);
            mergeRequestsStateStub.selected.jsonld = cloneDeep(mergeRequestJsonLd);
        });
        it('resolves', fakeAsync(function() {
            mergeRequestsStateStub.selected.assignees = assignees;
            mergeRequestManagerStub.requestStatus.and.returnValue('accepted');
            fixture.detectChanges();
            component.ngOnInit();
            tick();
            expect(component.requestStatus).toBe('accepted');
            expect(component.isSubmitDisabled).toBeFalsy();
            expect(component.buttonsDisabled).toBeFalsy();
            expect(component.buttonsDisabled).toBeFalsy();
            expect(mergeRequestManagerStub.getRequest).toHaveBeenCalledWith(requestId);
            expect(mergeRequestsStateStub.selected).toBeDefined();
            expect(mergeRequestsStateStub.selected.jsonld).toEqual(mergeRequestJsonLd);
            expect(mergeRequestsStateStub.setRequestDetails).toHaveBeenCalledWith(mergeRequestsStateStub.selected);
            expect(toastStub.createWarningToast).not.toHaveBeenCalled();
            
        }));
        it('resolves permission denied', fakeAsync(function() {
            policyEnforcementStub.evaluateRequest.and.callFake((jsonRequest: XACMLRequest) => {
                const resourceId = jsonRequest.resourceId;
                if (resourceId === recordId && jsonRequest.actionId === `${CATALOG}Modify`) {
                    return of('Permit');
                }
                return of('Deny');
            });
            mergeRequestsStateStub.selected.assignees = assignees;
            fixture.detectChanges();
            component.ngOnInit();
            tick();
            expect(component.isSubmitDisabled).toBeFalsy();
            expect(component.buttonsDisabled).toBeTrue();
            expect(component.buttonsDisabled).toBeTrue();
            expect(component.requestStatus).toBe('open');
            expect(mergeRequestManagerStub.getRequest).toHaveBeenCalledWith(requestId);
            expect(mergeRequestManagerStub.requestStatus).toHaveBeenCalledWith(mergeRequestJsonLd);
            expect(mergeRequestsStateStub.selected.jsonld).toEqual(mergeRequestJsonLd);
            expect(mergeRequestsStateStub.setRequestDetails).toHaveBeenCalledWith(mergeRequestsStateStub.selected);
            expect(toastStub.createWarningToast).not.toHaveBeenCalled();
            expect(mergeRequestsStateStub.selected).toBeDefined();
        }));
        it('resolves same user permissions', fakeAsync(function() {
            userManagerStub.isAdminUser.and.returnValue(true);
            loginManagerStub.currentUserIRI = 'http://mobi.com/users/d033e22ae348aeb5660fc2140aec35850c4da997';
            policyEnforcementStub.evaluateRequest.and.callFake((jsonRequest: XACMLRequest) => {
                const resourceId = jsonRequest.resourceId;
                if (resourceId === recordId) {
                    return of('Permit');
                }
                return of('Permit');
            });
            mergeRequestsStateStub.selected.assignees = assignees;
            fixture.detectChanges();
            component.ngOnInit();
            tick();
            expect(component.requestStatus).toBe('open');
            expect(component.isSubmitDisabled).toBeFalsy();
            expect(component.buttonsDisabled).toBeFalsy();
            expect(component.buttonsDisabled).toBeFalsy();
            expect(mergeRequestManagerStub.getRequest).toHaveBeenCalledWith(requestId);
            expect(mergeRequestsStateStub.selected.jsonld).toEqual(mergeRequestJsonLd);
            expect(mergeRequestsStateStub.setRequestDetails).toHaveBeenCalledWith(mergeRequestsStateStub.selected);
            expect(toastStub.createWarningToast).not.toHaveBeenCalled();
            expect(mergeRequestsStateStub.selected).toBeDefined();
        }));
        it('rejects', fakeAsync(function() {
            spyOn(component, 'back').and.callThrough();
            mergeRequestManagerStub.getRequest.and.returnValue(throwError(error));
            component.ngOnInit();
            tick();
            expect(component.requestStatus).toBe('open');
            expect(component.isSubmitDisabled).toBeTrue();
            expect(component.buttonsDisabled).toBeTrue();
            expect(component.back).toHaveBeenCalledWith();
            expect(mergeRequestManagerStub.getRequest).toHaveBeenCalledWith(requestId);
            expect(mergeRequestManagerStub.requestStatus).not.toHaveBeenCalled();
            expect(mergeRequestsStateStub.selected).toEqual(undefined);
            expect(mergeRequestsStateStub.setRequestDetails).not.toHaveBeenCalled();
            expect(toastStub.createWarningToast).toHaveBeenCalledWith(jasmine.any(String));
        }));
    });
    it('should clean up on destroy', function() {
        component.ngOnDestroy();
        expect(mergeRequestsStateStub.clearDifference).toHaveBeenCalledWith();
    });
    describe('controller methods', function() {
        it('should go back', function() {
            component.back();
            expect(mergeRequestsStateStub.selected).toBeUndefined();
        });
        it('show the delete overlay', fakeAsync(function() {
            mergeRequestsStateStub.deleteRequest.and.returnValue(of(null));
            component.showDelete();
            tick();
            expect(matDialog.open).toHaveBeenCalledWith(ConfirmModalComponent, {data: {content: jasmine.stringMatching('Are you sure you want to delete')}});
            expect(mergeRequestsStateStub.deleteRequest).toHaveBeenCalledWith(mergeRequestsStateStub.selected);
        }));
        it('show the accept overlay', fakeAsync(function() {
            spyOn(component, 'acceptRequest');
            component.showAccept();
            tick();
            expect(matDialog.open).toHaveBeenCalledWith(ConfirmModalComponent, {data: {content: jasmine.stringMatching('Are you sure you want to accept')}});
            expect(component.acceptRequest).toHaveBeenCalledWith();
        }));
        it('show the reopen overlay', fakeAsync(function() {
            spyOn(component, 'reopenRequest');
            component.showReopen();
            tick();
            expect(matDialog.open).toHaveBeenCalledWith(ConfirmModalComponent, {data: {content: jasmine.stringMatching('Are you sure you want to reopen')}});
            expect(component.reopenRequest).toHaveBeenCalledWith();
        }));
        describe('should accept a merge request', function() {
            beforeEach(function() {
                this.updatedRequest = Object.assign({}, mergeRequestsStateStub.selected);
                mergeRequestsStateStub.selected.jsonld = {'@id': requestId, '@type': []};
            });
            describe('if acceptRequest resolves', function() {
                beforeEach(function() {
                    mergeRequestManagerStub.updateRequestStatus.and.returnValue(of(null));
                });
                describe('if getRequest resolves', function() {
                    describe('if setRequestDetails resolves', function() {
                        describe('if removeSource is set to true', function() {
                            describe('if deleteOntologyBranch resolves', function() {
                                beforeEach(function() {
                                    catalogManagerStub.deleteRecordBranch.and.returnValue(of(null));
                                });
                                it('and the ontology editor is not open on an ontology', fakeAsync(function() {
                                    ontologyStateStub.listItem = undefined;
                                    component.acceptRequest();
                                    tick();
                                    expect(mergeRequestManagerStub.updateRequestStatus).toHaveBeenCalledWith(mergeRequest, 'accept');
                                    expect(toastStub.createSuccessToast).toHaveBeenCalledWith(jasmine.any(String));
                                    expect(component.requestStatus).toBe('accepted');
                                    expect(mergeRequestManagerStub.getRequest).toHaveBeenCalledWith(requestId);
                                    expect(mergeRequestsStateStub.selected.jsonld).toEqual(mergeRequestJsonLd);
                                    expect(mergeRequestsStateStub.setRequestDetails).toHaveBeenCalledWith(mergeRequestsStateStub.selected);
                                    expect(catalogManagerStub.deleteRecordBranch).toHaveBeenCalledWith(recordId, sourceBranchId, catalogId);
                                    expect(toastStub.createWarningToast).not.toHaveBeenCalled();
                                    expect(toastStub.createErrorToast).not.toHaveBeenCalled();
                                }));
                                describe('and the ontology editor is on the target branch', function() {
                                    beforeEach(function() {
                                        ontologyStateStub.listItem = new OntologyListItem();
                                        ontologyStateStub.listItem.versionedRdfRecord.recordId = recordId;
                                        ontologyStateStub.listItem.versionedRdfRecord.branchId = targetBranchId;
                                        ontologyStateStub.listItem.upToDate = true;
                                        ontologyStateStub.list = [ontologyStateStub.listItem];
                                    });
                                    it('and it not in the middle of a merge', fakeAsync(function() {
                                        component.acceptRequest();
                                        tick();
                                        expect(mergeRequestManagerStub.updateRequestStatus).toHaveBeenCalledWith(mergeRequest, 'accept');
                                        expect(toastStub.createSuccessToast).toHaveBeenCalledWith(jasmine.any(String));
                                        expect(component.requestStatus).toBe('accepted');
                                        expect(mergeRequestManagerStub.getRequest).toHaveBeenCalledWith(requestId);
                                        expect(mergeRequestsStateStub.selected.jsonld).toEqual(mergeRequestJsonLd);
                                        expect(mergeRequestsStateStub.setRequestDetails).toHaveBeenCalledWith(mergeRequestsStateStub.selected);
                                        expect(catalogManagerStub.deleteRecordBranch).toHaveBeenCalledWith(recordId, sourceBranchId, catalogId);
                                        expect(ontologyStateStub.listItem.upToDate).toBeFalse();
                                        expect(toastStub.createWarningToast).not.toHaveBeenCalled();
                                        expect(toastStub.createErrorToast).not.toHaveBeenCalled();
                                    }));
                                    it('and is in the middle of a merge', fakeAsync(function() {
                                        ontologyStateStub.listItem.merge.active = true;
                                        component.acceptRequest();
                                        tick();
                                        expect(mergeRequestManagerStub.updateRequestStatus).toHaveBeenCalledWith(mergeRequest, 'accept');
                                        expect(toastStub.createSuccessToast).toHaveBeenCalledWith(jasmine.any(String));
                                        expect(component.requestStatus).toBe('accepted');
                                        expect(mergeRequestManagerStub.getRequest).toHaveBeenCalledWith(requestId);
                                        expect(mergeRequestsStateStub.selected.jsonld).toEqual(mergeRequestJsonLd);
                                        expect(mergeRequestsStateStub.setRequestDetails).toHaveBeenCalledWith(mergeRequestsStateStub.selected);
                                        expect(catalogManagerStub.deleteRecordBranch).toHaveBeenCalledWith(recordId, sourceBranchId, catalogId);
                                        expect(ontologyStateStub.listItem.upToDate).toBeFalse();
                                        expect(toastStub.createWarningToast).toHaveBeenCalledWith(jasmine.any(String), {timeOut: 5000});
                                        expect(toastStub.createErrorToast).not.toHaveBeenCalled();
                                    }));
                                });
                                it('and the ontology editor is in the middle of merging into the target', fakeAsync(function() {
                                    ontologyStateStub.listItem = new OntologyListItem();
                                    ontologyStateStub.listItem.versionedRdfRecord.recordId = recordId;
                                    ontologyStateStub.listItem.merge.active = true;
                                    ontologyStateStub.listItem.merge.target = {'@id': targetBranchId};
                                    ontologyStateStub.listItem.upToDate = true;
                                    ontologyStateStub.list = [ontologyStateStub.listItem];
                                    component.acceptRequest();
                                    tick();
                                    expect(mergeRequestManagerStub.updateRequestStatus).toHaveBeenCalledWith(mergeRequest, 'accept');
                                    expect(toastStub.createSuccessToast).toHaveBeenCalledWith(jasmine.any(String));
                                    expect(component.requestStatus).toBe('accepted');
                                    expect(mergeRequestManagerStub.getRequest).toHaveBeenCalledWith(requestId);
                                    expect(mergeRequestsStateStub.selected.jsonld).toEqual(mergeRequestJsonLd);
                                    expect(mergeRequestsStateStub.setRequestDetails).toHaveBeenCalledWith(mergeRequestsStateStub.selected);
                                    expect(catalogManagerStub.deleteRecordBranch).toHaveBeenCalledWith(recordId, sourceBranchId, catalogId);
                                    expect(ontologyStateStub.listItem.upToDate).toBeTrue();
                                    expect(toastStub.createWarningToast).toHaveBeenCalledWith(jasmine.any(String), {timeOut: 5000});
                                    expect(toastStub.createErrorToast).not.toHaveBeenCalled();
                                }));
                            });
                            it('unless deleteOntologyBranch rejects', fakeAsync(function() {
                                catalogManagerStub.deleteRecordBranch.and.returnValue(throwError(error));
                                component.acceptRequest();
                                tick();
                                expect(mergeRequestManagerStub.updateRequestStatus).toHaveBeenCalledWith(mergeRequest, 'accept');
                                expect(toastStub.createSuccessToast).toHaveBeenCalledWith(jasmine.any(String));
                                expect(component.requestStatus).toBe('accepted');
                                expect(mergeRequestManagerStub.getRequest).toHaveBeenCalledWith(requestId);
                                expect(mergeRequestsStateStub.selected.jsonld).not.toEqual(mergeRequestJsonLd);
                                expect(mergeRequestsStateStub.setRequestDetails).toHaveBeenCalledWith(this.updatedRequest);
                                expect(catalogManagerStub.deleteRecordBranch).toHaveBeenCalledWith(recordId, sourceBranchId, catalogId);
                                expect(toastStub.createWarningToast).not.toHaveBeenCalled();
                                expect(toastStub.createErrorToast).toHaveBeenCalledWith(error);
                            }));
                        });
                        describe('if removeSource is set to false', function() {
                            beforeEach(function() {
                                mergeRequestsStateStub.selected.removeSource = false;
                            });
                            it('and the ontology editor is not open to an ontology', fakeAsync(function() {
                                ontologyStateStub.listItem = undefined;
                                component.acceptRequest();
                                tick();
                                mergeRequest.removeSource = false;
                                expect(mergeRequestManagerStub.updateRequestStatus).toHaveBeenCalledWith(mergeRequest, 'accept');
                                expect(toastStub.createSuccessToast).toHaveBeenCalledWith(jasmine.any(String));
                                expect(component.requestStatus).toBe('accepted');
                                expect(mergeRequestManagerStub.getRequest).toHaveBeenCalledWith(requestId);
                                expect(mergeRequestsStateStub.selected.jsonld).toEqual(mergeRequestJsonLd);
                                expect(mergeRequestsStateStub.setRequestDetails).toHaveBeenCalledWith(mergeRequestsStateStub.selected);
                                expect(catalogManagerStub.deleteRecordBranch).not.toHaveBeenCalled();
                                expect(toastStub.createWarningToast).not.toHaveBeenCalled();
                                expect(toastStub.createErrorToast).not.toHaveBeenCalled();
                            }));
                            describe('and the ontology editor is on the target branch', function() {
                                beforeEach(function() {
                                    ontologyStateStub.listItem = new OntologyListItem();
                                    ontologyStateStub.listItem.versionedRdfRecord.recordId = recordId;
                                    ontologyStateStub.listItem.versionedRdfRecord.branchId = targetBranchId;
                                    ontologyStateStub.listItem.upToDate = true;
                                    ontologyStateStub.list = [ontologyStateStub.listItem];
                                });
                                it('and it not in the middle of a merge', fakeAsync(function() {
                                    component.acceptRequest();
                                    tick();
                                    mergeRequest.removeSource = false;
                                    expect(mergeRequestManagerStub.updateRequestStatus).toHaveBeenCalledWith(mergeRequest, 'accept');
                                    expect(toastStub.createSuccessToast).toHaveBeenCalledWith(jasmine.any(String));
                                    expect(component.requestStatus).toBe('accepted');
                                    expect(mergeRequestManagerStub.getRequest).toHaveBeenCalledWith(requestId);
                                    expect(mergeRequestsStateStub.selected.jsonld).toEqual(mergeRequestJsonLd);
                                    expect(mergeRequestsStateStub.setRequestDetails).toHaveBeenCalledWith(mergeRequestsStateStub.selected);
                                    expect(catalogManagerStub.deleteRecordBranch).not.toHaveBeenCalled();
                                    expect(ontologyStateStub.listItem.upToDate).toBeFalse();
                                    expect(toastStub.createWarningToast).not.toHaveBeenCalled();
                                    expect(toastStub.createErrorToast).not.toHaveBeenCalled();
                                }));
                                it('and is in the middle of a merge', fakeAsync(function() {
                                    ontologyStateStub.listItem.merge.active = true;
                                    component.acceptRequest();
                                    tick();
                                    mergeRequest.removeSource = false;
                                    expect(mergeRequestManagerStub.updateRequestStatus).toHaveBeenCalledWith(mergeRequest, 'accept');
                                    expect(toastStub.createSuccessToast).toHaveBeenCalledWith(jasmine.any(String));
                                    expect(component.requestStatus).toBe('accepted');
                                    expect(mergeRequestManagerStub.getRequest).toHaveBeenCalledWith(requestId);
                                    expect(mergeRequestsStateStub.selected.jsonld).toEqual(mergeRequestJsonLd);
                                    expect(mergeRequestsStateStub.setRequestDetails).toHaveBeenCalledWith(mergeRequestsStateStub.selected);
                                    expect(catalogManagerStub.deleteRecordBranch).not.toHaveBeenCalled();
                                    expect(ontologyStateStub.listItem.upToDate).toBeFalse();
                                    expect(toastStub.createWarningToast).toHaveBeenCalledWith(jasmine.any(String), {timeOut: 5000});
                                    expect(toastStub.createErrorToast).not.toHaveBeenCalled();
                                }));
                            });
                            it('and the ontology editor is in the middle of merging into the target', fakeAsync(function() {
                                ontologyStateStub.listItem = new OntologyListItem();
                                ontologyStateStub.listItem.versionedRdfRecord.recordId = recordId;
                                ontologyStateStub.listItem.merge.active = true;
                                ontologyStateStub.listItem.merge.target = {'@id': targetBranchId};
                                ontologyStateStub.listItem.upToDate = true;
                                ontologyStateStub.list = [ontologyStateStub.listItem];
                                component.acceptRequest();
                                tick();
                                mergeRequest.removeSource = false;
                                expect(mergeRequestManagerStub.updateRequestStatus).toHaveBeenCalledWith(mergeRequest, 'accept');
                                expect(toastStub.createSuccessToast).toHaveBeenCalledWith(jasmine.any(String));
                                expect(component.requestStatus).toBe('accepted');
                                expect(mergeRequestManagerStub.getRequest).toHaveBeenCalledWith(requestId);
                                expect(mergeRequestsStateStub.selected.jsonld).toEqual(mergeRequestJsonLd);
                                expect(mergeRequestsStateStub.setRequestDetails).toHaveBeenCalledWith(mergeRequestsStateStub.selected);
                                expect(catalogManagerStub.deleteRecordBranch).not.toHaveBeenCalled();
                                expect(ontologyStateStub.listItem.upToDate).toBeTrue();
                                expect(toastStub.createWarningToast).toHaveBeenCalledWith(jasmine.any(String), {timeOut: 5000});
                                expect(toastStub.createErrorToast).not.toHaveBeenCalled();
                            }));
                        });
                    });
                    it('unless setRequestDetails rejects', fakeAsync(function() {
                        mergeRequestsStateStub.setRequestDetails.and.returnValue(throwError(error));
                        component.acceptRequest();
                        tick();
                        expect(mergeRequestManagerStub.updateRequestStatus).toHaveBeenCalledWith(mergeRequest, 'accept');
                        expect(toastStub.createSuccessToast).toHaveBeenCalledWith(jasmine.any(String));
                        expect(component.requestStatus).toBe('accepted');
                        expect(mergeRequestManagerStub.getRequest).toHaveBeenCalledWith(requestId);
                        expect(mergeRequestsStateStub.selected.jsonld).not.toEqual(mergeRequestJsonLd);
                        expect(mergeRequestsStateStub.setRequestDetails).toHaveBeenCalledWith(this.updatedRequest);
                        expect(catalogManagerStub.deleteRecordBranch).not.toHaveBeenCalled();
                        expect(toastStub.createErrorToast).toHaveBeenCalledWith(error);
                    }));
                });
                it('unless getRequest rejects', fakeAsync(function() {
                    mergeRequestManagerStub.getRequest.and.returnValue(throwError(error));
                    component.acceptRequest();
                    tick();
                    expect(toastStub.createSuccessToast).toHaveBeenCalledWith(jasmine.any(String));
                    expect(component.requestStatus).toBe('accepted');
                    expect(mergeRequestManagerStub.getRequest).toHaveBeenCalledWith(requestId);
                    expect(mergeRequestsStateStub.selected.jsonld).not.toEqual(mergeRequestJsonLd);
                    expect(mergeRequestsStateStub.setRequestDetails).not.toHaveBeenCalled();
                    expect(toastStub.createErrorToast).toHaveBeenCalledWith(error);
                }));
            });
            it('unless acceptRequest rejects', fakeAsync(function() {
                mergeRequestManagerStub.updateRequestStatus.and.returnValue(throwError(error));
                component.acceptRequest();
                tick();
                expect(toastStub.createSuccessToast).not.toHaveBeenCalled();
                expect(component.requestStatus).toBe('open');
                expect(mergeRequestManagerStub.getRequest).not.toHaveBeenCalled();
                expect(mergeRequestsStateStub.setRequestDetails).not.toHaveBeenCalled();
                expect(mergeRequestsStateStub.selected.jsonld).not.toEqual(mergeRequestJsonLd);
                expect(toastStub.createErrorToast).toHaveBeenCalledWith(error);
            }));
        });
        it('show the conflict resolution form', function() {
            const copyConflict = Object.assign({}, conflict);
            mergeRequestsStateStub.selected.conflicts = [copyConflict];
            const expectedConflict = Object.assign({}, conflict);
            expectedConflict.resolved = false;
            component.showResolutionForm();
            expect(component.resolveConflicts).toEqual(true);
            expect(component.copiedConflicts).toEqual([expectedConflict]);
            expect(component.resolveError).toEqual(false);
        });
        describe('should resolve conflicts in the request', function() {
            beforeEach(function() {
                const leftDifference = new Difference([{'@id': 'add-right'}], [{'@id': 'del-right'}]);
                const rightDifference = new Difference([{'@id': 'add-left'}], [{'@id': 'del-left'}]);
                this.selectedLeft = {resolved: 'left', right: rightDifference, left: new Difference()};
                this.selectedRight = {resolved: 'right', right: new Difference(), left: leftDifference};
                component.copiedConflicts = [this.selectedLeft, this.selectedRight];
                this.expectedResolutions = new Difference(undefined, [{'@id': 'add-left'}, {'@id': 'add-right'}]);
                component.resolveConflicts = true;
            });
            it('if resolveRequestConflicts resolves', fakeAsync(function() {
                mergeRequestsStateStub.resolveRequestConflicts.and.returnValue(of(null));
                component.resolve();
                tick();
                expect(mergeRequestsStateStub.resolveRequestConflicts).toHaveBeenCalledWith(mergeRequestsStateStub.selected, this.expectedResolutions);
                expect(toastStub.createSuccessToast).toHaveBeenCalledWith(jasmine.any(String));
                expect(component.resolveConflicts).toEqual(false);
                expect(component.copiedConflicts).toEqual([]);
                expect(component.resolveError).toEqual(false);
                expect(toastStub.createErrorToast).not.toHaveBeenCalled();
            }));
            it('unless resolveRequestConflicts rejects', fakeAsync(function() {
                mergeRequestsStateStub.resolveRequestConflicts.and.returnValue(throwError(error));
                component.resolve();
                tick();
                expect(mergeRequestsStateStub.resolveRequestConflicts).toHaveBeenCalledWith(mergeRequestsStateStub.selected, this.expectedResolutions);
                expect(toastStub.createSuccessToast).not.toHaveBeenCalled();
                expect(component.resolveConflicts).toEqual(true);
                expect(component.copiedConflicts).toEqual([this.selectedLeft, this.selectedRight]);
                expect(component.resolveError).toEqual(true);
                expect(toastStub.createErrorToast).toHaveBeenCalledWith(jasmine.any(String));
            }));
        });
        it('should cancel resolving conflicts', function() {
            component.resolveConflicts = true;
            component.copiedConflicts = [conflict];
            component.resolveError = true;
            component.cancelResolve();
            expect(component.resolveConflicts).toEqual(false);
            expect(component.copiedConflicts).toEqual([]);
            expect(component.resolveError).toEqual(false);
        });
        it('should call modal service to open edit overlay', function() {
            component.editRequest();
            expect(matDialog.open).toHaveBeenCalledWith(EditRequestOverlayComponent);
        });
        it('should test whether all conflicts are resolved', function() {
            expect(component.allResolved()).toEqual(true);

            const copyConflict = Object.assign({}, conflict);
            component.copiedConflicts = [copyConflict];
            expect(component.allResolved()).toEqual(false);

            copyConflict.resolved = false;
            expect(component.allResolved()).toEqual(false);

            copyConflict.resolved = true;
            expect(component.allResolved()).toEqual(true);
        });
    });
    describe('contains the correct html', function() {
        beforeEach(function() {
            fixture.detectChanges();
        });
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.merge-request-view')).length).toEqual(1);
            expect(element.queryAll(By.css('.main-details')).length).toEqual(1);
            expect(element.queryAll(By.css('.buttons')).length).toEqual(1);
        });
        describe('when conflicts are', function() {
            describe('being resolved', function() {
                beforeEach(function() {
                    component.resolveConflicts = true;
                    fixture.detectChanges();
                });
                it('for wrapping containers', function() {
                    expect(element.queryAll(By.css('.resolve-conflicts')).length).toEqual(1);
                    expect(element.queryAll(By.css('.buttons .conflicts-buttons')).length).toEqual(1);
                });
                it('with a button to Resolve', function() {
                    const button = element.queryAll(By.css('.buttons button[color="primary"]'))[0];
                    expect(button).toBeDefined();
                    expect(button.nativeElement.innerHTML).toContain('Resolve');
                });
                it('with a button to Cancel', function() {
                    const button = element.queryAll(By.css('.buttons button:not([color="primary"])'))[0];
                    expect(button).toBeDefined();
                    expect(button.nativeElement.innerHTML).toContain('Cancel');
                });
                it('depending on whether all the conflicts are resolved', function() {
                    const button = element.queryAll(By.css('.buttons button[color="primary"]'))[0];
                    expect(button).toBeDefined();
                    const spy = spyOn(component, 'allResolved').and.returnValue(false);
                    fixture.detectChanges();
                    expect(button.properties['disabled']).toBeTruthy();

                    spy.and.returnValue(true);
                    fixture.detectChanges();
                    expect(button.properties['disabled']).toBeFalsy();
                });
                it('depending on whether an error occurred', function() {
                    expect(element.queryAll(By.css('error-display')).length).toEqual(0);

                    component.resolveError = true;
                    fixture.detectChanges();
                    expect(element.queryAll(By.css('error-display')).length).toEqual(1);
                });
            });
            describe('not being resolved', function() {
                it('for wrapping containers', function() {
                    expect(element.queryAll(By.css('.resolve-conflicts-view')).length).toEqual(1);
                    expect(element.queryAll(By.css('.buttons .view-buttons')).length).toEqual(1);
                });
                it('with a merge-request-tabset', function() {
                    expect(element.queryAll(By.css('merge-request-tabset')).length).toEqual(1);
                });
                it('with a button to Delete', function() {
                    const button = element.queryAll(By.css('.buttons button[color="warn"]'))[0];
                    expect(button).toBeDefined();
                    expect(button.nativeElement.innerHTML).toContain('Delete');
                });
                it('with a button to go Back', function() {
                    const button = element.queryAll(By.css('.buttons button:not([color="primary"]):not([color="warn"])'))[0];
                    expect(button).toBeDefined();
                    expect(button.nativeElement.innerHTML).toContain('Back');
                });
                it('depending on whether the merge request is accepted', function() {
                    mergeRequestManagerStub.requestStatus.and.returnValue('open');
                    fixture.detectChanges();
                    mergeRequestsStateStub.selected.assignees = assignees;
                    const button = element.queryAll(By.css('.buttons button[color="primary"]'))[0];
                    expect(button).toBeDefined();
                    expect(button.nativeElement.innerHTML).toContain('Accept');

                    component.requestStatus = 'accepted';
                    fixture.detectChanges();
                    expect(element.queryAll(By.css('.buttons button[color="primary"]')).length).toEqual(0);
                });
                it('depending on whether the merge request has merge conflicts', function() {
                    mergeRequestsStateStub.selected.targetTitle = 'Title';
                    fixture.detectChanges();
                    expect(element.queryAll(By.css('.alert')).length).toEqual(0);

                    mergeRequestsStateStub.selected.conflicts = [conflict];
                    fixture.detectChanges();
                    const indicator = element.queryAll(By.css('.alert'))[0];
                    expect(indicator).toBeDefined();
                    expect(indicator.nativeElement.innerHTML).toContain('This request has conflicts. You can resolve them right now or during the merge process.');
                });
                it('depending on whether the merge request has does not have a target branch set', function() {
                    mergeRequestsStateStub.selected.targetTitle = 'Title';
                    fixture.detectChanges();
                    expect(element.queryAll(By.css('.alert')).length).toEqual(0);
                   
                    mergeRequestsStateStub.selected.targetTitle = '';
                    fixture.detectChanges();
                    const indicator = element.queryAll(By.css('.alert'))[0];
                    expect(indicator).toBeDefined();
                    expect(indicator.nativeElement.innerHTML).toContain('The target branch for this merge request has been deleted.');
                });
            });
        });
        it('depending on how many assignees the request has', function() {
            const listItems = element.queryAll(By.css('.assignees li'));
            expect(listItems.length).toEqual(1);
            expect(listItems[0].nativeElement.innerHTML).toContain('None specified');

            mergeRequestsStateStub.selected.assignees = assignees;
            fixture.detectChanges();
            expect(element.queryAll(By.css('.assignees li')).length).toEqual(1);
        });
        it('depending on if the source branch is to be removed', function() {
            const checkbox = element.queryAll(By.css('mat-checkbox'))[0];
            expect(checkbox).toBeDefined();
            expect(checkbox.attributes['ng-reflect-model']).toEqual('true');

            mergeRequestsStateStub.selected.removeSource = false;
            fixture.detectChanges();
            expect(checkbox.attributes['ng-reflect-model']).toEqual('false');
        });
        it('depending on whether the source branch is the MASTER branch', function() {
            expect(element.queryAll(By.css('mat-checkbox')).length).toEqual(1);

            mergeRequestsStateStub.selected.sourceTitle = 'MASTER';
            fixture.detectChanges();
            expect(element.queryAll(By.css('mat-checkbox')).length).toEqual(0);
        });
        it('depending on whether the merge request is open', function() {
            const indicator = element.queryAll(By.css('.main-details mat-chip'))[0];
            expect(indicator).toBeDefined();
            expect(indicator.classes['mat-primary']).toBeTruthy();
            expect(indicator.nativeElement.innerHTML).toContain('Open');
        });
        it('depending on whether the merge request is accepted', function() {
            const indicator = element.queryAll(By.css('.main-details mat-chip'))[0];
            component.requestStatus = 'accepted';
            component.setStatusChipClass();
            fixture.detectChanges();
            expect(indicator).toBeDefined();
            expect(indicator.classes['chip-accepted']).toBeTruthy();
            expect(indicator.nativeElement.innerHTML).toContain('Accepted');
        });
        it('depending on whether the merge request is closed', function() {
            component.requestStatus = 'closed';
            component.setStatusChipClass();
            fixture.detectChanges();
            const indicator = element.queryAll(By.css('.main-details mat-chip'))[0];
            const reopenButton = element.queryAll(By.css('.button-reopen'))[0];
            const deleteButton = element.queryAll(By.css('.button-delete'))[0];
            expect(reopenButton).toBeDefined();
            expect(deleteButton).toBeDefined();
            expect(indicator).toBeDefined();
            expect(indicator.classes['chip-closed']).toBeTruthy();
            expect(indicator.nativeElement.innerHTML).toContain('Closed');
        });
        it('depending on whether the user is not authorized and the merge request is closed', fakeAsync(function() {
            mergeRequestManagerStub.requestStatus.and.returnValue('closed');
            policyEnforcementStub.evaluateRequest.and.returnValue(of('Deny'));
            mergeRequestsStateStub.selected.jsonld[`${MERGEREQ}targetBranch`] = [{'@id': targetBranchId}];
            component.ngOnInit();
            tick();
            fixture.detectChanges();
            const reopenButton: HTMLElement = nativeElement.querySelector('.button-reopen');
            expect(reopenButton.title).toEqual(component.reopenAccessMsg);
            expect(component.isSubmitDisabled).toBeTruthy();
            expect(reopenButton.getAttribute('disabled')).toBeTruthy();
        }));
        it('depending on whether the merge request is closed and a branch is deleted', function() {
            component.requestStatus = 'closed';
            mergeRequestsStateStub.selected.jsonld[`${MERGEREQ}targetBranch`] = undefined;
            component.setButtonsStatus(true);
            component.setStatusChipClass();
            fixture.detectChanges();
            const indicator = element.queryAll(By.css('.main-details mat-chip'))[0];
            const reopenButton: HTMLElement = nativeElement.querySelector('.button-reopen');
            expect(reopenButton).toBeDefined();
            expect(indicator).toBeDefined();
            expect(indicator.classes['chip-closed']).toBeTruthy();
            expect(indicator.nativeElement.innerHTML).toContain('Closed');
            expect(reopenButton.getAttribute('disabled')).toBeTruthy();
            expect(reopenButton.title).toEqual(component.reopenMissingBranchMsg);
        });
        it('depending on whether the user is not authorized', fakeAsync(function() {
            policyEnforcementStub.evaluateRequest.and.returnValue(of('Deny'));
            component.ngOnInit();
            tick();
            fixture.detectChanges();
            const button: HTMLElement = nativeElement.querySelector('.button-accept');
            expect(button.title).toEqual(component.userAccessMsg);
            expect(component.isSubmitDisabled).toBeTruthy();
            expect(button.getAttribute('disabled')).toBeTruthy();
        }));
    });
    it('should call showResolutionForm when the resolve button is clicked in the alert', function() {
        mergeRequestsStateStub.selected.conflicts = [conflict];
        fixture.detectChanges();
        spyOn(component, 'showResolutionForm');
        const button = element.queryAll(By.css('.alert button'))[0];
        expect(button).toBeDefined();
        button.triggerEventHandler('click', null);
        expect(component.showResolutionForm).toHaveBeenCalledWith();
    });
    it('should call showDelete when the delete button is clicked', function() {
        fixture.detectChanges();
        spyOn(component, 'showDelete');
        const button = element.queryAll(By.css('.buttons button[color="warn"]'))[0];
        expect(button).toBeDefined();
        button.triggerEventHandler('click', null);
        expect(component.showDelete).toHaveBeenCalledWith();
    });
    it('should call showAccept when the accept button is clicked', function() {
        fixture.detectChanges();
        spyOn(component, 'showAccept');
        const button = element.queryAll(By.css('.buttons button[color="primary"]'))[0];
        expect(button).toBeDefined();
        button.triggerEventHandler('click', null);
        expect(component.showAccept).toHaveBeenCalledWith();
    });
    it('should call showReopen when the accept button is clicked', function() {
        fixture.detectChanges();
        component.requestStatus = 'closed';
        fixture.detectChanges();
        spyOn(component, 'showReopen');
        const reopenButton = element.queryAll(By.css('.button-reopen'))[0];
        expect(reopenButton).toBeDefined();
        reopenButton.triggerEventHandler('click', null);
        expect(component.showReopen).toHaveBeenCalledWith();
    });
    it('should call back when the button is clicked', function() {
        fixture.detectChanges();
        spyOn(component, 'back');
        const button = element.queryAll(By.css('.buttons button:not([color="primary"]):not([color="warn"])'))[0];
        expect(button).toBeDefined();
        button.triggerEventHandler('click', null);
        expect(component.back).toHaveBeenCalledWith();
    });
    it('should call cancelResolve when the cancel button is clicked', function() {
        component.resolveConflicts = true;
        fixture.detectChanges();
        spyOn(component, 'cancelResolve');
        const button = element.queryAll(By.css('.buttons button:not([color="primary"])'))[0];
        expect(button).toBeDefined();
        button.triggerEventHandler('click', null);
        expect(component.cancelResolve).toHaveBeenCalledWith();
    });
    it('should call resolve when the button is clicked', function() {
        component.resolveConflicts = true;
        fixture.detectChanges();
        spyOn(component, 'resolve');
        const button = element.queryAll(By.css('.buttons button[color="primary"]'))[0];
        expect(button).toBeDefined();
        button.triggerEventHandler('click', null);
        expect(component.resolve).toHaveBeenCalledWith();
    });
});
