/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
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
         * @name exploreTab
         *
         * @description
         * The `exploreTab` module only provides the `exploreTab` directive which creates
         * the tab containing the explore page for viewing dataset details.
         */
        .module('exploreTab', [])
        /**
         * @ngdoc directive
         * @name sparqlResultTable.directive:exploreTab
         * @scope
         * @restrict E
         * @requires discoverState.service:discoverStateService
         *
         * @description
         * HTML contents in the explore tab which contains either the class or instance cards
         * depending on the step you are currently viewing.
         */
        .directive('exploreTab', exploreTab);
        
        exploreTab.$inject = ['discoverStateService'];

        function exploreTab(discoverStateService) {
            return {
                restrict: 'E',
                templateUrl: 'discover/explore/directives/exploreTab/exploreTab.directive.html',
                replace: true,
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    this.ds = discoverStateService;
                }
            }
        }
})();