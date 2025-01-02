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
import { Component, OnInit } from '@angular/core';
import { MatSlideToggleChange } from '@angular/material/slide-toggle'; 
import { MatDialog } from '@angular/material/dialog';
import { includes, get, filter, noop } from 'lodash';

import { UserStateService } from '../../../shared/services/userState.service';
import { UserManagerService } from '../../../shared/services/userManager.service';
import { ConfirmModalComponent } from '../../../shared/components/confirmModal/confirmModal.component';
import { CreateUserOverlayComponent } from '../createUserOverlay/createUserOverlay.component';
import { EditUserProfileOverlayComponent } from '../editUserProfileOverlay/editUserProfileOverlay.component';
import { ResetPasswordOverlayComponent } from '../resetPasswordOverlay/resetPasswordOverlay.component';
import { Group } from '../../../shared/models/group.interface';
import { User } from '../../../shared/models/user.class';
import { ToastService } from '../../../shared/services/toast.service';
import { LoginManagerService } from '../../../shared/services/loginManager.service';

/**
 * @class user-management.UsersPageComponent
 * 
 * A component that creates a Bootstrap `row` div with functionality to select and edit a user. The left column contains
 * a {@link user-management.UsersListComponent list of users} for selecting the current
 * {@link shared.UserStateService#selectedUser user} and a button to create a User. On the right is a display of the
 * user's profile information, the groups the user is a member of, and buttons to toggle whether the user is an admin,
 * deleting the user, and resetting the user's password.
 */
@Component({
    selector: 'users-page',
    templateUrl: './usersPage.component.html',
    styleUrls: ['./usersPage.component.scss']
})
export class UsersPageComponent implements OnInit {
    isAdminUser = false;
    isAdmin = false;
    groups: Group[] = [];
    filteredUsers: User[] = [];
    selectedAdmin = false;
    selectedCurrentUser = false;
    selectedAdminUser = false;
    
    constructor(private dialog: MatDialog, public state: UserStateService, private um: UserManagerService,
        private lm: LoginManagerService, private toast: ToastService) {}

    ngOnInit(): void {
        this.setUsers();
        this.isAdminUser = this.um.isAdminUser(this.lm.currentUserIRI);
        this.isAdmin = this.um.isAdmin(this.lm.currentUser);

        if (this.state.selectedUser) {
            this.selectUser(this.state.selectedUser);
        } else {
            this.setAdmin();
        }
    }
    selectUser(user: User): void {
        this.state.selectedUser = user;
        this.selectedCurrentUser = this.lm.currentUser === this.state.selectedUser.username;
        this.selectedAdminUser = this.um.isAdminUser(this.state.selectedUser.iri);
        this.setAdmin();
        this.setUserGroups();
    }
    confirmDeleteUser(): void {
        this.dialog.open(ConfirmModalComponent, {
            data: {
                content: `Are you sure you want to remove <strong>${this.state.selectedUser.username}</strong>?`
            }
        }).afterClosed().subscribe((result: boolean) => {
            if (result) {
                this.deleteUser();
            }
        });
    }
    createUser(): void {
        this.dialog.open(CreateUserOverlayComponent);
    }
    editProfile(): void {
        this.dialog.open(EditUserProfileOverlayComponent);
    }
    resetPassword(): void {
        this.dialog.open(ResetPasswordOverlayComponent);
    }
    deleteUser(): void {
        this.um.deleteUser(this.state.selectedUser.username).subscribe(() => {
            this.toast.createSuccessToast('User successfully deleted');
            this.state.selectedUser = undefined;
            this.selectedCurrentUser = false;
            this.selectedAdminUser = false;
            this.setAdmin();
            this.setUserGroups();
        }, () => this.toast.createErrorToast('Error occurred when deleting user'));
    }
    changeAdmin(event: MatSlideToggleChange): void {
        const request = event.checked ? this.um.addUserRoles(this.state.selectedUser.username, ['admin']) : this.um.deleteUserRole(this.state.selectedUser.username, 'admin');
        request.subscribe( ()=> noop, this.toast.createErrorToast);
    }
    setUserGroups(): void {
        this.groups = filter(this.um.groups, group => includes(group.members, this.state.selectedUser?.username));
    }
    goToGroup(group: Group): void {
        this.state.selectedGroup = group;
        this.state.tabIndex = 1;
    }
    setAdmin(): void {
        this.selectedAdmin = includes(get(this.state.selectedUser, 'roles', []), 'admin');
    }
    onSearch(searchString: string): void {
        this.state.userSearchString = searchString;
        this.setUsers();
    }
    
    private setUsers(): void {
        this.filteredUsers = this.um.filterUsers(this.um.users, this.state.userSearchString);
    }
}
