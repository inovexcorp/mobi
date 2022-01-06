/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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
import { Component, ViewChild, Inject} from '@angular/core';
import { MatTabChangeEvent } from '@angular/material';

import { UserStateService } from '../../../shared/services/userState.service';
import { PermissionsPageComponent } from '../permissionsPage/permissionsPage.component';

import './userManagementPage.component.scss';

/**
 * @class user-management.UserManagementPageComponent
 * @requires shared.service:UserStateService
 * @requires shared.service:settingManagerService
 * 
 * A component which creates a `mat-tab-group` with tabs depending on whether the
 * {@link user-management.UsersPageComponent users}, {@link user-management.GroupsPageComponent groups},
 * {@link user-management.PermissionsPageComponent permissions}, or
 * {@link shared.SettingEditPageComponent settingEditPage} of Mobi should be shown.
 */
@Component({
    selector: 'user-management-page',
    templateUrl: './userManagementPage.component.html'
})
export class UserManagementPageComponent {
    @ViewChild(PermissionsPageComponent) permissionsPage: PermissionsPageComponent;
    
    constructor(public state: UserStateService, @Inject('settingManagerService') public sm) {}

    onTabChanged(event: MatTabChangeEvent): void {
        if (event.index === 2) {
            this.permissionsPage.reset();
        }
    }
}
