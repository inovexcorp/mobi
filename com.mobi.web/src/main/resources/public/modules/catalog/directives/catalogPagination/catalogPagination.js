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
         * @name catalogPagination
         *
         * @description
         * The `catalogPagination` module only provides the `catalogPagination` directive
         * which creates a wrapper for a {@link pagination.directive:pagination pagination}
         * directive with functionality specifically for the catalog module.
         */
        .module('catalogPagination', [])
        /**
         * @ngdoc directive
         * @name catalogPagination.directive:catalogPagination
         * @scope
         * @restrict E
         * @requires catalogState.service:catalogStateService
         *
         * @description
         * `catalogPagination` is a directive which creates a div with a
         * {@link pagination.directive:pagination pagination} directive passing a `getPage` method
         * that retrieves a new set of pagination results. The directive is replaced by the contents
         * of its template.
         */
        .directive('catalogPagination', catalogPagination);

    catalogPagination.$inject = ['catalogStateService'];

    function catalogPagination(catalogStateService) {
        return {
            restrict: 'E',
            replace: true,
            controllerAs: 'dvm',
            scope: {
                listKey: '<',
                getPage: '&'
            },
            controller: function() {
                var dvm = this;
                dvm.state = catalogStateService;
            },
            templateUrl: 'modules/catalog/directives/catalogPagination/catalogPagination.html'
        };
    }
})();
