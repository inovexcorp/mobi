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
import './userManagementPage.component.scss';

const template = require('./userManagementPage.component.html');

/**
 * @ngdoc component
 * @name user-management.component:userManagementPage
 * @requires shared.service:userStateService
 *
 * @description
 * `userManagementPage` is a component which creates a {@link shared.component:tabset tabset} with different pages
 * depending on whether the {@link user-management.component:usersPage users},
 * {@link user-management.component:groupsPage groups}, or
 * {@link user-management.component:permissionsPage permissions} of Mobi should be shown.
 */
const userManagementPageComponent = {
    template,
    bindings: {},
    controllerAs: 'dvm',
    controller: userManagementPageComponentCtrl
};

userManagementPageComponentCtrl.$inject = ['userStateService'];

function userManagementPageComponentCtrl(userStateService) {
    var dvm = this;
    dvm.state = userStateService;
}

export default userManagementPageComponent;