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
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */
import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { UploadItem } from '../../models/upload-item.interface';

/**
 * @class versioned-rdf-record-editor.UploadErrorsModalComponent
 *
 * A component that creates content for a modal that shows errors of an uploaded file. Meant to be used in conjunction
 * with the `MatDialog` service.
 *
 * @param {UploadItem} item A representation of a VersionedRDFRecord upload containing error details
 */
@Component({
  selector: 'app-upload-errors-modal',
  templateUrl: './upload-errors-modal.component.html'
})
export class UploadErrorsModalComponent implements OnInit {
  itemTitle = '';
  errorMessage = '';
  errorDetails = [];

  constructor(@Inject(MAT_DIALOG_DATA) public data: { item: UploadItem }, private dialogRef: MatDialogRef<UploadErrorsModalComponent>) {}
  
  ngOnInit(): void {
    this.itemTitle = this.data.item.title || 'Something went wrong. Please try again later.';
    this.errorMessage = this.data.item.error?.errorMessage || '';
    this.errorDetails = this.data.item.error?.errorDetails || [];
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
