/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
 * %%
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */
import { Component, Inject } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { get } from 'lodash';

import { RdfUpdate } from '../../../shared/models/rdfUpdate.interface';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { ToastService } from '../../../shared/services/toast.service';
import { RESTError } from '../../../shared/models/RESTError.interface';
import { VersionedRdfListItem } from '../../../shared/models/versionedRdfListItem.class';
import { stateServiceToken } from '../../injection-token';
import { VersionedRdfState } from '../../../shared/services/versionedRdfState.service';

/**
 * @class versioned-rdf-record-editor.UploadChangesModalComponent
 * 
 * A component that creates content for a modal to update a VersionedRDFRecord with an uploaded file.
 */
@Component({
  selector: 'app-upload-changes-modal',
  templateUrl: './upload-changes-modal.component.html'
})
export class UploadChangesModalComponent<TData extends VersionedRdfListItem> {
  error: RESTError = {
    error: '',
    errorDetails: [],
    errorMessage: ''
  };
  selectedFile: File;
  catalogId: string = get(this._cm.localCatalog, '@id', '');

  constructor(private _dialogRef: MatDialogRef<UploadChangesModalComponent<TData>>, private _toast: ToastService, 
   @Inject(stateServiceToken) private _state: VersionedRdfState<TData>, private _cm: CatalogManagerService) {}

  uploadChanges(): void {
    const updateParams: RdfUpdate = {
      recordId: this._state.listItem.versionedRdfRecord.recordId,
      file: this.selectedFile,
      replaceInProgressCommit: false
    };
    if (this._state?.listItem?.versionedRdfRecord?.branchId) {
      updateParams.branchId = this._state.listItem.versionedRdfRecord.branchId;
    }
    if (this._state?.listItem?.versionedRdfRecord?.commitId) {
      updateParams.commitId = this._state.listItem.versionedRdfRecord.commitId;
    }
    this._state.uploadChanges(updateParams).subscribe(() => {
      this._toast.createSuccessToast(`Record ${this._state.listItem.versionedRdfRecord.recordId} successfully updated.`);
      this._dialogRef.close(true);
    }, error => {
      if (typeof error === 'string') {
        this.error = {
          error: '',
          errorDetails: [],
          errorMessage: error
        };
      } else {
        this.error = error;
      }
    });
  }
}
