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
(function() {
    'use strict';
    /**
     * @ngdoc component
     * @name settings.component:profileTab
     * @requires shared.service:userManagerService
     * @requires shared.service:loginManagerService
     * @requires shared.service:prefixes
     *
     * @description
     * `profileTab` is a component that creates a Bootstrap `row` with a {@link shared.component:block block} that contains a
     * form allowing the current user to change their profile information. This information includes their first name, last
     * name, and email address.
     */
    const profileTabComponent = {
        templateUrl: 'settings/components/profileTab/profileTab.component.html',
        bindings: {},
        controllerAs: 'dvm',
        controller: profileTabComponentCtrl
    };

    profileTabComponentCtrl.$inject = ['userManagerService', 'loginManagerService', 'prefixes'];

    function profileTabComponentCtrl(userManagerService, loginManagerService, prefixes) {
        var dvm = this;
        dvm.um = userManagerService;
        dvm.lm = loginManagerService;
        dvm.currentUser = undefined;

        dvm.$onInit = function() {
            dvm.currentUser = angular.copy(_.find(dvm.um.users, {username: dvm.lm.currentUser}));
        }
        dvm.save = function() {
            dvm.currentUser.jsonld[prefixes.foaf + 'firstName'] = [{'@value': dvm.currentUser.firstName}];
            dvm.currentUser.jsonld[prefixes.foaf + 'lastName'] = [{'@value': dvm.currentUser.lastName}];
            dvm.currentUser.jsonld[prefixes.foaf + 'mbox'] = [{'@id': dvm.currentUser.email}];
            dvm.um.updateUser(dvm.currentUser.username, dvm.currentUser).then(response => {
                dvm.errorMessage = '';
                dvm.success = true;
                dvm.form.$setPristine();
            }, error => {
                dvm.errorMessage = error;
                dvm.success = false;
            });
        }
    }
    angular.module('settings')
        .component('profileTab', profileTabComponent);
})();