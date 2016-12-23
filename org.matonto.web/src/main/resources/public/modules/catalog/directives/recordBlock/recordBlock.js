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
(function () {
    'use strict';

    angular
        .module('recordBlock', [])
        .directive('recordBlock', recordBlock);

    recordBlock.$inject = ['catalogStateService', 'catalogManagerService', 'prefixes', 'utilService'];

    function recordBlock(catalogStateService, catalogManagerService, prefixes, utilService) {
        return {
            restrict: 'E',
            replace: true,
            controllerAs: 'dvm',
            scope: {},
            controller: function() {
                var dvm = this;
                dvm.state = catalogStateService;
                dvm.cm = catalogManagerService;
                dvm.prefixes = prefixes;
                dvm.util = utilService;
                dvm.record = dvm.state.getCurrentCatalog().openedPath[dvm.state.getCurrentCatalog().openedPath.length - 1];

                getBranches();

                dvm.changeSort = function() {
                    getBranches();
                }
                dvm.openBranch = function(branch) {
                    dvm.state.resetPagination();
                    dvm.state.getCurrentCatalog().openedPath.push(branch);
                }

                function getBranches() {
                    dvm.state.currentPage = 0;
                    var currentCatalog = dvm.state.getCurrentCatalog();
                    var paginatedConfig = {
                        pageIndex: dvm.state.currentPage,
                        limit: currentCatalog.branches.limit,
                        sortOption: currentCatalog.branches.sortOption,
                    }
                    dvm.cm.getRecordBranches(dvm.record['@id'], currentCatalog.catalog['@id'], paginatedConfig)
                        .then(response => dvm.state.setPagination(response), error => toastr.error(error, 'Error', {timeOut: 0}));
                }
            },
            templateUrl: 'modules/catalog/directives/recordBlock/recordBlock.html'
        };
    }
})();
