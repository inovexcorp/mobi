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
(function () {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name sortOptions
         *
         * @description
         * The `sortOptions` module only provides the `sortOptions` directive which creates
         * a div with a select for sorting by
         * {@link catalogManager.service:catalogManagerService#recordTypes record types} for
         * the specified paginated list in the current
         * {@link catalogState.service:catalogStateService#catalogs catalog}.
         */
        .module('sortOptions', [])
        /**
         * @ngdoc directive
         * @name sortOptions.directive:sortOptions
         * @scope
         * @restrict E
         * @requires catalogState.service:cataStateService
         * @requires catalogManager.service:catalogManagerService
         *
         * @description
         * `sortOptions` is a directive which creates a div with a select containing all
         * {@link catalogManager.service:catalogManagerService#recordTypes record types} to set the sort
         * option for the list determined by the passed `listKey` in the current
         * {@link catalogState.service:catalogStateService#catalogs catalog}. An optional function can be
         * passed in to be called when the value changes. The directive is replaced by the contents of its
         * template.
         *
         * @param {string} listKey The key for the state for the paginated ist to set the sort option of
         * @param {Function=undefined} changeSort The function to call when the sort option value changes
         */
        .directive('sortOptions', sortOptions);

    sortOptions.$inject = ['catalogStateService', 'catalogManagerService'];

    function sortOptions(catalogStateService, catalogManagerService) {
        return {
            restrict: 'E',
            replace: true,
            controllerAs: 'dvm',
            scope: {
                listKey: '<',
                changeSort: '&'
            },
            controller: function() {
                var dvm = this;
                dvm.state = catalogStateService;
                dvm.cm = catalogManagerService;
            },
            templateUrl: 'modules/catalog/directives/sortOptions/sortOptions.html'
        };
    }
})();
