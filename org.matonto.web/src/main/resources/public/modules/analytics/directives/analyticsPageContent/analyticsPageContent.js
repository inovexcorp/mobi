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
         * @name analyticsPageContent
         *
         * @description
         * The `analyticsPageContent` module only provides the `analyticsPageContent` directive which creates
         * the analytics page content within the analytics page.
         */
        .module('analyticsPageContent', [])
        /**
         * @ngdoc directive
         * @name analyticsPageContent.directive:analyticsPageContent
         * @scope
         * @restrict E
         * @requires analyticState.service:analyticStateService
         *
         * @description
         * HTML contents in the landing page which is a container for the landing/editor displays and properly
         * toggles between the two.
         */
        .directive('analyticsPageContent', analyticsPageContent);
        
        analyticsPageContent.$inject = ['analyticStateService'];
        
        function analyticsPageContent(analyticStateService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/analytics/directives/analyticsPageContent/analyticsPageContent.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    dvm.state = analyticStateService;
                }
            }
        }
})();