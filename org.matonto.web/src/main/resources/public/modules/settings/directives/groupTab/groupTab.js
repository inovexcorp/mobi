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
         * @name passwordTab
         *
         * @description
         * The `groupTab` module only provides the `groupTab` directive which creates
         * 
         */
        .module('groupTab', [])
        /**
         * @ngdoc directive
         * @name groupTab.directive:groupTab
         * @scope
         * @restrict E
         * @requires userManager.service:userManagerService
         * @requires loginManager.service:loginManagerService
         *
         * @description
         * `groupTab` is a directive 
         */
        .directive('groupTab', groupTab);

        groupTab.$inject = ['userManagerService', 'loginManagerService', 'utilService'];

        function groupTab(userManagerService, loginManagerService, utilService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {},
                controller: function() {
                    var dvm = this;
                    var util = utilService;
                    dvm.um = userManagerService;
                    dvm.lm = loginManagerService;
                    dvm.getUserGroups = function() {
                    return _.filter(dvm.um.groups, group => _.includes(group.members, dvm.lm.currentUser));
                    }
                },

                templateUrl: 'modules/settings/directives/groupTab/groupTab.html'
            }
        }
})();
