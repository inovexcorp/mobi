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
         * @name analyticsEditorPage
         *
         * @description
         * The `analyticsEditorPage` module only provides the `analyticsEditorPage` directive which creates
         * the analytics editor page within the analytics page.
         */
        .module('analyticsEditorPage', [])
        /**
         * @ngdoc directive
         * @name analyticsEditorPage.directive:analyticsEditorPage
         * @scope
         * @restrict E
         *
         * @description
         * HTML contents in the editor page which contain a class list, property list, and editor section which
         * allows the users to create an analytic using the provided classes and properties.
         */
        .directive('analyticsEditorPage', analyticsEditorPage);
        
        function analyticsEditorPage() {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/analytics/directives/analyticsEditorPage/analyticsEditorPage.html',
                scope: {}
            }
        }
})();