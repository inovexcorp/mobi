/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntypedFormBuilder, Validators } from '@angular/forms';

import { EditIriOverlayData } from '../../models/editIriOverlayData.interface';
import { OnEditEventI } from '../../models/onEditEvent.interface';
import { REGEX } from '../../../constants';

/**
 * @class shared.EditIriOverlayComponent
 *
 * A component that creates content for a modal that edits an IRI. The form in the modal contains fields for the
 * namespace of the IRI, the local name, and the separator between the namespace and the local name. The parts of the
 * IRI are provided separately. A custom validation function and error message can be provided as well. In addition to
 * the Cancel and Submit buttons, there's also a button to revert the fields to their original state. Meant to be used
 * in conjunction with the `MatDialog` service
 *
 * @param {Object} data Information provided to the modal
 * @param {string} data.iriBegin A string containing the beginning/namespace of the IRI
 * @param {string} data.iriThen A string containing the separator of the IRI
 * @param {string} data.iriEnd A string containing the end/local name of the IRI
 * @param {Object} resolve.customValidation An object containing information for a custom validation of the IRI
 * @param {Function} resolve.customValidation.func A function to be called to validate the IRI. Expects the
 * function to a boolean where true means the IRI is invalid.
 * @param {Function} resolve.customValidation.msg The error message for when the custom validation fails
 */
@Component({
    selector: 'edit-iri-overlay',
    templateUrl: './editIriOverlay.component.html'
})
export class EditIriOverlayComponent implements OnInit {

    constructor(private dialogRef: MatDialogRef<EditIriOverlayComponent, OnEditEventI | boolean>, 
                @Inject(MAT_DIALOG_DATA) public data: EditIriOverlayData,
                private fb: UntypedFormBuilder) {}

    namespacePattern = REGEX.IRI;
    localNamePattern = REGEX.LOCALNAME;

    iriFormControl = this.fb.group({
        iriBegin: ['', [Validators.required, Validators.pattern(this.namespacePattern)]],
        iriThen: ['', Validators.required],
        iriEnd: ['', [Validators.required, Validators.pattern(this.localNamePattern)]]
    });

    ngOnInit(): void {
        if (this.data.validator) {
            this.iriFormControl.setValidators(this.data.validator);
        }
        this.iriFormControl.controls.iriBegin.setValue(this.data.iriBegin);
        this.iriFormControl.controls.iriThen.setValue(this.data.iriThen);
        this.iriFormControl.controls.iriEnd.setValue(this.data.iriEnd);
    }
    submit(): void {
        const editCloseEvent: OnEditEventI = {
            value: {
                iriBegin: this.iriFormControl.controls.iriBegin.value,
                iriThen: this.iriFormControl.controls.iriThen.value,
                iriEnd: this.iriFormControl.controls.iriEnd.value
            }
        };
        this.dialogRef.close(editCloseEvent);
    }
    resetVariables(): void {
        this.iriFormControl.controls.iriBegin.setValue(this.data.iriBegin);
        this.iriFormControl.controls.iriThen.setValue(this.data.iriThen);
        this.iriFormControl.controls.iriEnd.setValue(this.data.iriEnd);
    }
}
