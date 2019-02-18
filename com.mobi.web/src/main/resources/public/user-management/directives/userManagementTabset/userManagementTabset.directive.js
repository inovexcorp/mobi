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

    angular
        /**
         * @ngdoc overview
         * @name userManagementTabset
         *
         * @description
         * The `userManagementTabset` module only provides the `userManagementTabset` directive
         * which creates the main {@link tabset.directive:tabset tabset} for the user management
         * area.
         */
        .module('userManagementTabset', [])
        /**
         * @ngdoc directive
         * @name userManagementTabset.directive:userManagementTabset
         * @scope
         * @restrict E
         * @requires userState.service:userStateService
         *
         * @description
         * `userManagementTabset` is a directive which creates a {@link tabset.directive:tabset tabset} with different
         * pages depending on whether the {@link usersPage.directive:usersPage users},
         * {@link groupsPage.directive:groupsPage groups}, or
         * {@link permissionsPage.directive:permissionsPage permissions} of Mobi should be shown. The directive is
         * replaced by the contents of its template.
         */
        .directive('userManagementTabset', userManagementTabset);

        userManagementTabset.$inject = ['userStateService'];

        function userManagementTabset(userStateService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'user-management/directives/userManagementTabset/userManagementTabset.directive.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    dvm.state = userStateService;
                }
            }
        }
})();
