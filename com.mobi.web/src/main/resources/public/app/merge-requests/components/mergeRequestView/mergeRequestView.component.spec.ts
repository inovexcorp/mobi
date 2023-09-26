/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2023 iNovex Information Systems, Inc.
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

import {
    cleanStylesFromDOM,
} from '../../../../../public/test/ts/Shared';
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
import { User } from '../../../shared/models/user.interface';
import { CATALOG, DCTERMS, MERGEREQ } from '../../../prefixes';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { MergeRequestViewComponent } from './mergeRequestView.component';
import { RecordIconComponent } from '../../../shared/components/recordIcon/recordIcon.component';
import { cloneDeep } from 'lodash';
import { MergeRequest } from '../../../shared/models/mergeRequest.interface';

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
    const branchId = 'branchId';
    const jsonld = {
      '@id': requestId,
      [`${MERGEREQ}`]: [{ '@id': branchId }]
    };
    const userIri = 'urn:test';
    const assignees = ['bruce', 'clark'];

    const user: User = {
        iri: userIri,
        firstName: 'Bruce',
        external: false,
        username: 'bruce',
        lastName: '',
        email: '',
        roles: []
    };

    const conflict: Conflict = {iri: 'iri', left: new Difference(), right: new Difference()};
    const catalogId = 'catalog';
    const branch = {
        '@id': 'branch123',
        [`${CATALOG}head`]: [{'@id': 'commit123'}],
        [`${DCTERMS}title`]: [{'@value': 'MASTER'}]
    };
    const branches = [branch];
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
        mergeRequestManagerStub.getRequest.and.returnValue(of(jsonld));
        mergeRequestsStateStub.setRequestDetails.and.returnValue(of(null));
        mergeRequestsStateStub.selected = {
            title: 'title',
            date: '',
            creator: '',
            recordIri: recordId,
            sourceBranch: {'@id': branchId},
            targetBranch: {'@id': branchId},
            removeSource: true,
            assignees: [],
            jsonld
        };
        mergeRequest = cloneDeep(mergeRequestsStateStub.selected)
        loginManagerStub.currentUserIRI = userIri;
        userManagerStub.users = [user];
        policyEnforcementStub.evaluateRequest.and.returnValue(of('Permit'));
        policyEnforcementStub.deny = 'Deny';
        policyEnforcementStub.permit = 'Permit';
        userManagerStub.isAdminUser.and.returnValue(false);
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
              [`${MERGEREQ}`]: [{ '@id': branchId }]
            };
            mergeRequestManagerStub.isAccepted.and.returnValue(true);
        });
        it('resolves', fakeAsync(function() {
            mergeRequestsStateStub.selected.assignees = assignees;
            fixture.detectChanges();
            component.ngOnInit();
            tick();
            expect(mergeRequestManagerStub.getRequest).toHaveBeenCalledWith(requestId);
            expect(mergeRequestsStateStub.selected.jsonld).toEqual(jsonld);
            expect(mergeRequestManagerStub.isAccepted).toHaveBeenCalledWith(jsonld);
            expect(component.isAccepted).toBeTrue();
            expect(component.isSubmitDisabled).toBeFalsy();
            expect(mergeRequestsStateStub.setRequestDetails).toHaveBeenCalledWith(mergeRequestsStateStub.selected);
            expect(toastStub.createWarningToast).not.toHaveBeenCalled();
            expect(mergeRequestsStateStub.selected).toBeDefined();
        }));
        it('rejects', fakeAsync(function() {
            spyOn(component, 'back');
            mergeRequestManagerStub.getRequest.and.returnValue(throwError(error));
            component.ngOnInit();
            tick();
            expect(mergeRequestManagerStub.getRequest).toHaveBeenCalledWith(requestId);
            expect(mergeRequestManagerStub.isAccepted).not.toHaveBeenCalled();
            expect(component.isAccepted).toBeFalse();
            expect(mergeRequestsStateStub.selected.jsonld).not.toEqual(jsonld);
            expect(mergeRequestsStateStub.setRequestDetails).not.toHaveBeenCalled();
            expect(toastStub.createWarningToast).toHaveBeenCalledWith(jasmine.any(String));
            expect(component.back).toHaveBeenCalledWith();
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
        describe('should accept a merge request', function() {
            beforeEach(function() {
                this.updatedRequest = Object.assign({}, mergeRequestsStateStub.selected);
                mergeRequestsStateStub.selected.jsonld = {'@id': requestId, '@type': []};
            });
            describe('if acceptRequest resolves', function() {
                beforeEach(function() {
                    mergeRequestManagerStub.acceptRequest.and.returnValue(of(null));
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
                                    expect(mergeRequestManagerStub.acceptRequest).toHaveBeenCalledWith(mergeRequest);
                                    expect(toastStub.createSuccessToast).toHaveBeenCalledWith(jasmine.any(String));
                                    expect(component.isAccepted).toBeTrue();
                                    expect(mergeRequestManagerStub.getRequest).toHaveBeenCalledWith(requestId);
                                    expect(mergeRequestsStateStub.selected.jsonld).toEqual(jsonld);
                                    expect(mergeRequestsStateStub.setRequestDetails).toHaveBeenCalledWith(mergeRequestsStateStub.selected);
                                    expect(catalogManagerStub.deleteRecordBranch).toHaveBeenCalledWith(recordId, branchId, catalogId);
                                    expect(toastStub.createWarningToast).not.toHaveBeenCalled();
                                    expect(toastStub.createErrorToast).not.toHaveBeenCalled();
                                }));
                                describe('and the ontology editor is on the target branch', function() {
                                    beforeEach(function() {
                                        ontologyStateStub.listItem = new OntologyListItem();
                                        ontologyStateStub.listItem.versionedRdfRecord.recordId = recordId;
                                        ontologyStateStub.listItem.versionedRdfRecord.branchId = branchId;
                                        ontologyStateStub.listItem.upToDate = true;
                                        ontologyStateStub.list = [ontologyStateStub.listItem];
                                    });
                                    it('and it not in the middle of a merge', fakeAsync(function() {
                                        component.acceptRequest();
                                        tick();
                                        expect(mergeRequestManagerStub.acceptRequest).toHaveBeenCalledWith(mergeRequest);
                                        expect(toastStub.createSuccessToast).toHaveBeenCalledWith(jasmine.any(String));
                                        expect(component.isAccepted).toBeTrue();
                                        expect(mergeRequestManagerStub.getRequest).toHaveBeenCalledWith(requestId);
                                        expect(mergeRequestsStateStub.selected.jsonld).toEqual(jsonld);
                                        expect(mergeRequestsStateStub.setRequestDetails).toHaveBeenCalledWith(mergeRequestsStateStub.selected);
                                        expect(catalogManagerStub.deleteRecordBranch).toHaveBeenCalledWith(recordId, branchId, catalogId);
                                        expect(ontologyStateStub.listItem.upToDate).toBeFalse();
                                        expect(toastStub.createWarningToast).not.toHaveBeenCalled();
                                        expect(toastStub.createErrorToast).not.toHaveBeenCalled();
                                    }));
                                    it('and is in the middle of a merge', fakeAsync(function() {
                                        ontologyStateStub.listItem.merge.active = true;
                                        component.acceptRequest();
                                        tick();
                                        expect(mergeRequestManagerStub.acceptRequest).toHaveBeenCalledWith(mergeRequest);
                                        expect(toastStub.createSuccessToast).toHaveBeenCalledWith(jasmine.any(String));
                                        expect(component.isAccepted).toBeTrue();
                                        expect(mergeRequestManagerStub.getRequest).toHaveBeenCalledWith(requestId);
                                        expect(mergeRequestsStateStub.selected.jsonld).toEqual(jsonld);
                                        expect(mergeRequestsStateStub.setRequestDetails).toHaveBeenCalledWith(mergeRequestsStateStub.selected);
                                        expect(catalogManagerStub.deleteRecordBranch).toHaveBeenCalledWith(recordId, branchId, catalogId);
                                        expect(ontologyStateStub.listItem.upToDate).toBeFalse();
                                        expect(toastStub.createWarningToast).toHaveBeenCalledWith(jasmine.any(String), {timeOut: 5000});
                                        expect(toastStub.createErrorToast).not.toHaveBeenCalled();
                                    }));
                                });
                                it('and the ontology editor is in the middle of merging into the target', fakeAsync(function() {
                                    ontologyStateStub.listItem = new OntologyListItem();
                                    ontologyStateStub.listItem.versionedRdfRecord.recordId = recordId;
                                    ontologyStateStub.listItem.merge.active = true;
                                    ontologyStateStub.listItem.merge.target = {'@id': branchId};
                                    ontologyStateStub.listItem.upToDate = true;
                                    ontologyStateStub.list = [ontologyStateStub.listItem];
                                    component.acceptRequest();
                                    tick();
                                    expect(mergeRequestManagerStub.acceptRequest).toHaveBeenCalledWith(mergeRequest);
                                    expect(toastStub.createSuccessToast).toHaveBeenCalledWith(jasmine.any(String));
                                    expect(component.isAccepted).toBeTrue();
                                    expect(mergeRequestManagerStub.getRequest).toHaveBeenCalledWith(requestId);
                                    expect(mergeRequestsStateStub.selected.jsonld).toEqual(jsonld);
                                    expect(mergeRequestsStateStub.setRequestDetails).toHaveBeenCalledWith(mergeRequestsStateStub.selected);
                                    expect(catalogManagerStub.deleteRecordBranch).toHaveBeenCalledWith(recordId, branchId, catalogId);
                                    expect(ontologyStateStub.listItem.upToDate).toBeTrue();
                                    expect(toastStub.createWarningToast).toHaveBeenCalledWith(jasmine.any(String), {timeOut: 5000});
                                    expect(toastStub.createErrorToast).not.toHaveBeenCalled();
                                }));
                            });
                            it('unless deleteOntologyBranch rejects', fakeAsync(function() {
                                catalogManagerStub.deleteRecordBranch.and.returnValue(throwError(error));
                                component.acceptRequest();
                                tick();
                                expect(mergeRequestManagerStub.acceptRequest).toHaveBeenCalledWith(mergeRequest);
                                expect(toastStub.createSuccessToast).toHaveBeenCalledWith(jasmine.any(String));
                                expect(component.isAccepted).toBeTrue();
                                expect(mergeRequestManagerStub.getRequest).toHaveBeenCalledWith(requestId);
                                expect(mergeRequestsStateStub.selected.jsonld).not.toEqual(jsonld);
                                expect(mergeRequestsStateStub.setRequestDetails).toHaveBeenCalledWith(this.updatedRequest);
                                expect(catalogManagerStub.deleteRecordBranch).toHaveBeenCalledWith(recordId, branchId, catalogId);
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
                                expect(mergeRequestManagerStub.acceptRequest).toHaveBeenCalledWith(mergeRequest);
                                expect(toastStub.createSuccessToast).toHaveBeenCalledWith(jasmine.any(String));
                                expect(component.isAccepted).toBeTrue();
                                expect(mergeRequestManagerStub.getRequest).toHaveBeenCalledWith(requestId);
                                expect(mergeRequestsStateStub.selected.jsonld).toEqual(jsonld);
                                expect(mergeRequestsStateStub.setRequestDetails).toHaveBeenCalledWith(mergeRequestsStateStub.selected);
                                expect(catalogManagerStub.deleteRecordBranch).not.toHaveBeenCalled();
                                expect(toastStub.createWarningToast).not.toHaveBeenCalled();
                                expect(toastStub.createErrorToast).not.toHaveBeenCalled();
                            }));
                            describe('and the ontology editor is on the target branch', function() {
                                beforeEach(function() {
                                    ontologyStateStub.listItem = new OntologyListItem();
                                    ontologyStateStub.listItem.versionedRdfRecord.recordId = recordId;
                                    ontologyStateStub.listItem.versionedRdfRecord.branchId = branchId;
                                    ontologyStateStub.listItem.upToDate = true;
                                    ontologyStateStub.list = [ontologyStateStub.listItem];
                                });
                                it('and it not in the middle of a merge', fakeAsync(function() {
                                    component.acceptRequest();
                                    tick();
                                    mergeRequest.removeSource = false;
                                    expect(mergeRequestManagerStub.acceptRequest).toHaveBeenCalledWith(mergeRequest);
                                    expect(toastStub.createSuccessToast).toHaveBeenCalledWith(jasmine.any(String));
                                    expect(component.isAccepted).toBeTrue();
                                    expect(mergeRequestManagerStub.getRequest).toHaveBeenCalledWith(requestId);
                                    expect(mergeRequestsStateStub.selected.jsonld).toEqual(jsonld);
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
                                    expect(mergeRequestManagerStub.acceptRequest).toHaveBeenCalledWith(mergeRequest);
                                    expect(toastStub.createSuccessToast).toHaveBeenCalledWith(jasmine.any(String));
                                    expect(component.isAccepted).toBeTrue();
                                    expect(mergeRequestManagerStub.getRequest).toHaveBeenCalledWith(requestId);
                                    expect(mergeRequestsStateStub.selected.jsonld).toEqual(jsonld);
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
                                ontologyStateStub.listItem.merge.target = {'@id': branchId};
                                ontologyStateStub.listItem.upToDate = true;
                                ontologyStateStub.list = [ontologyStateStub.listItem];
                                component.acceptRequest();
                                tick();
                                mergeRequest.removeSource = false;
                                expect(mergeRequestManagerStub.acceptRequest).toHaveBeenCalledWith(mergeRequest);
                                expect(toastStub.createSuccessToast).toHaveBeenCalledWith(jasmine.any(String));
                                expect(component.isAccepted).toBeTrue();
                                expect(mergeRequestManagerStub.getRequest).toHaveBeenCalledWith(requestId);
                                expect(mergeRequestsStateStub.selected.jsonld).toEqual(jsonld);
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
                        expect(mergeRequestManagerStub.acceptRequest).toHaveBeenCalledWith(mergeRequest);
                        expect(toastStub.createSuccessToast).toHaveBeenCalledWith(jasmine.any(String));
                        expect(component.isAccepted).toBeTrue();
                        expect(mergeRequestManagerStub.getRequest).toHaveBeenCalledWith(requestId);
                        expect(mergeRequestsStateStub.selected.jsonld).not.toEqual(jsonld);
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
                    expect(component.isAccepted).toBeTrue();
                    expect(mergeRequestManagerStub.getRequest).toHaveBeenCalledWith(requestId);
                    expect(mergeRequestsStateStub.selected.jsonld).not.toEqual(jsonld);
                    expect(mergeRequestsStateStub.setRequestDetails).not.toHaveBeenCalled();
                    expect(toastStub.createErrorToast).toHaveBeenCalledWith(error);
                }));
            });
            it('unless acceptRequest rejects', fakeAsync(function() {
                mergeRequestManagerStub.acceptRequest.and.returnValue(throwError(error));
                component.acceptRequest();
                tick();
                expect(toastStub.createSuccessToast).not.toHaveBeenCalled();
                expect(component.isAccepted).toBeFalse();
                expect(mergeRequestManagerStub.getRequest).not.toHaveBeenCalled();
                expect(mergeRequestsStateStub.setRequestDetails).not.toHaveBeenCalled();
                expect(mergeRequestsStateStub.selected.jsonld).not.toEqual(jsonld);
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
                    expect(button).not.toBeNull();
                    expect(button.nativeElement.innerHTML).toContain('Resolve');
                });
                it('with a button to Cancel', function() {
                    const button = element.queryAll(By.css('.buttons button:not([color="primary"])'))[0];
                    expect(button).not.toBeNull();
                    expect(button.nativeElement.innerHTML).toContain('Cancel');
                });
                it('depending on whether all the conflicts are resolved', function() {
                    const button = element.queryAll(By.css('.buttons button[color="primary"]'))[0];
                    expect(button).not.toBeNull();
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
                    expect(element.queryAll(By.css('.view')).length).toEqual(1);
                    expect(element.queryAll(By.css('.buttons .view-buttons')).length).toEqual(1);
                });
                it('with a merge-request-tabset', function() {
                    expect(element.queryAll(By.css('merge-request-tabset')).length).toEqual(1);
                });
                it('with a button to Delete', function() {
                    const button = element.queryAll(By.css('.buttons button[color="warn"]'))[0];
                    expect(button).not.toBeNull();
                    expect(button.nativeElement.innerHTML).toContain('Delete');
                });
                it('with a button to go Back', function() {
                    const button = element.queryAll(By.css('.buttons button:not([color="primary"]):not([color="warn"])'))[0];
                    expect(button).not.toBeNull();
                    expect(button.nativeElement.innerHTML).toContain('Back');
                });
                it('depending on whether the merge request is accepted', function() {
                    const button = element.queryAll(By.css('.buttons button[color="primary"]'))[0];
                    expect(button).not.toBeNull();
                    expect(button.nativeElement.innerHTML).toContain('Accept');

                    component.isAccepted = true;
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
                    expect(indicator).not.toBeNull();
                    expect(indicator.nativeElement.innerHTML).toContain('This request has conflicts. You can resolve them right now or during the merge process.');
                });
                it('depending on whether the merge request has does not have a target branch set', function() {
                    mergeRequestsStateStub.selected.targetTitle = 'Title';
                    fixture.detectChanges();
                    expect(element.queryAll(By.css('.alert')).length).toEqual(0);
                   
                    mergeRequestsStateStub.selected.targetTitle = '';
                    fixture.detectChanges();
                    const indicator = element.queryAll(By.css('.alert'))[0];
                    expect(indicator).not.toBeNull();
                    expect(indicator.nativeElement.innerHTML).toContain('The target branch for this merge request has been deleted.');
                });
            });
        });
        it('depending on how many assignees the request has', function() {
            const listItems = element.queryAll(By.css('.assignees li'));
            expect(listItems.length).toEqual(1);
            expect(listItems[0].nativeElement.innerHTML).toContain('None specified');

            mergeRequestsStateStub.selected.assignees = ['user1', 'user2'];
            fixture.detectChanges();
            expect(element.queryAll(By.css('.assignees li')).length).toEqual(1);
        });
        it('depending on if the source branch is to be removed', function() {
            const checkbox = element.queryAll(By.css('mat-checkbox'))[0];
            expect(checkbox).not.toBeNull();
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
        it('depending on whether the merge request is accepted', function() {
            const indicator = element.queryAll(By.css('.main-details mat-chip'))[0];
            expect(indicator).not.toBeNull();
            expect(indicator.classes['mat-success']).toBeTruthy();
            expect(indicator.nativeElement.innerHTML).toContain('Open');
            
            component.isAccepted = true;
            fixture.detectChanges();
            expect(indicator.classes['mat-primary']).toBeTruthy();
            expect(indicator.nativeElement.innerHTML).toContain('Accepted');
        });
        it('depending on whether the user is not authorize', async function() {
            mergeRequestsStateStub.selected.assignees = ['user1', 'user2'];
            fixture.detectChanges();
            component.ngOnInit();
            await fixture.whenStable();
            const button: HTMLElement = nativeElement.querySelector('.button-accept');
            expect(button.title).toEqual(component.userAccessMsg);
            expect(component.isSubmitDisabled).toBeTruthy();
            expect(button.getAttribute('disabled')).toBeTruthy();
        });
    });
    it('should call showResolutionForm when the resolve button is clicked in the alert', function() {
        mergeRequestsStateStub.selected.conflicts = [conflict];
        fixture.detectChanges();
        spyOn(component, 'showResolutionForm');
        const button = element.queryAll(By.css('.alert button'))[0];
        expect(button).not.toBeNull();
        button.triggerEventHandler('click', null);
        expect(component.showResolutionForm).toHaveBeenCalledWith();
    });
    it('should call showDelete when the delete button is clicked', function() {
        fixture.detectChanges();
        spyOn(component, 'showDelete');
        const button = element.queryAll(By.css('.buttons button[color="warn"]'))[0];
        expect(button).not.toBeNull();
        button.triggerEventHandler('click', null);
        expect(component.showDelete).toHaveBeenCalledWith();
    });
    it('should call showAccept when the accept button is clicked', function() {
        fixture.detectChanges();
        spyOn(component, 'showAccept');
        const button = element.queryAll(By.css('.buttons button[color="primary"]'))[0];
        expect(button).not.toBeNull();
        button.triggerEventHandler('click', null);
        expect(component.showAccept).toHaveBeenCalledWith();
    });
    it('should call back when the button is clicked', function() {
        fixture.detectChanges();
        spyOn(component, 'back');
        const button = element.queryAll(By.css('.buttons button:not([color="primary"]):not([color="warn"])'))[0];
        expect(button).not.toBeNull();
        button.triggerEventHandler('click', null);
        expect(component.back).toHaveBeenCalledWith();
    });
    it('should call cancelResolve when the cancel button is clicked', function() {
        component.resolveConflicts = true;
        fixture.detectChanges();
        spyOn(component, 'cancelResolve');
        const button = element.queryAll(By.css('.buttons button:not([color="primary"])'))[0];
        expect(button).not.toBeNull();
        button.triggerEventHandler('click', null);
        expect(component.cancelResolve).toHaveBeenCalledWith();
    });
    it('should call resolve when the button is clicked', function() {
        component.resolveConflicts = true;
        fixture.detectChanges();
        spyOn(component, 'resolve');
        const button = element.queryAll(By.css('.buttons button[color="primary"]'))[0];
        expect(button).not.toBeNull();
        button.triggerEventHandler('click', null);
        expect(component.resolve).toHaveBeenCalledWith();
    });
});
