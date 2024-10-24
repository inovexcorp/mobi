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
import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { get } from 'lodash';

import { MERGEREQ, XSD } from '../../../prefixes';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { MergeRequestManagerService } from '../../../shared/services/mergeRequestManager.service';
import { MergeRequestsStateService } from '../../../shared/services/mergeRequestsState.service';
import { UserManagerService } from '../../../shared/services/userManager.service';
import { ToastService } from '../../../shared/services/toast.service';
import { updateDctermsValue } from '../../../shared/utility';
import { User } from '../../../shared/models/user.class';

/**
 * @name merge-requests.EditRequestOverlayComponent
 *
 * A component that creates content for a modal that edits a merge request on the
 * {@link shared.MergeRequestsStateService selected entity}. Provides fields to edit Merge
 * Request title, description, target branch, assignees, and branch removal. Meant to be used in
 * conjunction with the `MatDialog` service.
 */
@Component({
    selector: 'edit-request-overlay',
    templateUrl: './editRequestOverlay.component.html',
    styleUrls: ['./editRequestOverlay.component.scss']
})
export class EditRequestOverlayComponent implements OnInit {
    recordTitle = '';
    sourceTitle = '';
    branches = [];
    errorMessage = '';
    assignees: User[] = [];
    targetBranch: JSONLDObject;
    editRequestForm: UntypedFormGroup = this.fb.group({
        title: ['', [ Validators.required ]],
        description: [''],
        assignees: [''],
        removeSource: ['']
    });

    constructor(private dialogRef: MatDialogRef<EditRequestOverlayComponent>, private fb: UntypedFormBuilder,
        public state: MergeRequestsStateService, public mm: MergeRequestManagerService,
        public cm: CatalogManagerService, public um: UserManagerService, private toast: ToastService) {}
    
    ngOnInit(): void {
        this.setTitles();
        this._initRequestConfig();
        let nextCalled = false;
        let requestErrorFlag = false;
        this.cm.getRecordBranches(this.state.selected.recordIri, get(this.cm.localCatalog, '@id'))
            .subscribe({
                next: (response: HttpResponse<JSONLDObject[]>) => {
                    this.branches = response.body;
                    nextCalled = true;
                }, 
                error: (error) => {
                    requestErrorFlag = true;
                    this.toast.createErrorToast(error);
                    this.branches = [];
                },
                complete: () => {
                    if (!nextCalled && !requestErrorFlag) {
                        this.branches = [];
                        this.dialogRef.close();
                    }
                }
            });
    }
    private setTitles() {
        this.recordTitle = this.state.selected.recordTitle;
        this.sourceTitle = this.state.selected.sourceTitle;
    }
    submit(): void {
        let isDialogClosed = false;
        let requestErrorFlag = false;
        const jsonld = this._getMergeRequestJson();
       
        this.mm.updateRequest(jsonld['@id'], jsonld)
            .subscribe({
                next: () => {
                    this._handleUpdateRequestSession(jsonld);
                    isDialogClosed = true;
                }, 
                error: (error) => {
                    requestErrorFlag = true;
                    this.errorMessage = error;
                },
                complete: () => {
                    if (!isDialogClosed && !requestErrorFlag) {
                        this.dialogRef.close({closed: true});
                        isDialogClosed = true;
                    }
                }
            });
    }
    private _handleUpdateRequestSession(jsonld: JSONLDObject) {
        const emptyObject: JSONLDObject = {'@id': ''};
        const recordTitle = this.state.selected.recordTitle;
        this.toast.createSuccessToast('Successfully updated request');
        this.state.selected = this.state.getRequestObj(jsonld);
        this.state.selected.recordTitle = recordTitle;
        this.state.setRequestDetails(this.state.selected)
            .subscribe(() => { }, error => this.toast.createErrorToast(error));
        this.state.selected.sourceBranch = Object.prototype.hasOwnProperty.call(this.state.selected, 'sourceBranch')
            ? this.state.selected.sourceBranch : emptyObject;
        this.dialogRef.close({ closed: true });
    }
    private _initRequestConfig(): void {
        this.editRequestForm.patchValue({
            title: this.state.selected.title,
            description: this.state.selected.description === 'No description' ? '' : this.state.selected.description,
            assignees: '',
            removeSource: this.state.selected.removeSource
        });
        this.targetBranch = Object.assign({}, this.state.selected.targetBranch);
        this.assignees = this.state.selected.assignees;
    }
    private _getMergeRequestJson(): JSONLDObject {
        const jsonld = Object.assign({}, this.state.selected.jsonld);

        updateDctermsValue(jsonld, 'title', this.editRequestForm.controls.title.value);
        updateDctermsValue(jsonld, 'description', this.editRequestForm.controls.description.value);
        jsonld[`${MERGEREQ}targetBranch`] = [{'@id': this.targetBranch['@id']}];
        jsonld[`${MERGEREQ}assignee`] = [];
        jsonld[`${MERGEREQ}removeSource`] = [{'@type': `${XSD}boolean`, '@value': this.editRequestForm.controls.removeSource.value.toString()}];

        jsonld[`${MERGEREQ}assignee`] = [];
        this.assignees.forEach(user => {
            jsonld[`${MERGEREQ}assignee`].push({'@id': user.iri});
        });
        return jsonld;
    }
}
