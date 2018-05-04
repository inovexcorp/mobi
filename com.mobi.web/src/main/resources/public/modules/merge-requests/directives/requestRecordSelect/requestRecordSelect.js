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
         * @name requestRecordSelect
         *
         * @description
         * The `requestRecordSelect` module only provides the `requestRecordSelect` directive
         * which creates a form for selecting the VersionedRDFRecord of a new MergeRequest.
         */
        .module('requestRecordSelect', [])
        /**
         * @ngdoc directive
         * @name requestRecordSelect.directive:requestRecordSelect
         * @scope
         * @restrict E
         * @requires catalogManager.service:catalogManagerService
         * @requires mergeRequestsState.service:mergeRequestsStateService
         * @requires util.service:utilService
         * @requires prefixes.service:prefixes
         *
         * @description
         * `requestRecordSelect` is a directive which creates a div containing a search form, a list
         * of VersionedRDFRecords and a {@link pagination.directive:pagination} container to select
         * the VersionedRDFRecord for a new MergeRequest. The directive is replaced by the contents of
         * its template.
         */
        .directive('requestRecordSelect', requestRecordSelect);

    requestRecordSelect.$inject = ['catalogManagerService', 'mergeRequestsStateService', 'utilService', 'prefixes'];

    function requestRecordSelect(catalogManagerService, mergeRequestsStateService, utilService, prefixes) {
        return {
            restrict: 'E',
            templateUrl: 'modules/merge-requests/directives/requestRecordSelect/requestRecordSelect.html',
            replace: true,
            scope: {},
            controllerAs: 'dvm',
            controller: function() {
                var dvm = this;
                var cm = catalogManagerService;
                var catalogId = _.get(cm.localCatalog, '@id');
                dvm.state = mergeRequestsStateService;
                dvm.prefixes = prefixes;
                dvm.util = utilService;
                dvm.records = [];
                dvm.totalSize = 0;
                dvm.links = {
                    prev: '',
                    next: ''
                };
                dvm.config = {
                    recordType: prefixes.ontologyEditor + 'OntologyRecord',
                    limit: 25,
                    searchText: '',
                    sortOption: _.find(cm.sortOptions, {field: prefixes.dcterms + 'title', asc: true}),
                    pageIndex: 0,
                };

                dvm.selectRecord = function(record) {
                    dvm.state.requestConfig.recordId = record['@id'];
                    dvm.state.requestConfig.record = record;
                }
                dvm.setRecords = function() {
                    cm.getRecords(catalogId, dvm.config)
                        .then(response => setPagination(response), error => {
                            dvm.records = [];
                            dvm.totalSize = 0;
                            dvm.links = {
                                prev: '',
                                next: ''
                            };
                            dvm.util.createErrorToast(error);
                        });
                }
                dvm.getPage = function(direction) {
                    var original = dvm.config.pageIndex;
                    dvm.config.pageIndex = dvm.config.pageIndex + (direction === 'prev' ? -1 : 1);
                    dvm.util.getResultsPage(dvm.links[direction])
                        .then(response => setPagination(response), error => {
                            dvm.records = [];
                            dvm.config.pageIndex = original;
                            dvm.totalSize = 0;
                            dvm.links = {
                                prev: '',
                                next: ''
                            };
                            dvm.util.createErrorToast(error);
                        });
                }

                dvm.setRecords();

                function setPagination(response) {
                    dvm.records = _.chunk(response.data, 2);
                    var headers = response.headers();
                    dvm.totalSize = _.get(headers, 'x-total-count', 0);
                    var links = dvm.util.parseLinks(_.get(headers, 'link', ''));
                    dvm.links.prev = _.get(links, 'prev', '');
                    dvm.links.next = _.get(links, 'next', '');
                }
            }
        }
    }
})();