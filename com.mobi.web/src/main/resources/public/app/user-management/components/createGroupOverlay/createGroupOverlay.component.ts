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
import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { map, without } from 'lodash';

import { UserManagerService } from '../../../shared/services/userManager.service';
import { uniqueValue } from '../../../shared/validators/uniqueValue.validator';
import { Group } from '../../../shared/models/group.interface';
import { User } from '../../../shared/models/user.class';
import { ToastService } from '../../../shared/services/toast.service';
import { LoginManagerService } from '../../../shared/services/loginManager.service';

/**
 * @class user-management.CreateGroupOverlayComponent
 * 
 * A component that creates content for a modal with a form to add a group to Mobi. The form includes the group title,
 * a group description, and group {@link user-management.MemberTableComponent members}. Meant to be used in conjunction
 * with the `MatDialog` service.
 */
@Component({
    selector: 'create-group-overlay',
    templateUrl: './createGroupOverlay.component.html'
})
export class CreateGroupOverlayComponent implements OnInit {
    members: string[] = [];
    errorMessage = '';
    createGroupForm = this.fb.group({
        title: ['', [ Validators.required, uniqueValue(this.getTitles())]],
        description: [''],
        admin: ''
    });

    constructor(private dialogRef: MatDialogRef<CreateGroupOverlayComponent>, private fb: UntypedFormBuilder,
        private um: UserManagerService, private lm: LoginManagerService, private toast: ToastService) {}
    
    ngOnInit(): void {
        this.members = [this.lm.currentUser];
    }
    getTitles(): string[] {
        return map(this.um.groups, 'title');
    }
    getTitleErrorMessage(): string {
        return this.createGroupForm.controls.title.hasError('uniqueValue') ? 'This group title has already been taken' : '';
    }
    add(): void {
        let isDialogClosed = false;
        let requestErrorFlag = false;
        const newGroup: Group = {
            title: this.createGroupForm.controls.title.value,
            description: this.createGroupForm.controls.description.value,
            roles: [],
            members: this.members,
            external: false
        };
        if (this.createGroupForm.controls.admin.value) {
            newGroup.roles.push('admin');
        }
        this.um.addGroup(newGroup).subscribe({
            next: () => {
                this.toast.createSuccessToast('Group successfully created');
                this.errorMessage = '';
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
    addMember(member: User): void {
        this.members = this.members.concat([member.username]);
    }
    removeMember(member: string): void {
        this.members = without(this.members, member);
    }
}
