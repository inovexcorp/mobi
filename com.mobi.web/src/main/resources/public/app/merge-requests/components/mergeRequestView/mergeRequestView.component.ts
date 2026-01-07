/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { forEach, concat, some, get } from 'lodash';
import { Subject, of } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';

import { ConfirmModalComponent } from '../../../shared/components/confirmModal/confirmModal.component';
import { Conflict } from '../../../shared/models/conflict.interface';
import { Difference } from '../../../shared/models/difference.class';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { MergeRequestStatus } from '../../../shared/models/merge-request-status';
import { MergeRequestManagerService } from '../../../shared/services/mergeRequestManager.service';
import { MergeRequestsStateService } from '../../../shared/services/mergeRequestsState.service';
import { EditRequestOverlayComponent } from '../editRequestOverlay/editRequestOverlay.component';
import { ToastService } from '../../../shared/services/toast.service';
import { CATALOG, DCTERMS, MERGEREQ, POLICY } from '../../../prefixes';
import { PolicyEnforcementService } from '../../../shared/services/policyEnforcement.service';
import { LoginManagerService } from '../../../shared/services/loginManager.service';
import { UserManagerService } from '../../../shared/services/userManager.service';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { getPropertyId } from '../../../shared/utility';
import { MergeRequest } from '../../../shared/models/mergeRequest.interface';
import { User } from '../../../shared/models/user.class';

/**
 * @class merge-requests.MergeRequestViewComponent
 *
 * A component which creates a div containing a display of metadata about the
 * {@link shared.MergeRequestsStateService selected MergeRequest} including a
 * {@link shared.CommitDifferenceTabsetComponent} to display the changes and commits between the source and target
 * branch of the MergeRequest. The block also contains buttons to delete the MergeRequest, accept the MergeRequest, and
 * go back to the {@link merge-requests.MergeRequestListComponent}. This component houses the method for opening a
 * modal for accepting merge requests.
 */
@Component({
    selector: 'merge-request-view',
    templateUrl: './mergeRequestView.component.html',
    styleUrls: ['./mergeRequestView.component.scss']
})
export class MergeRequestViewComponent implements OnInit, OnDestroy {
    userAccessMsg = 'You are not assigned to and do not have permission to accept this merge.';
    closeAccessMsg = 'You do not have permission to close this merge.';
    deleteAccessMsg = 'You do not have permission to delete this merge.';
    reopenAccessMsg = 'You do not have permission to reopen this merge.';
    canNotEditMsg = 'You can not edit the metadata of this merge.';
    reopenMissingBranchMsg = 'Cannot be reopened due to missing source or target branch';
    closeMissingBranchMsg = 'Cannot be closed due to missing source or target branch'

    resolveConflicts = false;
    copiedConflicts: Conflict[] = [];
    resolveError = false;
    requestStatus: MergeRequestStatus = 'open';

    statusChipClass = 'mat-primary';
    // controls for view-buttons (Accept, Close, Delete)
    isSubmitDisabled = false;
    buttonsDisabled = false;
    acceptButtonTitle = '';
    closeButtonTitle = '';
    deleteButtonTitle = '';
    reopenButtonTitle = '';
    // control for editing metadata
    editButtonTitle = '';

    isAdminUser: boolean;
    currentAssignees: User[] = [];
    creator: User;

    targetIRI = `${MERGEREQ}targetBranch`;
    sourceIRI = `${MERGEREQ}sourceBranch`;
    
    private _destroySub$ = new Subject<void>();
    
