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
import * as angular from 'angular';

import createGroupOverlayComponent from './components/createGroupOverlay/createGroupOverlay.component';
import createUserOverlayComponent from './components/createUserOverlay/createUserOverlay.component';
import editGroupInfoOverlayComponent from './components/editGroupInfoOverlay/editGroupInfoOverlay.component';
import editUserProfileOverlayComponent from './components/editUserProfileOverlay/editUserProfileOverlay.component';
import groupListComponent from './components/groupsList/groupsList.component';
import groupsPageComponent from './components/groupsPage/groupsPage.component';
import memberTableComponent from './components/memberTable/memberTable.component';
import permissionsInputComponent from './components/permissionsInput/permissionsInput.component';
import permissionsPageComponent from './components/permissionsPage/permissionsPage.component';
import resetPasswordOverlayComponent from './components/resetPasswordOverlay/resetPasswordOverlay.component';
import userManagementPageComponent from './components/userManagementPage/userManagementPage.component';
import usersListComponent from './components/usersList/usersList.component';
import usersPageComponent from './components/usersPage/usersPage.component';

/**
 * @ngdoc overview
 * @name user-management
 *
 * @description
 * The `user-management` module provides components that make up the Administration page of Mobi for managing users,
 * groups, and overall permissions in the application.
 */
angular.module('user-management', [])
    .component('createGroupOverlay', createGroupOverlayComponent)
    .component('createUserOverlay', createUserOverlayComponent)
    .component('editGroupInfoOverlay', editGroupInfoOverlayComponent)
    .component('editUserProfileOverlay', editUserProfileOverlayComponent)
    .component('groupsList', groupListComponent)
    .component('groupsPage', groupsPageComponent)
    .component('memberTable', memberTableComponent)
    .component('permissionsInput', permissionsInputComponent)
    .component('permissionsPage', permissionsPageComponent)
    .component('resetPasswordOverlay', resetPasswordOverlayComponent)
    .component('userManagementPage', userManagementPageComponent)
    .component('usersList', usersListComponent)
    .component('usersPage', usersPageComponent);
