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
import { Component, Input } from '@angular/core';
import { AbstractControl, UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';

/**
 * @class shared.UnmaskPasswordComponent
 *
 * @description
 * `unmask-password` is a component which creates password input with a button to unmask the value for a user to
 * validate their entry before submitting the parent form. The input is bound to a form control with name
 * "unmaskPassword".
 *
 * @param {FormGroup} parentForm The FormGroup of the parent form to associate the inner input with
 * @param {string} label The label for the first password input
 */
@Component({
    selector: 'unmask-password',
    templateUrl: './unmaskPassword.component.html'
})
export class UnmaskPasswordComponent {
    @Input() parentForm: UntypedFormGroup;
    @Input() label: string;

    showPassword = false;

    constructor(private fb: UntypedFormBuilder) {}

    isRequired(): boolean {
        const ctrl = this.parentForm.controls.unmaskPassword;
        const validators = ctrl.validator && ctrl.validator({} as AbstractControl);
        return !!(validators && validators.required);
    }
}
