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
import { pullAt, map, trim, uniq, set, find } from 'lodash';
import { MatDialogRef } from '@angular/material';
import { finalize, shareReplay, startWith } from 'rxjs/operators';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject, of, Subject } from 'rxjs';

import { OntologyManagerService } from '../../../shared/services/ontologyManager.service';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';

/**
 * @class ontology-editor.UploadOntologyOverlayComponent
 *
 * A component that creates content for a modal that provides a form for entering catalog record metadata about each of
 * the {@link shared.OntologyStateService#uploadFiles uploaded files}. The form contains a field for the record title, a
 * field for the record description, and a {@link shared.KeywordSelectComponent} for each uploaded file. The title
 * defaults to the file name. The modal contains buttons to Cancel, Submit the current ontology upload, and Submit all
 * the subsequent ontology uploads with the default values. Meant to be used in conjunction with the `MatDialog`
 * service.
 *
 * @param {Function} close A function that closes the modal
 * @param {Function} dismiss A function that dismisses the modal
 */
@Component({
    selector: 'upload-ontology-overlay',
    templateUrl: './uploadOntologyOverlay.component.html'
})
export class UploadOntologyOverlayComponent implements OnInit {
    file: File = undefined;
    uploadOffset = 0;
    total = 0;
    index = 0;

    uploadOntologyForm: FormGroup = this.fb.group({
        title: ['', [ Validators.required]],
        description: [''],
        keywords: [[]],
    });

    @Output() uploadStarted = new EventEmitter<boolean>();

    constructor(private fb: FormBuilder, private dialogRef: MatDialogRef<UploadOntologyOverlayComponent>, 
        private om: OntologyManagerService, private os: OntologyStateService) {}

    ngOnInit(): void {
        this.uploadOffset = this.os.uploadList.length;
        this.total = this.os.uploadFiles.length;
        if (this.total) {
            this._setFormValues();
        }
        if (this.total < 1) {
            this.cancel();
        }
    }
    submit(): void {
        const id = 'upload-' + (this.uploadOffset + this.index);
        // Notify the parent the upload has started
        this.uploadStarted.emit(true);
        // Create a subject to provide status updates on the upload progress
        const _statusSubject = new BehaviorSubject<string>('processing');
        // Increment the upload counter
        this.os.uploadPending += 1;
        // Create the upload request and signal the upload has started in the Subject
        const request = this.om.uploadOntology({
            file: this.file,
            title: this.uploadOntologyForm.controls.title.value,
            description: this.uploadOntologyForm.controls.description.value,
            keywords: uniq(map(this.uploadOntologyForm.controls.keywords.value, trim))
        });
        const item = {
            title: this.uploadOntologyForm.controls.title.value,
            id,
            sub: undefined, // Can't put subscription here
            error: undefined,
            // Allows us to subscribe to the status updates
            status: _statusSubject.asObservable().pipe(shareReplay(1))
        }; 

        // Add the representation of the upload to the uploadList
        this.os.uploadList.push(item);
        
        // By putting this here, we can unsubscribe from the observable, effectively canceling the request
        set(item, 'sub', request.pipe(finalize(() => {
            // When request completes, decrement counter and notify parent upload completed
            this.os.uploadPending -= 1;
            this.uploadStarted.emit(false);
        })).subscribe(() => {
            _statusSubject.next('complete');
        }, error => {
            _statusSubject.next('error');
            this.os.addErrorToUploadItem(id, error);
            // return a new disposable stream and keep the original stream alive.
            return of(false);
        }));

        if ((this.index + 1) < this.total) {
            this.index++;
            this._setFormValues();
        } else {
            this.os.uploadFiles.splice(0);
            this.dialogRef.close();
        }
    }
    submitAll(): void {
        for (let i = this.index; i < this.total; i++) {
            this.submit();
        }
    }
    cancel(): void {
        this.os.uploadFiles.splice(0);
        this.total = 0;
        this.dialogRef.close();
    }

    private _setFormValues() {
        this.file = pullAt(this.os.uploadFiles, 0)[0];
        this.uploadOntologyForm.controls.title.setValue(this.file.name.replace(/\.[^/.]+$/, ''));
        this.uploadOntologyForm.controls.description.setValue('');
        this.uploadOntologyForm.controls.keywords.setValue([]);
    }
}