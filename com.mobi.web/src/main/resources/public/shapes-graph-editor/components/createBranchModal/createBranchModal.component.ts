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
import { get } from 'lodash';
import { Inject, Component } from '@angular/core';
import { MatDialogRef } from '@angular/material';
import { FormBuilder, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';

import { ShapesGraphStateService } from '../../../shared/services/shapesGraphState.service';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';

interface BranchConfig {
    title: string,
    description?: string
}

/**
 * @class shapes-graph-editor.CreateBranchModal
 * 
 * A component that creates content for a modal to create a branch for the ShapesGraphRecord. The form in the modal
 * contains an input and textarea for the title and description of the branch.
 */
@Component({
    selector: 'create-branch-modal',
    templateUrl: './createBranchModal.component.html'
})
export class CreateBranchModal {
    catalogId: string = get(this.cm.localCatalog, '@id', '');

    createBranchForm = this.fb.group({
        title: ['', Validators.required],
        description: ['']
    });

    constructor(private state: ShapesGraphStateService, @Inject('utilService') private util,
                private cm: CatalogManagerService, private fb: FormBuilder,
                private dialogRef: MatDialogRef<CreateBranchModal>) {}

    createBranch(): Promise<any> {
        const branchConfig: BranchConfig = {
            title: this.createBranchForm.controls.title.value,
            description: this.createBranchForm.controls.description.value
        };

        return this.cm.createRecordBranch(this.state.listItem.versionedRdfRecord.recordId, this.catalogId, branchConfig,
            this.state.listItem.versionedRdfRecord.commitId).pipe(first()).toPromise()
            .then(branchId => {
                return this.state.changeShapesGraphVersion(this.state.listItem.versionedRdfRecord.recordId, branchId, this.state.listItem.versionedRdfRecord.commitId, undefined, this.createBranchForm.controls.title.value);
            }, error => Promise.reject(error))
            .then(() => this.dialogRef.close(true), error => {
                this.dialogRef.close(false);
                this.util.createErrorToast(error);
            });
    }
}
