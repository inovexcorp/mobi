/*-
 * #%L
 * org.matonto.web
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
         * @name instanceBlockHeader
         *
         * @description
         * The `instanceBlockHeader` module only provides the `instanceBlockHeader` directive which creates
         * the explore tab.
         */
        .module('instanceBlockHeader', [])
        /**
         * @ngdoc directive
         * @name sparqlResultTable.directive:instanceBlockHeader
         * @scope
         * @restrict E
         *
         * @description
         * HTML contents in the explore tab.
         */
        .directive('instanceBlockHeader', instanceBlockHeader);
        
        instanceBlockHeader.$inject = ['discoverStateService'];

        function instanceBlockHeader(discoverStateService) {
            return {
                restrict: 'E',
                templateUrl: 'modules/discover/sub-modules/explore/directives/instanceBlockHeader/instanceBlockHeader.html',
                replace: true,
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    dvm.ds = discoverStateService;
                    
                    dvm.clickCrumb = function(index) {
                        dvm.ds.explore.breadcrumbs = _.take(dvm.ds.explore.breadcrumbs, index + 1);
                    }
                }
            }
        }
})();