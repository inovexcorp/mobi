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
import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material';
import { get, find } from 'lodash';
import { switchMap } from 'rxjs/operators';

import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';

/**
 * @class ontology-editor.CommitOverlayComponent
 *
 * A component that creates content for a modal to commit the changes to the
 * {@link shared.OntologyStateService#listItem selected ontology}. The form in the modal contains a field for the commit
 * message. Meant to be used in conjunction with the `MatDialog` service.
 */
@Component({
    selector: 'commit-overlay',
    templateUrl: './commitOverlay.component.html'
})
export class CommitOverlayComponent implements OnInit {
    catalogId = '';
    error = '';

    commitForm: FormGroup = this.fb.group({
        comment: ['', [Validators.required]]
    });

    constructor(private fb: FormBuilder, private dialogRef: MatDialogRef<CommitOverlayComponent>,
        public os: OntologyStateService, private cm: CatalogManagerService, @Inject('utilService') private util) {}
    
    ngOnInit(): void {
        this.catalogId = get(this.cm.localCatalog, '@id', '');
    }
    commit(): void {
        if (this.os.listItem.upToDate) {
            this._createCommit(this.os.listItem.versionedRdfRecord.branchId);
        } else {
            const branch = find(this.os.listItem.branches, {'@id': this.os.listItem.versionedRdfRecord.branchId});
            const branchConfig: any = {title: this.util.getDctermsValue(branch, 'title')};
            const description = this.util.getDctermsValue(branch, 'description');
            if (description) {
                branchConfig.description = description;
            }
            let branchId;
            this.cm.createRecordUserBranch(this.os.listItem.versionedRdfRecord.recordId, this.catalogId, branchConfig, this.os.listItem.versionedRdfRecord.commitId, this.os.listItem.versionedRdfRecord.branchId)
                .pipe(switchMap((branchIri: string) => {
                    branchId = branchIri;
                    return this.cm.getRecordBranch(branchId, this.os.listItem.versionedRdfRecord.recordId, this.catalogId);
                }))
                .subscribe(branch => {
                    this.os.listItem.branches.push(branch);
                    this.os.listItem.versionedRdfRecord.branchId = branch['@id'];
                    this.os.listItem.upToDate = true;
                    this.os.listItem.userBranch = true;
                    this._createCommit(branch['@id']);
                }, error => this._onError(error));
        }
    }

    private _onError(errorMessage) {
        this.error = errorMessage;
    }
    private _createCommit(branchId) {
        let commitId;
        this.cm.createBranchCommit(branchId, this.os.listItem.versionedRdfRecord.recordId, this.catalogId, this.commitForm.controls.comment.value)
            .pipe(switchMap((commitIri: string) => {
                commitId = commitIri;
                return this.os.updateState({recordId: this.os.listItem.versionedRdfRecord.recordId, commitId, branchId});
            }))
            .subscribe(() => {
                this.os.listItem.versionedRdfRecord.branchId = branchId;
                this.os.listItem.versionedRdfRecord.commitId = commitId;
                this.os.clearInProgressCommit();
                this.dialogRef.close(true);
            }, error => this._onError(error));
    }
}