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
         * @name usersList
         *
         * @description
         * The `usersList` module only provides the `usersList` directive which creates
         * an interactable list of all {@link userManager.service:userManagerService#users users}.
         */
        .module('usersList', [])
        /**
         * @ngdoc directive
         * @name usersList.directive:usersList
         * @scope
         * @restrict E
         * @requires userManager.service:userManagerService
         * @requires userState.service:userStateService
         * @requires loginManager.service:loginManagerService
         *
         * @description
         * `usersList` is a directive that creates a <ul> containing the
         * {@link userManager.service:userManagerService#users users} list. Users can only be edited
         * by admin users. The directive is replaced by the contents of its template.
         */
        .directive('usersList', usersList);

    usersList.$inject = ['userStateService', 'userManagerService', 'loginManagerService'];

    function usersList(userStateService, userManagerService, loginManagerService) {
        return {
            restrict: 'E',
            controllerAs: 'dvm',
            replace: true,
            scope: {},
            controller: function() {
                var dvm = this;
                dvm.state = userStateService;
                dvm.um = userManagerService;
                dvm.lm = loginManagerService;

                dvm.onClick = function(user) {
                    dvm.state.selectedUser = user;
                }
            },
            templateUrl: 'user-management/directives/usersList/usersList.directive.html'
        };
    }
})();
