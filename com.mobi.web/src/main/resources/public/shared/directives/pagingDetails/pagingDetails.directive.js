/*-
 * #%L
 * com.mobi.web
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
         * @name pagingDetails
         *
         * @description
         * The `pagingDetails` module only provides the `pagingDetails` directive which creates a div element
         * with description of a page of results.
         */
        .module('pagingDetails', [])
        /**
         * @ngdoc directive
         * @name pagingDetails.directive:pagingDetails
         * @scope
         * @restrict E
         *
         * @description
         * `pagingDetails` is a directive that creates a div element with a p containing a phrase describing
         * a page of results based on the passed total size, page index, and limit of results per page. The
         * directive is replaced by the content of the template.
         *
         * @param {number} totalSize The total number of results
         * @param {number} pageIndex The index of the current page
         * @param {number} limit The limit on the numebr of results per page
         */
        .directive('pagingDetails', pagingDetails);

        function pagingDetails() {
            return {
                restrict: 'E',
                replace: true,
                scope: {
                    totalSize: '<',
                    pageIndex: '<',
                    limit: '<'
                },
                controller: ['$scope', function($scope) {
                    $scope.Math = window.Math;
                }],
                templateUrl: 'shared/directives/pagingDetails/pagingDetails.directive.html'
            }
        }
})();
