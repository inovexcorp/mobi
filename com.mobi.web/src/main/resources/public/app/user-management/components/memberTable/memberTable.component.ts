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
import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';

import { UserManagerService } from '../../../shared/services/userManager.service';
import { User } from '../../../shared/models/user.class';

/**
 * @class user-management.MemberTableComponent
 * 
 * A component that creates a table of the passed members and provides functionality for removing members from list. The
 * exact method of removing is determined by the `removeMember` function. The Remove functionality is only available if
 * the `readOnly` attribute is falsy. The listed members can become clickable links if `linkToUser` is truthy.
 */
@Component({
    selector: 'member-table',
    templateUrl: './memberTable.component.html',
    styleUrls: ['./memberTable.component.scss']
})
export class MemberTableComponent implements OnChanges {
    /**
     * A list of usernames representing the members of a group
     * @type {string[]}
     */
    @Input() members: string[];
    /**
     * Whether the table is readonly
     * @type {boolean}
     */
    @Input() readOnly: boolean;
    /**
     * Whether the listed members should be clickable links
     * @type {boolean}
     */
    @Input() linkToUser: boolean;
    /**
     * A method to be run when a member is removed. Takes the member to remove as an argument in the form of the user's
     * username.
     */
    @Output() removeMember = new EventEmitter<string>();

    displayedColumns: string[] = ['user', 'delete'];
    dataSource: User[] = [];

    constructor(private _um: UserManagerService) {}

    ngOnChanges(): void {
        this.dataSource = this.members.map(username => this._um.users.find(user => user.username === username));
    }
    emitRemoveMember(user: string): void {
        this.removeMember.emit(user);
    }
}
