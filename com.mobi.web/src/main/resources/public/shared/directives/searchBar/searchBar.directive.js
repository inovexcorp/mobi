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
         * @name searchBar
         *
         * @description
         * The `searchBar` module only provides the `searchBar` directive which creates an `.input-group` with a search
         * input.
         */
        .module('searchBar', [])
        /**
         * @ngdoc directive
         * @name searchBar.directive:searchBar
         * @scope
         * @restrict E
         *
         * @description
         * `searchBar` is a directive that creates an '.input-group' div element with an input for searching a list of
         * items. The search will be submitted when the enter button is clicked. The directive takes a function to be
         * called when the search is submitted. The directive is replaced by the content of the template.
         *
         * @param {string} bindModel The contents of the search input
         * @param {function} submitEvent The function to be called when the enter button is clicked
         */
        .directive('searchBar', searchBar);

    function searchBar() {
        return {
            restrict: 'E',
            replace: true,
            scope: {},
            bindToController: {
                bindModel: '=ngModel',
                submitEvent: '&'
            },
            controllerAs: 'dvm',
            controller: function() {
                var dvm = this;

                dvm.onKeyUp = function(event) {
                    if (event.keyCode === 13) {
                        dvm.submitEvent();
                    }
                }
            },
            templateUrl: 'shared/directives/searchBar/searchBar.directive.html'
        }
    }
})();
