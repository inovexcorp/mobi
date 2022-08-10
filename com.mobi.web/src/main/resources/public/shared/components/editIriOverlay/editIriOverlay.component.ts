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

import {Component, Inject, Input, OnInit} from "@angular/core";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import { REGEX } from '../../../constants';
import {FormBuilder, FormControl, Validators} from "@angular/forms";

/**
 * @ngdoc component
 * @name shared.component:editIriOverlay
 * @requires REGEX
 *
 * @description
 * `editIriOverlay` is a component that creates content for a modal that edits an IRI. The form in the modal
 * contains fields for the namespace of the IRI, the local name, and the separator between the namespace and
 * the local name. The parts of the IRI are provided separately. A custom validation function and error message
 * can be provided as well. In addition to the Cancel and Submit buttons, there's also a button to revert the
 * fields to their original state. Meant to be used in conjunction with the
 * {@link shared.service:modalService}.
 *
 * @param {Object} resolve Information provided to the modal
 * @param {string} resolve.iriBegin A string containing the beginning/namespace of the IRI
 * @param {string} resolve.iriThen A string containing the separator of the IRI
 * @param {string} resolve.iriEnd A string containing the end/local name of the IRI
 * @param {Object} resolve.customValidation An object containing information for a custom validation of the IRI
 * @param {Function} resolve.customValidation.func A function to be called to validate the IRI. Expects the
 * function to a boolean where true means the IRI is invalid.
 * @param {Function} resolve.customValidation.msg The error message for when the custom validation fails
 * @param {Function} close A function that closes the modal
 * @param {Function} dismiss A function that dismisses the modal
 */

@Component({
    selector: 'edit-iri-overlay',
    templateUrl: './editIriOverlay.component.html'
})
export class editIriOverlayComponent implements OnInit {

    constructor(private dialogRef: MatDialogRef<editIriOverlayComponent>, @Inject(MAT_DIALOG_DATA) public data,
                private fb: FormBuilder) {
    }


    iriBegin = '';
    iriThen = '';
    iriEnd = '';

    namespacePattern = REGEX.IRI;
    localNamePattern = REGEX.LOCALNAME;
    endsWithPattern = /^[\w\-\._~:/?[\]@!\$&'\(\)\*\+,;=.]+$/;

    iriFormControl = this.fb.group({
        beginsWith: ['', [Validators.required, Validators.pattern(this.namespacePattern)]],
        then: ['', Validators.required],
        endsWith: ['', [Validators.required, Validators.pattern(this.localNamePattern)]]
    });

    ngOnInit() {
        this.iriFormControl.controls.beginsWith.setValue(this.data.iriBegin);
        this.iriFormControl.controls.then.setValue(this.data.iriThen);
        this.iriFormControl.controls.endsWith.setValue(this.data.iriEnd);
    }
    submit() {
        this.dialogRef.close({value: {
            iriBegin: this.iriFormControl.controls.beginsWith.value,
            iriThen: this.iriFormControl.controls.then.value,
            iriEnd: this.iriFormControl.controls.endsWith.value}
        });
    }
    resetVariables() {
        this.iriFormControl.controls.beginsWith.setValue(this.data.iriBegin);
        this.iriFormControl.controls.then.setValue(this.data.iriThen);
        this.iriFormControl.controls.endsWith.setValue(this.data.iriEnd);
    }
    cancel() {
        this.dialogRef.close(false);
    }
}

export default editIriOverlayComponent;
