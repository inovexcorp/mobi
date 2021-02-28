/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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
import { find, cloneDeep } from 'lodash';
import { OnInit, Component, Inject } from '@angular/core';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';

/**
 * @name settings.PasswordTabComponent
 *
 * `passwordTab` is a component that creates a Bootstrap `row` with a form allowing the current user to change their
 * password. The user must enter their current password in order to make a change. The new password is confirmed within
 * a separate input.
 */
@Component({
    selector: 'password-tab',
    templateUrl: './passwordTab.component.html'
})
export class PasswordTabComponent implements OnInit {
    currentUser: any = {};
    errorMessage: string;
    passwordForm = this.fb.group({
        currentPassword: ['', [Validators.required]],
        newPassword: ['', [Validators.required]]
    });
   
    constructor(@Inject('userManagerService') private um, @Inject('loginManagerService') private lm,
        @Inject('utilService') private util, private fb: FormBuilder) {}

    ngOnInit(): void {
        this.currentUser = cloneDeep(find(this.um.users, { username: this.lm.currentUser }));
        if (this.currentUser.external) {
            this.disableAllFields(this.passwordForm);
        }
    }

    save(): void {
        this.um.changePassword(this.lm.currentUser, this.passwordForm.controls.currentPassword.value, this.passwordForm.controls.newPassword.value)
            .then(() => {
                this.errorMessage = '';
                this.util.createSuccessToast('Password successfully saved');
                this.passwordForm.reset();
            }, error => this.errorMessage = error);
    }

    disableAllFields(formGroup: FormGroup): void {
        Object.keys(formGroup.controls).forEach(controlName => {
            let temp = formGroup.get(controlName)
            if (temp instanceof FormGroup) {
                this.disableAllFields(temp);
            } else {
                temp.disable();
            }
        });
    }
}