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
import { HttpResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material';
import { get } from 'lodash';

import { MERGEREQ, XSD } from '../../../prefixes';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { MergeRequestManagerService } from '../../../shared/services/mergeRequestManager.service';
import { MergeRequestsStateService } from '../../../shared/services/mergeRequestsState.service';
import { UserManagerService } from '../../../shared/services/userManager.service';
import { UtilService } from '../../../shared/services/util.service';

import './editRequestOverlay.component.scss';

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
    templateUrl: './editRequestOverlay.component.html'
})
export class EditRequestOverlayComponent implements OnInit {
    branches = [];
    errorMessage = '';
    assignees: string[] = [];
    targetBranch: JSONLDObject;
    editRequestForm: FormGroup;

    constructor(private dialogRef: MatDialogRef<EditRequestOverlayComponent>, private fb: FormBuilder,
        public state: MergeRequestsStateService, public mm: MergeRequestManagerService,
        public cm: CatalogManagerService, public um: UserManagerService, public util: UtilService) {}
    
    ngOnInit(): void {
        this._initRequestConfig();
        this.cm.getRecordBranches(this.state.selected.recordIri, get(this.cm.localCatalog, '@id'))
            .subscribe((response: HttpResponse<JSONLDObject[]>) => {
                this.branches = response.body;
            }, error => {
                this.util.createErrorToast(error);
                this.branches = [];
            });
    } 
    submit(): void {
        const jsonld = this._getMergeRequestJson();
        const emptyObject: JSONLDObject = {'@id': ''};
        this.mm.updateRequest(jsonld['@id'], jsonld)
            .subscribe(() => {
                const recordTitle = this.state.selected.recordTitle;
                this.util.createSuccessToast('Successfully updated request');
                this.state.selected = this.state.getRequestObj(jsonld);
                this.state.selected.recordTitle = recordTitle;
                this.state.setRequestDetails(this.state.selected).subscribe(() => {}, this.util.createErrorToast);
                this.state.selected.sourceBranch = Object.prototype.hasOwnProperty.call(this.state.selected,'sourceBranch')
                    ? this.state.selected.sourceBranch : emptyObject;

                this.dialogRef.close();
            }, error => this.errorMessage = error);
    }

    private _initRequestConfig() {
        this.editRequestForm = this.fb.group({
            title: [this.state.selected.title, [ Validators.required ]],
            description: [this.state.selected.description === 'No description' ? '' : this.state.selected.description],
            assignees: [''],
            removeSource: [this.state.selected.removeSource]
        });
        this.targetBranch = Object.assign({}, this.state.selected.targetBranch);

        this.assignees = this.state.selected.assignees;
    }
    private _getMergeRequestJson() {
        const jsonld = Object.assign({}, this.state.selected.jsonld);

        this.util.updateDctermsValue(jsonld, 'title', this.editRequestForm.controls.title.value);
        this.util.updateDctermsValue(jsonld, 'description', this.editRequestForm.controls.description.value);
        jsonld[MERGEREQ + 'targetBranch'] = [{'@id': this.targetBranch['@id']}];
        jsonld[MERGEREQ + 'assignee'] = [];
        jsonld[MERGEREQ + 'removeSource'] = [{'@type': XSD + 'boolean', '@value': this.editRequestForm.controls.removeSource.value.toString()}];

        jsonld[MERGEREQ + 'assignee'] = [];
        this.assignees.forEach(username => {
            const user = this.um.users.find(user => user.username === username);
            if (user) {
                jsonld[MERGEREQ + 'assignee'].push({'@id': user.iri});
            }
        });
        return jsonld;
    }
}
