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
import { NgModule } from '@angular/core';

import { SharedModule } from '../shared/shared.module';

import { CreateGroupOverlayComponent } from './components/createGroupOverlay/createGroupOverlay.component';
import { CreateUserOverlayComponent } from './components/createUserOverlay/createUserOverlay.component';
import { EditGroupInfoOverlayComponent } from './components/editGroupInfoOverlay/editGroupInfoOverlay.component';
import { EditUserProfileOverlayComponent } from './components/editUserProfileOverlay/editUserProfileOverlay.component';
import { GroupsListComponent } from './components/groupsList/groupsList.component';
import { GroupsPageComponent } from './components/groupsPage/groupsPage.component';
import { MemberTableComponent } from './components/memberTable/memberTable.component';
import { PermissionsPageComponent } from './components/permissionsPage/permissionsPage.component';
import { ResetPasswordOverlayComponent } from './components/resetPasswordOverlay/resetPasswordOverlay.component';
import { UserManagementPageComponent } from './components/userManagementPage/userManagementPage.component';
import { UsersListComponent } from './components/usersList/usersList.component';
import { UsersPageComponent } from './components/usersPage/usersPage.component';
import { AddMemberButtonComponent } from './components/addMemberButton/addMemberButton.component';

/**
 * @namespace user-management
 *
 * The `user-management` module provides components that make up the Administration page of Mobi for managing users,
 * groups, and overall permissions in the application.
 */
@NgModule({
    imports: [
        SharedModule
    ],
    declarations: [
        AddMemberButtonComponent,
        CreateGroupOverlayComponent,
        CreateUserOverlayComponent,
        EditGroupInfoOverlayComponent,
        EditUserProfileOverlayComponent,
        GroupsListComponent,
        GroupsPageComponent,
        MemberTableComponent,
        PermissionsPageComponent,
        ResetPasswordOverlayComponent,
        UserManagementPageComponent,
        UsersListComponent,
        UsersPageComponent
    ]
})
export class UserManagementModule {}
