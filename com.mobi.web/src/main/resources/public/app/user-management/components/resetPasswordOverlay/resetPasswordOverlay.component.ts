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

import { UserManagerService } from '../../../shared/services/userManager.service';
import { UserStateService } from '../../../shared/services/userState.service';
import { ToastService } from '../../../shared/services/toast.service';

/**
 * @class user-management.ResetPasswordOverlayComponent
 *
 * A component that creates content for a modal with a form to reset the
 * {@link shared.UserStateService#selectedUser selected user's} password in Mobi. Meant to be used in conjunction with
 * the `MatDialog` service.
 */
@Component({
    selector: 'reset-password-overlay',
    templateUrl: './resetPasswordOverlay.component.html'
})
export class ResetPasswordOverlayComponent {
    errorMessage = '';
    resetPasswordForm = this.fb.group({
        unmaskPassword: ['', [Validators.required]],
    });

    constructor(private dialogRef: MatDialogRef<ResetPasswordOverlayComponent>, private fb: UntypedFormBuilder,
        private state: UserStateService, private um: UserManagerService, private toast: ToastService) {}

    set(): void {
        this.um.resetPassword(this.state.selectedUser.username, this.resetPasswordForm.controls.unmaskPassword.value)
            .subscribe(() => {
                this.toast.createSuccessToast('Password successfully reset');
                this.errorMessage = '';
                this.dialogRef.close();
            }, error => this.errorMessage = error);
    }
}
