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
import { Component } from '@angular/core';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { map } from 'lodash';

import { REGEX } from '../../../constants';
import { UserManagerService } from '../../../shared/services/userManager.service';
import { ToastService } from '../../../shared/services/toast.service';
import { uniqueValue } from '../../../shared/validators/uniqueValue.validator';
import { NewUserConfig } from '../../../shared/models/new-user-config';

/**
 * @class user-management.CreateUserOverlayComponent
 *
 * A component that creates content for a modal with a form to add a user to Mobi. The form contains fields for the
 * basic information about the user including the username, password, first name, last name, email, and role of the new
 * user. Meant to be used in conjunction with the `MatDialog` service.
 */
@Component({
    selector: 'create-user-overlay',
    templateUrl: './createUserOverlay.component.html'
})
export class CreateUserOverlayComponent {
    usernamePattern = REGEX.LOCALNAME;
    errorMessage = '';
    createUserForm = this.fb.group({
        username: ['', [ Validators.required, Validators.pattern(this.usernamePattern), uniqueValue(this.getUsernames()) ]],
        unmaskPassword: ['', [Validators.required]],
        firstName: [''],
        lastName: [''],
        email: ['', [ Validators.email ]],
        admin: ''
    });

    constructor(private dialogRef: MatDialogRef<CreateUserOverlayComponent>, private fb: UntypedFormBuilder,
        private um: UserManagerService, private toast: ToastService) {}

    getUsernames(): string[] {
        return map(this.um.users, 'username');
    }
    getUsernameErrorMessage(): string {
        return this.createUserForm.controls.username.hasError('uniqueValue') ? 'This username has already been taken' :
            this.createUserForm.controls.username.hasError('pattern') ? 'Invalid username' : '';
    }
    add(): void {
        const newUser: NewUserConfig = {
            roles: ['user'],
            username: this.createUserForm.controls.username.value,
            firstName: this.createUserForm.controls.firstName.value,
            lastName: this.createUserForm.controls.lastName.value,
            email: this.createUserForm.controls.email.value,
            password: this.createUserForm.controls.unmaskPassword.value
        };
        if (this.createUserForm.controls.admin.value) {
            newUser.roles.push('admin');
        }
        this.um.addUser(newUser)
            .subscribe(() => {
                this.toast.createSuccessToast('User successfully created');
                this.errorMessage = '';
                this.dialogRef.close();
            }, error => this.errorMessage = error);
    }
}
