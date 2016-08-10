/*-
 * #%L
 * org.matonto.web
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
         * @name usersPage
         *
         * @description 
         * The `usersPage` module only provides the `usersPage` directive which provides the
         * {@link usersList.directive:usersList usersList} and 
         * {@link userEditor.directive:userEditor userEditor} directives.
         */
        .module('usersPage', [])
        /**
         * @ngdoc directive
         * @name usersPage.directive:usersPage
         * @scope
         * @restrict E
         * @requires userState.service:userStateService
         *
         * @description 
         * `usersPage` is a directive that provides the {@link usersList.directive:usersList usersList} 
         * and {@link userEditor.directive:userEditor userEditor} directives depending on the
         * {@link userState.service:userStateService state} of the user management page.
         */
        .directive('usersPage', usersPage);

    usersPage.$inject = ['userStateService'];

    function usersPage(userStateService) {
        return {
            restrict: 'E',
            controllerAs: 'dvm',
            scope: {},
            controller: function() {
                var dvm = this;
                dvm.state = userStateService;
            },
            templateUrl: 'modules/user-management/directives/usersPage/usersPage.html'
        };
    }
})();