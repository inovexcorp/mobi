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
import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { get } from 'lodash';

import { DCTERMS } from '../../../prefixes';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { getDctermsValue, updateDctermsValue } from '../../../shared/utility';

/**
 * @class ontology-editor.EditBranchOverlayComponent
 *
 * A component that creates content for a modal that edits the provided branch in the current
 * {@link shared.OntologyStateService#listItem}. The form in the modal contains a field for the branch title and a field
 * for the branch description. Meant to be used in conjunction with the `MatDialog` service.
 *
 * @param {JSONLDObject} branch The JSON-LD of the branch to be edited
 */
@Component({
    selector: 'edit-branch-overlay',
    templateUrl: './editBranchOverlay.component.html'
})
export class EditBranchOverlayComponent implements OnInit {
    error = '';

    editBranchForm: UntypedFormGroup = this.fb.group({
        title: ['', [Validators.required, Validators.maxLength(150)]],
        description: ['']
    });

    constructor(private fb: UntypedFormBuilder, private dialogRef: MatDialogRef<EditBranchOverlayComponent>, 
        @Inject(MAT_DIALOG_DATA) public data: {branch: JSONLDObject},
        private cm: CatalogManagerService, private os: OntologyStateService) {}
        
    ngOnInit(): void {
        this.editBranchForm.controls.title.setValue(getDctermsValue(this.data.branch, 'title'));
        this.editBranchForm.controls.description.setValue(getDctermsValue(this.data.branch, 'description'));
    }
    edit(): void {
        const catalogId = get(this.cm.localCatalog, '@id', '');
        updateDctermsValue(this.data.branch, 'title', this.editBranchForm.controls.title.value);
        if (!this.editBranchForm.controls.description.value) {
            delete this.data.branch[`${DCTERMS}description`];
        } else {
            updateDctermsValue(this.data.branch, 'description', this.editBranchForm.controls.description.value);
        }
        this.cm.updateRecordBranch(this.data.branch['@id'], this.os.listItem.versionedRdfRecord.recordId, catalogId, this.data.branch)
            .subscribe(() => {
                this.dialogRef.close(true);
            }, errorMessage => {
                this.error = errorMessage;
            });
    }
}
