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
            templateUrl: 'merge-requests/directives/requestRecordSelect/requestRecordSelect.directive.html',
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
                dvm.currentPage = 1;
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
                    dvm.config.pageIndex = dvm.currentPage - 1;
                    cm.getRecords(catalogId, dvm.config)
                        .then(response => setPagination(response), error => {
                            dvm.records = [];
                            dvm.totalSize = 0;
                            dvm.util.createErrorToast(error);
                        });
                }
                dvm.setInitialRecords = function() {
                    dvm.currentPage = 1;
                    dvm.setRecords();
                }

                dvm.setInitialRecords();

                function setPagination(response) {
                    dvm.records = _.chunk(response.data, 2);
                    var headers = response.headers();
                    dvm.totalSize = _.get(headers, 'x-total-count', 0);
                }
            }
        }
    }
})();