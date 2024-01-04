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
import { filter, includes } from 'lodash';
import { Component, OnInit } from '@angular/core';

import { UserManagerService } from '../../../shared/services/userManager.service';
import { Group } from '../../../shared/models/group.interface';
import { LoginManagerService } from '../../../shared/services/loginManager.service';

/**
 * @name settings.GroupTabComponent
 *
 * `groupTab` is a component which creates a Bootstrap list of groups a user is in.
 */
@Component({
    selector: 'group-tab',
    styleUrls: ['./groupTab.component.scss'],
    templateUrl: './groupTab.component.html'
})
export class GroupTabComponent implements OnInit {
    groups: Group[] = [];

    constructor(private um: UserManagerService, private lm: LoginManagerService) {}

    ngOnInit(): void {
        this.groups = filter(this.um.groups, (group: Group) => includes(group.members, this.lm.currentUser));
    }

    trackByFn(group: Group): string {
        return group.title;
    }
}
