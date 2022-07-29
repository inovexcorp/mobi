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
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material';
import { forEach, concat, some, isEmpty, get } from 'lodash';
import { from, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { ConfirmModalComponent } from '../../../shared/components/confirmModal/confirmModal.component';
import { Conflict } from '../../../shared/models/conflict.interface';
import { Difference } from '../../../shared/models/difference.class';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { MergeRequestManagerService } from '../../../shared/services/mergeRequestManager.service';
import { MergeRequestsStateService } from '../../../shared/services/mergeRequestsState.service';
import { EditRequestOverlayComponent } from '../editRequestOverlay/editRequestOverlay.component';

import './mergeRequestView.component.scss';

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
    templateUrl: './mergeRequestView.component.html'
})
export class MergeRequestViewComponent implements OnInit, OnDestroy {
    resolveConflicts = false;
    copiedConflicts: Conflict[] = [];
    resolveError = false;
    isAccepted = false;

    constructor(public mm: MergeRequestManagerService, public state: MergeRequestsStateService, private dialog: MatDialog,
        @Inject('utilService') public util, @Inject('ontologyStateService') public os,
        @Inject('ontologyManagerService') public om) {}

    ngOnInit(): void {
        this.mm.getRequest(this.state.selected.jsonld['@id'])
            .subscribe(jsonld => {
                this.state.selected.jsonld = jsonld;
                this.isAccepted = this.mm.isAccepted(this.state.selected.jsonld);
                this.state.setRequestDetails(this.state.selected).subscribe(() => {}, this.util.createErrorToast);
            }, () => {
                this.util.createWarningToast('The request you had selected no longer exists');
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
                content: '<p>Are you sure you want to delete <strong>' + this.state.selected.title + '</strong.?</p>'
            }
        }).afterClosed().subscribe((result: boolean) => {
            if (result) {
                this.state.deleteRequest(this.state.selected);
            }
        });
    }
    showAccept(): void {
        this.dialog.open(ConfirmModalComponent, {
            data: {
                content: '<p>Are you sure you want to accept <strong>' + this.state.selected.title + '</strong.?</p>'
            }
        }).afterClosed().subscribe((result: boolean) => {
            if (result) {
                this.acceptRequest();
            }
        });
    }
    acceptRequest(): void {
        const requestToAccept = Object.assign({}, this.state.selected);
        const targetBranchId = requestToAccept.targetBranch['@id'];
        const sourceBranchId = requestToAccept.sourceBranch['@id'];
        const removeSource = requestToAccept.removeSource;
        
        this.mm.acceptRequest(requestToAccept.jsonld['@id'])
            .pipe(
                switchMap(() => {
                    this.util.createSuccessToast('Request successfully accepted');
                    this.isAccepted = true;
                    return this.mm.getRequest(requestToAccept.jsonld['@id']);
                }),
                switchMap((jsonld: JSONLDObject) => {
                    requestToAccept.jsonld = jsonld;
                    return this.state.setRequestDetails(requestToAccept);
                }),
                switchMap(() => {
                    if (removeSource) {
                        return from(this.om.deleteOntologyBranch(requestToAccept.recordIri, sourceBranchId)
                            .then(() => {
                                if (some(this.os.list, {ontologyRecord: {recordId: requestToAccept.recordIri}})) {
                                    this.os.removeBranch(requestToAccept.recordIri, sourceBranchId);
                                }
                            }, error => Promise.reject(error)));
                    }
                    return of(null);
                }))
            .subscribe(() => {
                this.state.selected = requestToAccept;
                if (!isEmpty(this.os.listItem)) {
                    if (get(this.os.listItem, 'ontologyRecord.branchId') === targetBranchId) {
                        this.os.listItem.upToDate = false;
                        if (this.os.listItem.merge.active) {
                            this.util.createWarningToast('You have a merge in progress in the Ontology Editor that is out of date. Please reopen the merge form.', {timeOut: 5000});
                        }
                    }
                    if (this.os.listItem.merge.active && get(this.os.listItem.merge.target, '@id') === targetBranchId) {
                        this.util.createWarningToast('You have a merge in progress in the Ontology Editor that is out of date. Please reopen the merge form to avoid conflicts.', {timeOut: 5000});
                    }
                }
            }, error => this.util.createErrorToast(error));
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
                this.util.createSuccessToast('Conflicts successfully resolved');
                this.resolveConflicts = false;
                this.copiedConflicts = [];
                this.resolveError = false;
            }, error => {
                this.util.createErrorToast(error);
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
}
