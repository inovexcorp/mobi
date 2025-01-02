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
import { Component } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';

import { UserStateService } from '../../../shared/services/userState.service';
import { UserManagerService } from '../../../shared/services/userManager.service';
import { ToastService } from '../../../shared/services/toast.service';
import { User } from '../../../shared/models/user.class';

/**
 * @class user-management.EditUserProfileOverlayComponent
 *
 * A component that creates content for a modal with a form to change the
 * {@link shared.UserStateService#selectedUser selected user's} profile information in Mobi. The form contains fields to
 * edit the user's first name, last name, and email. Meant to be used in conjunction with the `MatDialog` service.
 */
@Component({
    selector: 'edit-profile-overlay',
    templateUrl: './editUserProfileOverlay.component.html'
})
export class EditUserProfileOverlayComponent {
    errorMessage = '';
    editProfileForm: UntypedFormGroup;

    constructor(private dialogRef: MatDialogRef<EditUserProfileOverlayComponent>, private fb: UntypedFormBuilder,
        private state: UserStateService, private um: UserManagerService, private toast: ToastService) {
            this.editProfileForm = this.fb.group({
                firstName: [this.state.selectedUser.firstName],
                lastName: [this.state.selectedUser.lastName],
                email: [this.state.selectedUser.email.replace('mailto:', ''), [ Validators.email ]]
            });
        }

    set(): void {
        let isDialogClosed = false;
        let requestErrorFlag = false;
        const newUser = this.createUser();
        this.um.updateUser(this.state.selectedUser.username, newUser).subscribe({
            next: () => {
                this._onNext(newUser);
                isDialogClosed = true;
            }, 
            error: (error) => {
                requestErrorFlag = true;
                this._onError(error);
            },
            complete: () => {
                if (!isDialogClosed && !requestErrorFlag) {
                    this.dialogRef.close();
                    isDialogClosed = true;
                }
            }
        });
    }
    private createUser() {
        const newUser = new User(this.state.selectedUser.jsonld);
        newUser.firstName = this.editProfileForm.controls.firstName.value;
        newUser.lastName = this.editProfileForm.controls.lastName.value;
        newUser.email = this.editProfileForm.controls.email.value ? 'mailto:' + this.editProfileForm.controls.email.value : '';
        return newUser;
    }
    private _onNext(newUser: User) {
        this.toast.createSuccessToast('User profile successfully saved');
        this.errorMessage = '';
        this.state.selectedUser = newUser;
        this.dialogRef.close();
    }
    private _onError(error: any) {
        this.errorMessage = error;
    }
}
