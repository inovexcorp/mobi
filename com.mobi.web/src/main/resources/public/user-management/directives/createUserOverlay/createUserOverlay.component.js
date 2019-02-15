/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
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
(function () {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name createUserOverlays
         *
         * @description
         * The `createUserOverlay` module only provides the `createUserOverlay` component which creates content for a
         * modal to add a user to Mobi.
         */
        .module('createUserOverlay', [])
        /**
         * @ngdoc component
         * @name createUserOverlay.component:createUserOverlay
         * @requires $q
         * @requires userManager.service:userManagerService
         * @requires userState.service:userStateService
         *
         * @description
         * `createUserOverlay` is a component that creates content for a modal with a form to add a user to Mobi. The
         * form contains fields for the basic information about the user including the username, password, first name,
         * last name, email, permissions, and roles of the new user. Meant to be used in conjunction with the
         * {@link modalService.directive:modalService}.
         *
         * @param {Function} close A function that closes the modal
         * @param {Function} dismiss A function that dismisses the modal
         */
        .component('createUserOverlay', {
            bindings: {
                close: '&',
                dismiss: '&'
            },
            controllerAs: 'dvm',
            controller: ['$q', 'userStateService', 'userManagerService', 'REGEX', CreateUserOverlayController],
            templateUrl: 'user-management/directives/createUserOverlay/createUserOverlay.component.html'
        });

    function CreateUserOverlayController($q, userStateService, userManagerService, REGEX) {
        var dvm = this;
        dvm.state = userStateService;
        dvm.um = userManagerService;
        dvm.usernamePattern = REGEX.LOCALNAME;
        dvm.errorMessage = '';
        dvm.roles = {admin: false};
        dvm.newUser = {
            username: '',
            roles: ['user'],
            firstName: '',
            lastName: '',
            email: ''
        };

        dvm.getUsernames = function() {
            return _.map(dvm.um.users, 'username');
        }
        dvm.add = function() {
            if (dvm.roles.admin) {
                dvm.newUser.roles.push('admin');
            }
            dvm.um.addUser(dvm.newUser, dvm.password)
                .then(response => {
                    dvm.errorMessage = '';
                    dvm.close()
                }, error => dvm.errorMessage = error);
        }
        dvm.cancel = function() {
            dvm.dismiss();
        }
    }
})();
