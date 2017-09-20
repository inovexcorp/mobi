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
         * @name analyticsLandingPage
         *
         * @description
         * The `analyticsLandingPage` module only provides the `analyticsLandingPage` directive which creates
         * the analytics landing page within the analytics page.
         */
        .module('analyticsLandingPage', [])
        /**
         * @ngdoc directive
         * @name analyticsLandingPage.directive:analyticsLandingPage
         * @scope
         * @restrict E
         *
         * @description
         * HTML contents in the landing page of the analytics page which provides the users with a link to create
         * new analytics.
         */
        .directive('analyticsLandingPage', analyticsLandingPage);
        
        function analyticsLandingPage() {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/analytics/directives/analyticsLandingPage/analyticsLandingPage.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    dvm.showOverlay = false;
                }
            }
        }
})();