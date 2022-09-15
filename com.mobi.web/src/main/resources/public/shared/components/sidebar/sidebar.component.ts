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

import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';
import { find, get } from 'lodash';
import { Router } from '@angular/router';

import { LoginManagerService } from '../../services/loginManager.service';
import { UserManagerService } from '../../services/userManager.service';

import './sidebar.component.scss';

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
    templateUrl: './filtered/sidebar.component.html'
})
export class SidebarComponent implements OnInit {
    @Input() collapsedNav: boolean;
    @Output() collapsedNavChange = new EventEmitter<boolean>();

    perspectives = [];

    constructor(public router: Router, public lm: LoginManagerService, public um: UserManagerService) {}

    ngOnInit(): void {
        this.perspectives = [
            { icon: 'home', route: '/home', isActive: this.router.isActive('/home', false), name: 'Home' },
            { icon: 'book', route: '/catalog', isActive: this.router.isActive('/catalog', false), name: 'Catalog' },
            { icon: 'pencil-square-o', route: '/ontology-editor', isActive: this.router.isActive('/ontology-editor', false), name: 'Ontology Editor'},
            { mat: true, icon: 'rule', route: '/shapes-graph-editor', isActive: this.router.isActive('/shapes-graph-editor', false), name: 'Shapes Editor'},
            { icon: 'envelope-o', route: '/merge-requests', isActive: this.router.isActive('/merge-requests', false), name: 'Merge Requests' },
            { icon: 'map-o', route: '/mapper', isActive: this.router.isActive('/mapper', false), name: 'Mapping Tool' },
            { icon: 'database', route: '/datasets', isActive: this.router.isActive('/datasets', false), name: 'Datasets' },
            { icon: 'search', route: '/discover', isActive: this.router.isActive('/discover', false), name: 'Discover' },
        ];
    }
    toggle(): void {
        this.collapsedNav = !this.collapsedNav;
        this.collapsedNavChange.emit(this.collapsedNav);
    }
    getUserDisplay(): string {
        const user = find(this.um.users, {iri: this.lm.currentUserIRI});
        return get(user, 'firstName', '') || get(user, 'username', '');
    }
}