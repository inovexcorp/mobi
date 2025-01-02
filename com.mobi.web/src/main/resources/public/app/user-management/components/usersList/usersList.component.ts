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
import { Component, Input, Output, EventEmitter } from '@angular/core';

import { User } from '../../../shared/models/user.class';
import { UserManagerService } from '../../../shared/services/userManager.service';

/**
 * @class user-management.UsersListComponent
 * 
 * A component that creates an unordered list containing the provided list of `users`. The provided `searchText` is only
 * used for highlighting purposes, assumes filtering is done by the parent. The `selectedUser` input determines which
 * user in the list should be styled as if it is selected. The provided `clickEvent` function is expected to update the
 * value of `selectedUser`.
 * 
 * @param {Object[]} users An array of user Objects
 * @param {Object} [selectedUser=undefined] The selected user to be styled
 * @param {Function} clickEvent A function to be called when a user is clicked. Should update the value of
 * `selectedUser`. Expects an argument called `user`.
 * @param {string} searchText Text that should be used to filter the list of users.
 */

@Component({
    selector: 'users-list',
    templateUrl: './usersList.component.html',
    styleUrls: ['./usersList.component.scss']
})
export class UsersListComponent {
    /**
     * An array of users to display
     * @type {User[]}
     */
    @Input() users: User[];
    /**
     * Text that should be used to highlight filter matches in the list of users.
     * @type {string}
     */
    @Input() searchText: string;
    /**
     * The selected group to be styled
     * @type {User}
     */
    @Input() selectedUser: User;
    /**
     * A method to be run when a group is clicked. Should update the value of `selectedUser`. Takes an argument in the
     * form of a {@link User}.
     */
    @Output() clickEvent = new EventEmitter();
    
    constructor(public um: UserManagerService) {}
    
    trackByFn(_index: number, item: User): string {
        return item.username;
    }
    clickUser(user: User): void {
        this.clickEvent.emit(user);
    }
}
