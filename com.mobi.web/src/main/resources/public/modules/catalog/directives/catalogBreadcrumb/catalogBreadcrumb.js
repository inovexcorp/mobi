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
         * @name catalogBreadcrumb
         *
         * @description
         * The `catalogBreadcrumb` module only provides the `catalogBreadcrumb` directive
         * which creates a Bootstrap "breadcrumb" ordered list for navigating through a catalog.
         */
        .module('catalogBreadcrumb', [])
        /**
         * @ngdoc directive
         * @name catalogBreadcrumb.directive:catalogBreadcrumb
         * @scope
         * @restrict E
         * @requires  catalogState.service:catalogStateService
         * @requires  catalogManager.service:catalogManagerService
         *
         * @description
         * `catalogBreadcrumb` is a directive which creates an ordered list with the Bootstrap
         * "breadcrumb" class for navigating through a catalog. Creates the breadcrumb based on the
         * `openedPath` of the current {@link catalogState.service:catalogStateService#catalogs catalog}.
         * The directive is replaced by the contents of its template.
         */
        .directive('catalogBreadcrumb', catalogBreadcrumb);

    catalogBreadcrumb.$inject = ['catalogStateService', 'catalogManagerService'];

    function catalogBreadcrumb(catalogStateService, catalogManagerService) {
        return {
            restrict: 'E',
            replace: true,
            controllerAs: 'dvm',
            scope: {},
            controller: function() {
                var dvm = this;
                dvm.state = catalogStateService;
                dvm.cm = catalogManagerService;

                dvm.clickCrumb = function(index) {
                    dvm.state.resetPagination();
                    dvm.state.getCurrentCatalog().openedPath = _.take(dvm.state.getCurrentCatalog().openedPath, index + 1);
                }
            },
            templateUrl: 'modules/catalog/directives/catalogBreadcrumb/catalogBreadcrumb.html'
        };
    }
})();
