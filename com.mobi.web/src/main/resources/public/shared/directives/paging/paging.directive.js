/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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

    paging.$inject = ['$timeout']

    function paging($timeout) {
        return {
            restrict: 'E',
            replace: true,
            scope: {},
            bindToController: {
                total: '<',
                currentPage: '=',
                limit: '<',
                changeEvent: '&'
            },
            controllerAs: 'dvm',
            controller: ['$scope', function($scope) {
                var dvm = this;
                $scope.Math = window.Math;

                dvm.onChange = function() {
                    $timeout(function() {
                        dvm.changeEvent();
                    });
                }
            }],
            templateUrl: 'shared/directives/paging/paging.directive.html'
        }
    }

    angular
        /**
         * @ngdoc overview
         * @name paging
         *
         * @description
         * The `paging` module only provides the `paging` directive which creates a div element with pagination buttons
         * and details about which page a user is currently on.
         */
        .module('paging', [])
        /**
         * @ngdoc directive
         * @name paging.directive:paging
         * @scope
         * @restrict E
         *
         * @description
         * `paging` is a directive that creates a div element with a `uib-pagination` and soem text describing the
         * current page of the pagination. The display states which items are showing as well as the total. The
         * pagination begins at the provided 1-based index of a page. The directive will automatically update the
         * `currentPage` value when directional buttons are clicked. A function can be provided to be called after the
         * current page changes. The directive is replaced by the content of the template.
         *
         * @param {number} total The total number of results
         * @param {number} currentPage The index of the current page (1 based)
         * @param {limit} limit The limit on the number of items per page
         * @param {function} changeEvent the function to be called when a directional button is clicked
         */
        .directive('paging', paging);
})();
