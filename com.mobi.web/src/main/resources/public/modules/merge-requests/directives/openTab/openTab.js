/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2018 iNovex Information Systems, Inc.
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
         * @name openTab
         *
         * @description
         */
        .module('openTab', [])
        /**
         * @ngdoc directive
         * @name openTab.directive:openTab
         * @scope
         * @restrict E
         *
         * @description
         */
        .directive('openTab', openTab);

        openTab.$inject = ['mergeRequestManagerService', 'utilService'];

        function openTab(mergeRequestManagerService, utilService) {
            return {
                restrict: 'E',
                templateUrl: 'modules/merge-requests/directives/openTab/openTab.html',
                replace: true,
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    var mm = mergeRequestManagerService;
                    var util = utilService;
                    dvm.requests = [];

                    mm.getRequests({})
                        .then(data => dvm.requests = data, util.createErrorToast);
                }
            }
        }
})();