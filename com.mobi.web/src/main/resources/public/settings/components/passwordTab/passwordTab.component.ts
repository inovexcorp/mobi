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
import { find } from 'lodash';

import './passwordTab.component.scss';

const template = require('./passwordTab.component.html');

/**
 * @ngdoc component
 * @name settings.component:passwordTab
 * @requires shared.service:userManagerService
 * @requires shared.service:loginManagerService
 *
 * @description
 * `passwordTab` is a component that creates a Bootstrap `row` with a {@link shared.component:block block} containing a
 * form allowing the current user to change their password. The user must enter their current password in order to make
 * a change. The new password is confirmed within a
 * {@link shared.component:passwordConfirmInput passwordConfirmInput}.
 */
const passwordTabComponent = {
    template,
    bindings: {},
    controllerAs: 'dvm',
    controller: passwordTabComponentCtrl
};

passwordTabComponentCtrl.$inject = ['userManagerService', 'loginManagerService', 'utilService'];

function passwordTabComponentCtrl(userManagerService, loginManagerService, utilService) {
    const dvm = this;
    const util = utilService;
    dvm.um = userManagerService;
    dvm.lm = loginManagerService;
    dvm.currentUser = undefined;
    dvm.showPassword = false;

    dvm.$onInit = function() {
        dvm.currentUser = angular.copy(find(dvm.um.users, {username: dvm.lm.currentUser}));
    };
    dvm.save = function() {
        dvm.um.changePassword(dvm.lm.currentUser, dvm.currentPassword, dvm.password)
            .then(() => {
                dvm.errorMessage = '';
                util.createSuccessToast('Password successfully saved');
                dvm.currentPassword = '';
                dvm.password = '';
                dvm.confirmedPassword = '';
                dvm.form.$setPristine();
            }, error => dvm.errorMessage = error);
    };
}

export default passwordTabComponent;