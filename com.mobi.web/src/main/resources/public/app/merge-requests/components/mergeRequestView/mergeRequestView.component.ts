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
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { forEach, concat, some, get, find, isEmpty } from 'lodash';
import { of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

import { ConfirmModalComponent } from '../../../shared/components/confirmModal/confirmModal.component';
import { Conflict } from '../../../shared/models/conflict.interface';
import { Difference } from '../../../shared/models/difference.class';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { MergeRequestManagerService } from '../../../shared/services/mergeRequestManager.service';
import { MergeRequestsStateService } from '../../../shared/services/mergeRequestsState.service';
import { EditRequestOverlayComponent } from '../editRequestOverlay/editRequestOverlay.component';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { ToastService } from '../../../shared/services/toast.service';
import { CATALOG, MERGEREQ } from '../../../prefixes';
import { PolicyEnforcementService } from '../../../shared/services/policyEnforcement.service';
import { LoginManagerService } from '../../../shared/services/loginManager.service';
import { UserManagerService } from '../../../shared/services/userManager.service';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { getPropertyId } from '../../../shared/utility';

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
    resolveConflicts = false;
    copiedConflicts: Conflict[] = [];
    resolveError = false;
    isAccepted = false;
    buttonTitle = '';
    isSubmitDisabled = false;
    userAccessMsg = 'You do not have permission to perform this merge';
    private isAdminUser: boolean;

    constructor(public mm: MergeRequestManagerService,
                public state: MergeRequestsStateService,
                private dialog: MatDialog,
                private toast: ToastService,
                public os: OntologyStateService,
                public um: UserManagerService,
                private lm: LoginManagerService,
                protected cm: CatalogManagerService,
                private pep: PolicyEnforcementService) {}

    ngOnInit(): void {
        this.isAdminUser = this.um.isAdminUser(this.lm.currentUserIRI);

        if (!this.isAdminUser) {
            const targetBranchId = getPropertyId(this.state.selected.jsonld, `${MERGEREQ}targetBranch`);
            const managePermissionRequest = {
                resourceId: this.state.selected.recordIri,
                actionId: `${CATALOG}Modify`,
                actionAttrs: {
                    [`${CATALOG}branch`]: targetBranchId
                }
            };
            this.pep.evaluateRequest(managePermissionRequest).subscribe(decision => {
                this.isSubmitDisabled = decision === this.pep.deny;
                if (!this.isSubmitDisabled) {
                    this.isSubmitDisabled = !this._isUserAssigned();
                }

                this.buttonTitle = this.isSubmitDisabled ?  this.userAccessMsg : '';
            }, () => {
                this.isSubmitDisabled = false;
            });
        }

        this.mm.getRequest(this.state.selected.jsonld['@id']).pipe(
            map(data => {
                return data;
            }))
            .subscribe(jsonld => {
                this.state.selected.jsonld = jsonld;
                this.isAccepted = this.mm.isAccepted(this.state.selected.jsonld);
                this.state.setRequestDetails(this.state.selected)
                  .subscribe(() => {}, error => this.toast.createErrorToast(error));
            }, () => {
                this.toast.createWarningToast('The request you had selected no longer exists');
                this.back();
            });
    }
    ngOnDestroy(): void {
        this.state.clearDifference();
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
                content: `<p>Are you sure you want to accept <strong>${this.state.selected.title}</strong.?</p>`
            }
        }).afterClosed().subscribe((result: boolean) => {
            if (result) {
                this.acceptRequest();
            }
        });
    }
    acceptRequest(): void {
        const requestToAccept = Object.assign({}, this.state.selected);
        const sourceBranchId = requestToAccept.sourceBranch['@id'];
        const targetBranchId = requestToAccept.targetBranch['@id'];
        const removeSource = requestToAccept.removeSource;
        const localCatalogId = get(this.cm.localCatalog, '@id', '');
        this.mm.acceptRequest(requestToAccept)
            .pipe(
                switchMap(() => {
                    this.toast.createSuccessToast('Request successfully accepted');
                    this.isAccepted = true;
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
                if (!isEmpty(this.os.listItem)) {
                    if (get(this.os.listItem, 'versionedRdfRecord.branchId') === targetBranchId) {
                        this.os.listItem.upToDate = false;
                        if (this.os.listItem.merge.active) {
                            this.toast.createWarningToast('You have a merge in progress in the Ontology Editor that is out of date. Please reopen the merge form.', {timeOut: 5000});
                        }
                    }
                    if (this.os.listItem.merge.active && get(this.os.listItem.merge.target, '@id') === targetBranchId) {
                        this.toast.createWarningToast('You have a merge in progress in the Ontology Editor that is out of date. Please reopen the merge form to avoid conflicts.', {timeOut: 5000});
                    }
                }
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
        this.dialog.open(EditRequestOverlayComponent);
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
    private _addToResolutions(resolutions, notSelected) {
        if (notSelected.additions.length) {
            resolutions.deletions = concat(resolutions.deletions, notSelected.additions);
        } else {
            resolutions.additions = concat(resolutions.additions, notSelected.deletions);
        }
    }

    private _isUserAssigned() {
        const userInfo = find(this.um.users, { iri: this.lm.currentUserIRI });
        return this.state.selected.assignees.find((item) => item === userInfo.username) ? true : false;
    }
}
