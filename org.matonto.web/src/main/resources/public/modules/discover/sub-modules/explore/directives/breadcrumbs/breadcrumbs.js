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
         * @name breadcrumbs
         *
         * @description
         * The `breadcrumbs` module only provides the `breadcrumbs` directive which creates
         * the breadcrumb trail for the page you are currently viewing.
         */
        .module('breadcrumbs', [])
        /**
         * @ngdoc directive
         * @name breadcrumbs.directive:breadcrumbs
         * @scope
         * @restrict E
         * @requires discoverState.service:discoverStateService
         *
         * @description
         * HTML contents which shows the breadcrumb trail for the current page of the explore UI.
         */
        .directive('breadcrumbs', breadcrumbs);
        
        breadcrumbs.$inject = ['discoverStateService'];

        function breadcrumbs(discoverStateService) {
            return {
                restrict: 'E',
                templateUrl: 'modules/discover/sub-modules/explore/directives/breadcrumbs/breadcrumbs.html',
                replace: true,
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    dvm.ds = discoverStateService;
                    
                    dvm.clickCrumb = function(index) {
                        dvm.ds.explore.breadcrumbs = _.take(dvm.ds.explore.breadcrumbs, index + 1);
                        dvm.ds.explore.editing = false;
                    }
                }
            }
        }
})();