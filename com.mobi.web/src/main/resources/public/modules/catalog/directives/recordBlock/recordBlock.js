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
         * @name recordBlock
         *
         * @description
         * The `recordBlock` module only provides the `recordBlock` directive which creates
         * a div with a {@link block.directive:block block} containing all information about the
         * currently opened record in the current
         * {@link catalogState.service:catalogStateService#catalogs catalog}.
         */
        .module('recordBlock', [])
        /**
         * @ngdoc directive
         * @name recordBlock.directive:recordBlock
         * @scope
         * @restrict E
         * @requires catalogState.service:cataStateService
         * @requires catalogManager.service:catalogManagerService
         * @requires utilService.service:utilService
         * @requires prefixes.service:prefixes
         *
         * @description
         * `recordBlock` is a directive which creates a div with a {@link block.directive:block block}
         * containing all information about the currently opened record in the current
         * {@link catalogState.service:catalogStateService#catalogs catalog}. This record is retrieved from the
         * current catalog's opened path. Information displayed includes the
         * record's title, {@link recordTypes.directive:recordTypes types}, issued and modified
         * {@link entityDates.directive:entityDates dates},
         * {@link entityDescription.directive:entityDescription description}, and
         * {@link recordKeywords.directive:recordKeywords keywords}. If the record is a `VersionedRdfRecord`, an
         * infinite scrolled list of branches is loaded 10 at a time. Clicking on a branch will expand the expansion
         * panel, providing the branch description and a {@link commitHistoryTable.directive:commitHistoryTable}. The
         * directive is replaced by the contents of its template.
         */
        .directive('recordBlock', recordBlock);

    recordBlock.$inject = ['catalogStateService', 'catalogManagerService', 'utilService', 'prefixes'];

    function recordBlock(catalogStateService, catalogManagerService, utilService, prefixes) {
        return {
            restrict: 'E',
            replace: true,
            controllerAs: 'dvm',
            scope: {},
            controller: function() {
                var dvm = this;

                dvm.state = catalogStateService;
                dvm.cm = catalogManagerService;
                dvm.util = utilService;
                dvm.prefixes = prefixes;
                dvm.totalSize = 0;

                var currentCatalog = dvm.state.getCurrentCatalog();
                var increment = currentCatalog.branches.limit;
                dvm.limit = increment;
                dvm.record = {};

                dvm.cm.getRecord(_.last(currentCatalog.openedPath)['@id'], currentCatalog.catalog['@id'])
                    .then(response => {
                        dvm.record = response;
                        currentCatalog.openedPath[currentCatalog.openedPath.length - 1] = response;
                        getBranches();
                    }, () => {
                        currentCatalog.openedPath = _.initial(currentCatalog.openedPath);
                    });

                dvm.loadMore = function () {
                    dvm.limit += increment;
                    getBranches();
                };
                dvm.showPanel = function(branch) {
                    _.forEach(dvm.state.results, result => delete result.show);
                    branch.show = true;
                }

                function getBranches() {
                    if (dvm.cm.isVersionedRDFRecord(dvm.record)) {
                        var paginatedConfig = {
                            pageIndex: 0,
                            limit: dvm.limit,
                            sortOption: _.find(dvm.cm.sortOptions, {field: prefixes.dcterms + 'modified', asc: false})
                        };
                        dvm.cm.getRecordBranches(dvm.record['@id'], currentCatalog.catalog['@id'], paginatedConfig)
                            .then(response => {
                                dvm.state.results = response.data;
                                var headers = response.headers();
                                dvm.totalSize = _.get(headers, 'x-total-count', 0);
                            }, dvm.util.createErrorToast);
                    }
                }
            },
            templateUrl: 'modules/catalog/directives/recordBlock/recordBlock.html'
        };
    }
})();
