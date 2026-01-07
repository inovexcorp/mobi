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

import { Injectable } from '@angular/core';

import { Group } from '../models/group.interface';
import { User } from '../models/user.class';

/**
 * @class shared.UserStateService
 *
 * A service which contains various variables to hold the state of the
 * {@link user-management.UserManagementPage user management page} and utility functions to update those variables.
 */
@Injectable()
export class UserStateService {
    /**
     * `groupSearchString` holds a string to be used in filtering the
     * {@link user-management.GroupsListComponent groups list}.
     * @type {string}
     */
    groupSearchString = '';
    /**
     * `userSearchString` holds a string to be used in filtering the
     * {@link user-management.UsersListComponent users list}.
     * @type {string}
     */
    userSearchString = '';
    /**
     * `selectedGroup` holds the currently selected group object from the
     * {@link shared.UserManagerService#groups groups list}.
     * @type {Group}
     */
    selectedGroup: Group = undefined;
    /**
     * `selectedUser` holds the currently selected user object from the
     * {@link shared.UserManagerService#users users list}.
     * @type {User}
     */
    selectedUser: User = undefined;
    /**
     * `tabIndex` holds the currently selected tab index in the
     * {@link user-management.UserManagementPageComponent user management page}.
     * @type {number}
     */
    tabIndex = 0;

    constructor() {}

    /**
     * Resets all the main state variables back to false and undefined.
     */
    reset(): void {
        this.selectedGroup = undefined;
        this.selectedUser = undefined;
        this.groupSearchString = '';
        this.userSearchString = '';
        this.tabIndex = 0;
    }
}
