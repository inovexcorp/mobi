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
import { Component } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { find } from 'lodash';

import { Group } from '../../../shared/models/group.interface';
import { UserManagerService } from '../../../shared/services/userManager.service';
import { UserStateService } from '../../../shared/services/userState.service';
import { updateDctermsValue } from '../../../shared/utility';

/**
 * @class user-management.EditGroupInfoOverlayComponent
 *
 * A component that creates content for a modal with a form to change the
 * {@link shared.UserStateService#selectedGroup selected group's} information in Mobi. The form contains a field to edit
 * the group's description. Meant to be used in conjunction with the `MatDialog` service.
 */
@Component({
    selector: 'edit-group-info-overlay',
    templateUrl: './editGroupInfoOverlay.component.html'
})
export class EditGroupInfoOverlayComponent {
    editGroupInfoForm: UntypedFormGroup;
    errorMessage = '';

    constructor(private dialogRef: MatDialogRef<EditGroupInfoOverlayComponent>, 
        private fb: UntypedFormBuilder,
        private state: UserStateService, 
        private um: UserManagerService) {
            this.editGroupInfoForm = this.fb.group({
                description: [this.state.selectedGroup.description]
            });
    }
    
    set(): void {
        let isDialogClosed = false;
        let requestErrorFlag = false;
        const newGroup: Group = Object.assign({}, this.state.selectedGroup);
        newGroup.description = this.editGroupInfoForm.controls.description.value;
        updateDctermsValue(newGroup.jsonld, 'description', newGroup.description);
        this.um.updateGroup(this.state.selectedGroup.title, newGroup).subscribe({
            next: () => {
                this.errorMessage = '';
                this.state.selectedGroup = find(this.um.groups, {title: newGroup.title});
                this.dialogRef.close();
                isDialogClosed = true;
            }, 
            error: (error) => {
                requestErrorFlag = true;
                this.errorMessage = error;
            },
            complete: () => {
                if (!isDialogClosed && !requestErrorFlag) {
                    this.dialogRef.close();
                    isDialogClosed = true;
                }
            }
        });
    }
}
