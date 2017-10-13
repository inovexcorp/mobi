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
         * @name paginationHeader
         *
         * @description
         * The `paginationHeader` module only provides the `paginationHeader` directive which creates
         * a div with {@link pagingDetails.directive:pagingDetails pagingDetails} and
         * {@link sortOptions.directive:sortOptions sortOptions} for a pagination display in the catalog
         * module.
         */
        .module('paginationHeader', [])
        /**
         * @ngdoc directive
         * @name paginationHeader.directive:paginationHeader
         * @scope
         * @restrict E
         * @requires catalogState.service:cataStateService
         * @requires catalogManager.service:catalogManagerService
         *
         * @description
         * `paginationHeader` is a directive which creates a div with a
         * {@link pagingDetails.directive:pagingDetails pagingDetails} directive and a
         * {@link sortOptions.directive:sortOptions sortOptions} for the paginated display of results mathcing
         * the passed `listKey` in the current {@link catalogState.service:catalogStateService#catalogs catalog}. Takes
         * the function to call when the sort option is changed. The directive is replaced by the contents of
         * its template.
         *
         * @param {string} listKey The key for the state of the paginated results to display information about
         * in the current catalog
         * @param {Function} changeSort The function to pass to the `sortOptions` directive
         */
        .directive('paginationHeader', paginationHeader);

    paginationHeader.$inject = ['catalogStateService', 'catalogManagerService'];

    function paginationHeader(catalogStateService, catalogManagerService) {
        return {
            restrict: 'E',
            replace: true,
            controllerAs: 'dvm',
            scope: {
                listKey: '<',
                changeSort: '&',
            },
            controller: function() {
                var dvm = this;
                dvm.state = catalogStateService;
                dvm.cm = catalogManagerService;
            },
            templateUrl: 'modules/catalog/directives/paginationHeader/paginationHeader.html'
        };
    }
})();
