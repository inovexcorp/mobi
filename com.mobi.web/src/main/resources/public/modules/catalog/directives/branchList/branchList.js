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
(function () {
    'use strict';

    /**
     * @ngdoc component
     * @name branchList.component:branchList
     * @requires catalogManager.service:catalogManagerService
     * @requires utilService.service:utilService
     * @requires prefixes.service:prefixes
     *
     * @description
     * `branchList` is a component which creates 
     */
    const branchListComponent = {
        templateUrl: 'modules/catalog/directives/branchList/branchList.html',
        bindings: {
            record: '<'
        },
        controllerAs: 'dvm',
        controller: branchListComponentCtrl
    };

    branchListComponentCtrl.$inject = ['catalogManagerService', 'utilService', 'prefixes'];

    function branchListComponentCtrl(catalogManagerService, utilService, prefixes) {
        var dvm = this;
        var cm = catalogManagerService;
        dvm.util = utilService;
        dvm.prefixes = prefixes;
        dvm.totalSize = 0;
        dvm.branches = [];
        dvm.catalogId = '';
        var increment = 10;
        dvm.limit = increment;

        dvm.$onInit = function() {
            if (dvm.record && !_.isEmpty(dvm.record)) {
                dvm.catalogId = dvm.util.getPropertyId(dvm.record, prefixes.catalog + 'catalog');
                dvm.setBranches();
            }
        }
        dvm.$onChanges = function() {
            if (dvm.record && !_.isEmpty(dvm.record)) {
                dvm.catalogId = dvm.util.getPropertyId(dvm.record, prefixes.catalog + 'catalog');
                dvm.setBranches();
            }
        }
        dvm.loadMore = function () {
            dvm.limit += increment;
            dvm.setBranches();
        }
        dvm.showPanel = function(branch) {
            _.forEach(dvm.branches, result => delete result.show);
            branch.show = true;
        }
        dvm.setBranches = function() {
            if (cm.isVersionedRDFRecord(dvm.record)) {
                var paginatedConfig = {
                    pageIndex: 0,
                    limit: dvm.limit,
                    sortOption: _.find(cm.sortOptions, {field: prefixes.dcterms + 'modified', asc: false})
                };
                cm.getRecordBranches(dvm.record['@id'], dvm.catalogId, paginatedConfig)
                    .then(response => {
                        dvm.branches = _.filter(response.data, branch => !cm.isUserBranch(branch));
                        var headers = response.headers();
                        dvm.totalSize = _.get(headers, 'x-total-count', 0) - (response.data.length - dvm.branches.length);
                    }, dvm.util.createErrorToast);
            }
        }
    }

    angular.module('catalog')
        .component('branchList', branchListComponent);
})();