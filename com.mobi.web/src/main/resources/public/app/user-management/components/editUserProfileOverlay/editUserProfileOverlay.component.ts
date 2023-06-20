/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2023 iNovex Information Systems, Inc.
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
import { cloneDeep, find } from 'lodash';

import { UserStateService } from '../../../shared/services/userState.service';
import { UserManagerService } from '../../../shared/services/userManager.service';
import { FOAF } from '../../../prefixes';
import { UtilService } from '../../../shared/services/util.service';

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
        private state: UserStateService, private um: UserManagerService, private util: UtilService) {
            this.editProfileForm = this.fb.group({
                firstName: [this.state.selectedUser.firstName],
                lastName: [this.state.selectedUser.lastName],
                email: [this.state.selectedUser.email.replace('mailto:', ''), [ Validators.email ]]
            });
        }

    set(): void {
        const newUser = cloneDeep(this.state.selectedUser);
        newUser.firstName = this.editProfileForm.controls.firstName.value;
        this.util.replacePropertyValue(newUser.jsonld, FOAF + 'firstName', this.state.selectedUser.firstName, newUser.firstName);
        newUser.lastName = this.editProfileForm.controls.lastName.value;
        this.util.replacePropertyValue(newUser.jsonld, FOAF + 'lastName', this.state.selectedUser.lastName, newUser.lastName);
        newUser.email = this.editProfileForm.controls.email.value ? 'mailto:' + this.editProfileForm.controls.email.value : '';
        this.util.replacePropertyId(newUser.jsonld, FOAF + 'mbox', this.state.selectedUser.email, newUser.email);
        this.um.updateUser(this.state.selectedUser.username, newUser).subscribe(() => {
            this.util.createSuccessToast('User profile successfully saved');
            this.errorMessage = '';
            this.state.selectedUser = find(this.um.users, { username: newUser.username });
            this.dialogRef.close();
        }, error => this.errorMessage = error);
    }
}
