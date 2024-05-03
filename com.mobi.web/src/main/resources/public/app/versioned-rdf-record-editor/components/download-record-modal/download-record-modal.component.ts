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
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */
import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

import { RdfDownload } from '../../../shared/models/rdfDownload.interface';
import { stateServiceToken } from '../../injection-token';
import { VersionedRdfState } from '../../../shared/services/versionedRdfState.service';
import { VersionedRdfListItem } from '../../../shared/models/versionedRdfListItem.class';

/**
 * @class versioned-rdf-record-editor.DownloadRecordModalComponent
 * 
 * A component that creates content for a modal with fields specifying the download parameters for the Record
 */
@Component({
  selector: 'download-record-modal',
  templateUrl: './download-record-modal.component.html'
})
export class DownloadRecordModalComponent<TData extends VersionedRdfListItem> implements OnInit {
  downloadRecordForm = this._fb.group({
    serialization: ['turtle', Validators.required],
    fileName: ['download', Validators.required]
  });

  constructor(private _dialogRef: MatDialogRef<DownloadRecordModalComponent<TData>>, 
    @Inject(MAT_DIALOG_DATA) public data: {recordId: string, branchId: string, commitId: string, title: string},
        private _fb: UntypedFormBuilder, @Inject(stateServiceToken) private _state: VersionedRdfState<TData>) {}

  ngOnInit(): void {
    this.downloadRecordForm.controls.fileName.setValue(this.data.title.replace(/[ &/\\#,+()$~%.'":*?<>{}]/g, ''));
  }
  download(): void {
    const downloadParams: RdfDownload = {
      recordId: this.data.recordId,
      branchId: this.data.branchId,
      commitId: this.data.commitId,
      rdfFormat: this.downloadRecordForm.controls.serialization.value,
      fileName: this.downloadRecordForm.controls.fileName.value,
      applyInProgressCommit: true
    };
    this._state.download(downloadParams);
    this._dialogRef.close(true);
  }
}
