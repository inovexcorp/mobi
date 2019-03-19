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

    /**
     * @ngdoc component
     * @name merge-requests.component:requestRecordSelect
     * @requires shared.service:catalogManagerService
     * @requires shared.service:mergeRequestsStateService
     * @requires shared.service:utilService
     * @requires shared.service:prefixes
     *
     * @description
     * `requestRecordSelect` is a component which creates a div containing a search form, a list of
     * VersionedRDFRecords and a {@link shared.component:paging} container to select the VersionedRDFRecord for a
     * new MergeRequest.
     */
    const requestRecordSelectComponent = {
        templateUrl: 'merge-requests/components/requestRecordSelect/requestRecordSelect.component.html',
        bindings: {},
        controllerAs: 'dvm',
        controller: requestRecordSelectComponentCtrl
    };

    requestRecordSelectComponent.$inject = ['catalogManagerService', 'mergeRequestsStateService', 'utilService', 'prefixes'];

    function requestRecordSelectComponentCtrl(catalogManagerService, mergeRequestsStateService, utilService, prefixes) {
        var dvm = this;
        var cm = catalogManagerService;
        var catalogId = _.get(cm.localCatalog, '@id');
        dvm.state = mergeRequestsStateService;
        dvm.prefixes = prefixes;
        dvm.util = utilService;
        dvm.records = [];
        dvm.totalSize = 0;
        dvm.currentPage = 1;
        dvm.config = {
            recordType: prefixes.ontologyEditor + 'OntologyRecord',
            limit: 25,
            searchText: '',
            sortOption: _.find(cm.sortOptions, {field: prefixes.dcterms + 'title', asc: true}),
            pageIndex: 0,
        };

        dvm.$onInit = function() {
            dvm.setInitialRecords();
        }
        dvm.selectRecord = function(record) {
            dvm.state.requestConfig.recordId = record['@id'];
            dvm.state.requestConfig.record = record;
        }
        dvm.setRecords = function(page) {
            dvm.currentPage = page;
            dvm.config.pageIndex = dvm.currentPage - 1;
            cm.getRecords(catalogId, dvm.config)
                .then(response => setPagination(response), error => {
                    dvm.records = [];
                    dvm.totalSize = 0;
                    dvm.util.createErrorToast(error);
                });
        }
        dvm.setInitialRecords = function() {
            dvm.setRecords(1);
        }

        function setPagination(response) {
            dvm.records = _.chunk(response.data, 2);
            var headers = response.headers();
            dvm.totalSize = _.get(headers, 'x-total-count', 0);
        }
    }

    angular.module('merge-requests')
        .component('requestRecordSelect', requestRecordSelectComponent);
})();