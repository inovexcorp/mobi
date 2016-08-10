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
(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name groupsList
         *
         * @description 
         * The `groupsList` module only provides the `groupsList` directive which creates
         * an interactable list of all {@link userManager.service:userManagerService#groups groups}.
         */
        .module('groupsList', [])
        /**
         * @ngdoc directive
         * @name groupsList.directive:groupsList
         * @scope
         * @restrict E
         * @requires userManager.service:userManagerService
         * @requires userState.service:userStateService
         * @requires loginManager.service:loginManagerService
         *
         * @description 
         * `groupsList` is a directive that creates a table containing different subsets of the
         * {@link userManager.service:userManagerService#groups groups} list depending on which 
         * tab is selected. There is a tab for only groups the 
         * {@link loginManager.service:loginManagerService#currentUser current user} is in and a 
         * tab for all MatOnto groups. Groups can only be edited by admin users. The directive is 
         * replaced by the contents of its template.
         */
        .directive('groupsList', groupsList);

        groupsList.$inject = ['userStateService', 'userManagerService', 'loginManagerService'];

        function groupsList(userStateService, userManagerService, loginManagerService) {
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

                    dvm.editGroup = function(group) {
                        dvm.state.selectedGroup = group;
                        dvm.state.showGroupsList = false;
                        dvm.state.editGroup = true;
                    }
                    dvm.getGroups = function() {
                        return dvm.full ? dvm.um.groups : _.filter(dvm.um.groups, group => _.includes(group.members, dvm.lm.currentUser));
                    }
                },
                templateUrl: 'modules/user-management/directives/groupsList/groupsList.html'
            }
        }
})();
