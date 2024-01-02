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

import { Component, Input, EventEmitter, Output, Inject } from '@angular/core';
import { find, get } from 'lodash';
import { Router } from '@angular/router';

import { LoginManagerService } from '../../services/loginManager.service';
import { UserManagerService } from '../../services/userManager.service';
import { PERSPECTIVES, RoutePerspective } from '../../models/routePerspective.interface';
import { DOC_SITE, SERVICE_DESK } from '../../../documentation';

/**
 * @class shared.SidebarComponent
 *
 * A component that creates the main sidebar of the application. It contains a display of the currently
 * {@link shared.LoginManagerService logged in user} that also serves as a button to go to the
 * {@link settings.SettingsPageComponent}, buttons to navigate to the main modules of the application, an
 * "Administration" button to go to the {@link user-management.UserManagementPageComponent user management page}, a
 * button to get help for the application, a button to logout, and version information.
 */
@Component({
    selector: 'sidebar',
    templateUrl: './filtered/sidebar.component.html',
    styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
    @Input() collapsedNav: boolean;
    @Output() collapsedNavChange = new EventEmitter<boolean>();

    docSite = DOC_SITE;
    serviceDesk = SERVICE_DESK;

    constructor(public router: Router, public lm: LoginManagerService, public um: UserManagerService, 
        @Inject(PERSPECTIVES) public perspectives: RoutePerspective[]) {}

    toggle(): void {
        this.collapsedNav = !this.collapsedNav;
        this.collapsedNavChange.emit(this.collapsedNav);
    }
    getUserDisplay(): string {
        const user = find(this.um.users, {iri: this.lm.currentUserIRI});
        return get(user, 'firstName', '') || get(user, 'username', '');
    }
}
