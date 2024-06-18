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
import { pullAt, map, trim, uniq, set, find } from 'lodash';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { finalize, shareReplay } from 'rxjs/operators';
import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { BehaviorSubject, of } from 'rxjs';

import { VersionedRdfListItem } from '../../../shared/models/versionedRdfListItem.class';
import { VersionedRdfState } from '../../../shared/services/versionedRdfState.service';
import { stateServiceToken } from '../../injection-token';
import { getBeautifulIRI } from '../../../shared/utility';
import { ToastService } from '../../../shared/services/toast.service';
import { RESTError } from '../../../shared/models/RESTError.interface';
import { UploadItem } from '../../models/upload-item.interface';

/**
 * @class versioned-rdf-record-editor.UploadRecordModalComponent
 *
 * A component that creates content for a modal that provides a form for entering catalog record metadata about each of
 * the {@link shared.VersionedRdfState#uploadFiles uploaded files}. The form contains a field for the record title, a
 * field for the record description, and a {@link shared.KeywordSelectComponent} for each uploaded file. The title
 * defaults to the file name. The modal contains buttons to Cancel, Submit the current record upload, and Submit all
 * the subsequent record uploads with the default values. Meant to be used in conjunction with the `MatDialog`
 * service.
 *
 * @param {File[]} files Data passed into the modal containing all the files to be uploaded in this batch
 */
@Component({
  selector: 'app-upload-record-modal',
  templateUrl: './upload-record-modal.component.html'
})
export class UploadRecordModalComponent<TData extends VersionedRdfListItem> implements OnInit {
  file: File = undefined;
  uploadOffset = 0;
  total = 0;
  index = 0;

  beautifulTypeName = getBeautifulIRI(this._state.type).replace(' Record', '');

  uploadRecordForm: UntypedFormGroup = this._fb.group({
    title: ['', [ Validators.required]],
    description: [''],
    keywords: [[]],
  });
  clearInput = 0;

  constructor(private _fb: UntypedFormBuilder, private _dialogRef: MatDialogRef<UploadRecordModalComponent<TData>>, 
    @Inject(stateServiceToken) private _state: VersionedRdfState<TData>,
    @Inject(MAT_DIALOG_DATA) private _data: { files: File[] }, private _toast: ToastService) {}

  ngOnInit(): void {
    this.uploadOffset = this._state.uploadList.length;
    this.total = this._data.files.length;
    if (this.total) {
      this._setFormValues();
    }
    if (this.total < 1) {
      this.cancel();
    }
  }
  submit(): void {
    const id = `upload-${(this.uploadOffset + this.index)}`;
    // Create a subject to provide status updates on the upload progress
    const _statusSubject = new BehaviorSubject<string>('processing');
    // Increment the upload counter
    this._state.uploadPending += 1;
    // Create the upload request and signal the upload has started in the Subject
    const rdfUpload = {
     file: this.file,
     title: this.uploadRecordForm.controls.title.value,
     description: this.uploadRecordForm.controls.description.value,
     keywords: uniq(map(this.uploadRecordForm.controls.keywords.value, trim))
    };
    const request = this.total === 1 ? this._state.createAndOpen(rdfUpload) : this._state.create(rdfUpload);
    const item: UploadItem = {
      title: this.uploadRecordForm.controls.title.value,
      id,
      sub: undefined, // Can't put subscription here
      error: undefined,
      // Allows us to subscribe to the status updates
      status: _statusSubject.asObservable().pipe(shareReplay(1))
    }; 

    // Add the representation of the upload to the beginning of the uploadList
    this._state.uploadList.unshift(item);
    
    // By putting this here, we can unsubscribe from the observable
    set(item, 'sub', request.pipe(finalize(() => {
      // When request completes, decrement counter
      this._state.uploadPending -= 1;
    })).subscribe(response => {
      this._toast.createSuccessToast(`Record ${response.recordId} successfully created.`);
      _statusSubject.next('complete');
    }, error => {
      _statusSubject.next('error');
      this.addErrorToUploadItem(id, error);
      // return a new disposable stream and keep the original stream alive.
      return of(false);
    }));

    if ((this.index + 1) < this.total) {
      this.index++;
      this._setFormValues();
    } else {
      this._data.files.splice(0);
      this._dialogRef.close();
    }
  }
  submitAll(): void {
    for (let i = this.index; i < this.total; i++) {
      this.submit();
    }
  }
  cancel(): void {
    this._data.files.splice(0);
    this.total = 0;
    this._dialogRef.close();
  }
  addErrorToUploadItem(id: string, errorObject: RESTError): void {
    set(find(this._state.uploadList, { id }), 'error', errorObject);
  }

  private _setFormValues() {
    this.file = pullAt(this._data.files, 0)[0];
    this.uploadRecordForm.controls.title.setValue(this.file.name.replace(/\.[^/.]+$/, ''));
    this.uploadRecordForm.controls.description.setValue('');
    this.clearInput = this.index;
    this.uploadRecordForm.controls.keywords.setValue([]);
  }
}
