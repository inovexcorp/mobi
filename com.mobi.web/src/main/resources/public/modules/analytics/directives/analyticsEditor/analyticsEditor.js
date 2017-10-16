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
         * @name analyticsEditor
         *
         * @description
         * The `analyticsEditor` module only provides the `analyticsEditor` directive which creates
         * the analytics editor within the analytics page.
         */
        .module('analyticsEditor', [])
        /**
         * @ngdoc directive
         * @name analyticsEditor.directive:analyticsEditor
         * @scope
         * @restrict E
         * @requires analyticState.service:analyticStateService
         *
         * @description
         * HTML contents in the editor section of the analytics page which provides the users with a section
         * on which to drop classes or properties to create an analytic.
         */
        .directive('analyticsEditor', analyticsEditor);
        
        analyticsEditor.$inject = ['analyticStateService'];
        
        function analyticsEditor(analyticStateService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/analytics/directives/analyticsEditor/analyticsEditor.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    dvm.state = analyticStateService;
                }
            }
        }
})();