    constructor(public mm: MergeRequestManagerService,
                public state: MergeRequestsStateService,
                private dialog: MatDialog,
                private toast: ToastService,
                public um: UserManagerService,
                private lm: LoginManagerService,
                protected cm: CatalogManagerService,
                private pep: PolicyEnforcementService) {}
    /**
     * MergeRequestListComponent triggers MergeRequestViewComponent when user click on card via `state.selected = request`
     * When MergeRequestViewComponent initialize, component should change page based on user permissions
     */
    ngOnInit(): void {
        this.isAdminUser = this.um.isAdminUser(this.lm.currentUserIRI);
        if (this.isAdminUser) {
            this.setButtonsStatus(true);
        } else {
            const creatorIRIs: string[] = this.state.selected.jsonld[`${DCTERMS}creator`].map(r => r['@id']);
            const isCreator: boolean  = creatorIRIs.includes(this.lm.currentUserIRI);
            if (isCreator) {
                this.setButtonsStatus(true);
            } else {
                // Check if user has managed permission on MergeRequest#OnRecord
                const managePermissionOnRecordRequest = {
                    resourceId: this.state.selected.recordIri,
                    actionId: `${POLICY}Update`,
                };
                this.pep.evaluateRequest(managePermissionOnRecordRequest).pipe(takeUntil(this._destroySub$)).subscribe(decision => {
                    const isPermit = decision === this.pep.permit;
                    this.setButtonsStatus(isPermit);
                }, () => {
                    this.setButtonsStatus(false);
                });
            }
            // Check if user can modify targetBranch
            const targetBranchId = getPropertyId(this.state.selected.jsonld, `${MERGEREQ}targetBranch`);
            const manageTargetBranchPermissionRequest = {
                resourceId: this.state.selected.recordIri,
                actionId: `${CATALOG}Modify`,
                actionAttrs: {
                    [`${CATALOG}branch`]: targetBranchId
                }
            };
            this.pep.evaluateRequest(manageTargetBranchPermissionRequest).pipe(takeUntil(this._destroySub$)).subscribe(decision => {
                const isPermit = decision === this.pep.permit;
                this.isSubmitDisabled = !isPermit;
                this.acceptButtonTitle = this.isSubmitDisabled ?  this.userAccessMsg : '';
            }, () => {
                this.isSubmitDisabled = true;
                this.acceptButtonTitle = this.isSubmitDisabled ?  this.userAccessMsg : '';
            });
        } 

        this.mm.getRequest(this.state.selected.jsonld['@id']).pipe(
            takeUntil(this._destroySub$),
            switchMap((jsonld: JSONLDObject)=>{
                this.state.selected.jsonld = jsonld;
                this.requestStatus = this.mm.requestStatus(this.state.selected.jsonld);
                this.setStatusChipClass();
                return this.state.setRequestDetails(this.state.selected);
            })
        ).subscribe({
            next: () => {
                if (this.state.selected) {
                    this.currentAssignees = this.state.selected.assignees.slice();
                }
            }, 
            error: () => {
                this.setButtonsStatus(false);
                this.isSubmitDisabled = true;
                this.toast.createWarningToast('The request you had selected no longer exists');
                this.back();
            }
        });
    }
    ngOnDestroy(): void {
        this._destroySub$.next();
        this._destroySub$.complete();
        this.state.clearDifference();
    }
    setButtonsStatus(isPermit: boolean): void {
        this.buttonsDisabled = !isPermit;
        this.deleteButtonTitle = this.buttonsDisabled ?  this.deleteAccessMsg : '';
        this.editButtonTitle = this.buttonsDisabled ?  this.canNotEditMsg : '';
        this.closeButtonTitle = this.buttonsDisabled ?  this.closeAccessMsg : '';
        this.reopenButtonTitle = this.buttonsDisabled ?  this.reopenAccessMsg : '';
    }
    setStatusChipClass(): void {
        if (this.requestStatus === 'open') {
            this.statusChipClass = 'mat-primary';
        } else if (this.requestStatus === 'accepted') {
            this.statusChipClass = 'chip-accepted';
        }  else if (this.requestStatus === 'closed') {
            this.statusChipClass = 'chip-closed';
        }
    }
    back(): void {
        this.state.selected = undefined;
    }
    showDelete(): void {
        this.dialog.open(ConfirmModalComponent, {
            data: {
                content: `<p>Are you sure you want to delete <strong>${this.state.selected.title}</strong.?</p>`
            }
        }).afterClosed().subscribe((result: boolean) => {
            if (result) {
                this.state.deleteRequest(this.state.selected)
                    .subscribe(() => {}, error => this.toast.createErrorToast(error));
            }
        });
    }
    showAccept(): void {
        this.dialog.open(ConfirmModalComponent, {
            data: {
                content: `<p>Are you sure you want to accept <strong>${this.state.selected.title}</strong. ?</p>`
            }
        }).afterClosed().subscribe((result: boolean) => {
            if (result) {
                this.acceptRequest();
            }
        });
    }
    showClose(): void {
        this.dialog.open(ConfirmModalComponent, {
            data: {
                content: `<p>Are you sure you want to close <strong>${this.state.selected.title}</strong. ?</p>`
            }
        }).afterClosed().subscribe((result: boolean) => {
            if (result) {
                this.closeRequest();
            }
        });
    }
    showReopen(): void {
        this.dialog.open(ConfirmModalComponent, {
            data: {
                content: `<p>Are you sure you want to reopen <strong>${this.state.selected.title}</strong. ?</p>`
            }
        }).afterClosed().subscribe((result: boolean) => {
            if (result) {
                this.reopenRequest();
            }
        });
    }
    reopenRequest(): void {
        const requestToReopen: MergeRequest = Object.assign({}, this.state.selected);
        this.mm.updateRequestStatus(requestToReopen, 'open')
            .pipe(
                switchMap(() => {
                    this.toast.createSuccessToast('Request successfully reopened');
                    this.requestStatus = 'open';
                    this.setStatusChipClass();
                    return this.mm.getRequest(requestToReopen.jsonld['@id']);
                }),
                switchMap((jsonld: JSONLDObject) => {
                    requestToReopen.jsonld = jsonld;
                    return this.state.setRequestDetails(requestToReopen);
                }))
            .subscribe(() => {
                this.state.selected = requestToReopen;
            }, error => this.toast.createErrorToast(error));
    }
    closeRequest(): void {
        const requestToAccept: MergeRequest = Object.assign({}, this.state.selected);
        this.mm.updateRequestStatus(requestToAccept, 'close')
            .pipe(
                switchMap(() => {
                    this.toast.createSuccessToast('Request successfully closed');
                    this.requestStatus = 'closed';
                    this.setStatusChipClass();
                    return this.mm.getRequest(requestToAccept.jsonld['@id']);
                }),
                switchMap((jsonld: JSONLDObject) => {
                    requestToAccept.jsonld = jsonld;
                    return this.state.setRequestDetails(requestToAccept);
                }))
            .subscribe(() => {
                this.state.selected = requestToAccept;
            }, error => this.toast.createErrorToast(error));
    }
    acceptRequest(): void {
        const requestToAccept: MergeRequest = Object.assign({}, this.state.selected);
        const sourceBranchId = requestToAccept.sourceBranch['@id'];
        const removeSource = requestToAccept.removeSource;
        const localCatalogId = get(this.cm.localCatalog, '@id', '');
        this.mm.updateRequestStatus(requestToAccept, 'accept')
            .pipe(
                switchMap(() => {
                    this.toast.createSuccessToast('Request successfully accepted');
                    this.requestStatus = 'accepted';
                    this.setStatusChipClass();
                    return this.mm.getRequest(requestToAccept.jsonld['@id']);
                }),
                switchMap((jsonld: JSONLDObject) => {
                    requestToAccept.jsonld = jsonld;
                    return this.state.setRequestDetails(requestToAccept);
                }),
                switchMap(() => {
                    if (removeSource) {
                        return this.cm.deleteRecordBranch(requestToAccept.recordIri, sourceBranchId, localCatalogId);
                    }
                    return of(null);
                }))
            .subscribe(() => {
                this.state.selected = requestToAccept;
            }, error => this.toast.createErrorToast(error));
    }
    showResolutionForm(): void {
        this.resolveConflicts = true;
        this.copiedConflicts = Object.assign([], this.state.selected.conflicts);
        this.copiedConflicts.forEach(conflict => {
            conflict.resolved = false;
        });
        this.resolveError = false;
    }
    resolve(): void {
        const resolutions = this._createResolutions();
        this.state.resolveRequestConflicts(this.state.selected, resolutions)
            .subscribe(() => {
                this.toast.createSuccessToast('Conflicts successfully resolved');
                this.resolveConflicts = false;
                this.copiedConflicts = [];
                this.resolveError = false;
            }, error => {
                this.toast.createErrorToast(error);
                this.resolveError = true;
            });
    }
    cancelResolve(): void {
        this.resolveConflicts = false;
        this.copiedConflicts = [];
        this.resolveError = false;
    }
    allResolved(): boolean {
        return !some(this.copiedConflicts, conflict => !conflict.resolved);
    }
    editRequest(): void {
        const dialogRef = this.dialog.open(EditRequestOverlayComponent);
        dialogRef.afterClosed().subscribe(result => {
            if (result?.closed && this.state.selected) {
                this.currentAssignees = this.state.selected.assignees.slice();
            }
        });
    }

    private _createResolutions(): Difference {
        const resolutions = new Difference();
        forEach(this.copiedConflicts, conflict => {
            if (conflict.resolved === 'left') {
                this._addToResolutions(resolutions, conflict.right);
            } else if (conflict.resolved === 'right') {
                this._addToResolutions(resolutions, conflict.left);
            }
        });
        return resolutions;
    }
    private _addToResolutions(resolutions, notSelected): void {
        if (notSelected.additions.length) {
            resolutions.deletions = concat(resolutions.deletions, notSelected.additions);
        } else {
            resolutions.additions = concat(resolutions.additions, notSelected.deletions);
        }
    }
}
