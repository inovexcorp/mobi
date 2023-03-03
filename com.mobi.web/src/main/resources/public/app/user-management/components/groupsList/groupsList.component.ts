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
import { Component, EventEmitter, Input, Output } from '@angular/core';

import { Group } from '../../../shared/models/group.interface';

/**
 * @class user-management.GroupsListComponent
 *
 * A component that creates an unordered list containing the provided `groups` list. The provided `searchText` is only
 * used for highlighting purposes, assumes filtering is done by the parent. The `selectedGroup` input determines which
 * group in the list should be styled as if it is selected. The provided `clickEvent` function is expected to update the
 * value of `selectedGroup`.
 */
@Component({
    selector: 'groups-list',
    templateUrl: './groupsList.component.html',
    styleUrls: ['./groupsList.component.scss']
})
export class GroupsListComponent {
    /**
     * An array of groups to display
     * @type {Group[]}
     */
    @Input() groups: Group[];
    /**
     * Text that should be used to highlight filter matches in the list of groups.
     * @type {string}
     */
    @Input() searchText: string;
    /**
     * The selected group to be styled
     * @type {Group}
     */
     @Input() selectedGroup: Group;
    /**
     * A method to be run when a group is clicked. Should update the value of `selectedGroup`. Takes an argument in the
     * form of a {@link Group}.
     */
    @Output() clickEvent = new EventEmitter();

    constructor() {}

    trackByFn(_index: number, item: Group): string {
        return item.title;
    }
    clickGroup(group: Group): void {
        this.clickEvent.emit(group);
    }
}
