/*-
 * #%L
 * org.matonto.web
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
         * @name columnSelect
         *
         * @description 
         * The `columnSelect` module only provides the `columnSelect` directive which creates
         * a `ui-select` with the passed column list and selected column.
         */
        .module('columnSelect', [])
        /**
         * @ngdoc directive
         * @name columnSelect.directive:columnSelect
         * @scope
         * @restrict E
         * @requires delimitedManager.service:delimitedManagerService
         *
         * @description 
         * `columnSelect` is a directive which creates a `ui-select` with the passed column list and
         * selected column. The directive is replaced by the contents of its template.
         *
         * @param {string[]} columns an array of column headers
         * @param {string} selectedColumn the currently selected column header
         */
        .directive('columnSelect', columnSelect);

        columnSelect.$inject = ['delimitedManagerService'];

        function columnSelect(delimitedManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {
                    columns: '<'
                },
                bindToController: {
                    selectedColumn: '='
                },
                controller: function() {
                    var dvm = this;
                    dvm.dm = delimitedManagerService;
                },
                templateUrl: 'modules/mapper/directives/columnSelect/columnSelect.html'
            }
        }
})();
