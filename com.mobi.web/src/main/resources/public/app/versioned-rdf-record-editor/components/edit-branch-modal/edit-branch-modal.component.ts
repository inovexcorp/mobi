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
import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { get } from 'lodash';

import { DCTERMS } from '../../../prefixes';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { getDctermsValue, updateDctermsValue } from '../../../shared/utility';

/**
 * @class ontology-editor.EditBranchModalComponent
 *
 * A component that creates content for a modal that edits the provided branch in the VersionedRDFRecord identified by
 * the provided IRI. The form in the modal contains a field for the branch title and a field for the branch description.
 * Meant to be used in conjunction with the `MatDialog` service.
 *
 * @param {JSONLDObject} branch The JSON-LD of the branch to be edited
 * @param {string} recordId The IRI of the VersionedRDFRecord to which the branch belongs
 */
@Component({
  selector: 'app-edit-branch-modal',
  templateUrl: './edit-branch-modal.component.html'
})
export class EditBranchModalComponent implements OnInit {
  errorMessage = '';

  editBranchForm: UntypedFormGroup = this._fb.group({
    title: ['', [Validators.required, Validators.maxLength(150)]],
    description: ['']
  });

  constructor(private _fb: UntypedFormBuilder, private _dialogRef: MatDialogRef<EditBranchModalComponent>, 
    @Inject(MAT_DIALOG_DATA) public data: { recordId: string, branch: JSONLDObject },
    private _cm: CatalogManagerService) {}
      
  ngOnInit(): void {
    this.editBranchForm.controls.title.setValue(getDctermsValue(this.data.branch, 'title'));
    this.editBranchForm.controls.description.setValue(getDctermsValue(this.data.branch, 'description'));
  }
  edit(): void {
    const catalogId = get(this._cm.localCatalog, '@id', '');
    updateDctermsValue(this.data.branch, 'title', this.editBranchForm.controls.title.value);
    if (!this.editBranchForm.controls.description.value) {
        delete this.data.branch[`${DCTERMS}description`];
    } else {
        updateDctermsValue(this.data.branch, 'description', this.editBranchForm.controls.description.value);
    }
    this._cm.updateRecordBranch(this.data.branch['@id'], this.data.recordId, catalogId, this.data.branch)
      .subscribe(() => {
        this._dialogRef.close(true);
      }, errorMessage => {
        this.errorMessage = errorMessage;
      });
  }
}
