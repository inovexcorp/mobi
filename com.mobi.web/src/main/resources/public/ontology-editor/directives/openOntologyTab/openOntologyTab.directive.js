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
(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name openOntologyTab
         *
         * @description
         * The `openOntologyTab` module only provides the `openOntologyTab` directive which creates a
         * page with a list of ontologies in the Mobi instance and buttons to add to the list.
         */
        .module('openOntologyTab', [])
        /**
         * @ngdoc directive
         * @name openOntologyTab.directive:openOntologyTab
         * @scope
         * @restrict E
         * @requires httpService.service:httpService
         * @requires ontologyManager.service:ontologyManagerService
         * @requires ontologyState.service:ontologyStateService
         * @requires prefixes.service:prefixes
         * @requires util.service:utilService
         * @requires mapperState.service:mapperStateService
         * @requires catalogManager.service:catalogManagerService
         * @requires modal.service:modalService
         * @requires policyEnforcement.service:policyEnforcementService
         * @requires policyManager.service:policyManagerService
         *
         * @description
         * `openOntologyTab` is a directive that creates a page for opening ontologies. The page includes a
         * {@link searchBar.directive:searchBar} and a paginated list of ontologies with
         * {@link actionMenu.directive:actionMenu action menus} to manage and delete. In addition, the page includes
         * buttons for {@link newOntologyTab.directive:newOntologyTab creating new ontologies} and
         * {@link uploadOntologyTab.directive:uploadOntologyTab uploading ontologies}. The directive houses a method
         * for opening the modal deleting an ontology. The directive is replaced by the contents of its template.
         */
        .directive('openOntologyTab', openOntologyTab);

        openOntologyTab.$inject = ['httpService', 'ontologyManagerService', 'ontologyStateService', 'prefixes', 'utilService', 'mapperStateService', 'catalogManagerService', 'modalService', 'policyEnforcementService', 'policyManagerService'];

        function openOntologyTab(httpService, ontologyManagerService, ontologyStateService, prefixes, utilService, mapperStateService, catalogManagerService, modalService, policyEnforcementService, policyManagerService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'ontology-editor/directives/openOntologyTab/openOntologyTab.directive.html',
                scope: {},
                controllerAs: 'dvm',
                controller: ['$scope', function($scope) {
                    var dvm = this;
                    var cm = catalogManagerService;
                    var pe = policyEnforcementService;
                    var pm = policyManagerService;
                    var ontologyRecords = [];

                    dvm.prefixes = prefixes;
                    dvm.om = ontologyManagerService;
                    dvm.os = ontologyStateService;
                    dvm.ms = mapperStateService;
                    dvm.util = utilService;
                    dvm.currentPage = 1;
                    dvm.limit = 10;
                    dvm.totalSize = 0;
                    dvm.filteredList = [];
                    dvm.id = "openOntologyTabTargetedSpinner";

                    dvm.showUploadOntologyOverlay = function() {
                        modalService.openModal('uploadOntologyOverlay');
                    }
                    dvm.isOpened = function(record) {
                        return _.some(dvm.os.list, {ontologyRecord: {recordId: record['@id']}});
                    }
                    dvm.open = function(record) {
                        var listItem = _.find(dvm.os.list, {ontologyRecord: {recordId: record['@id']}});
                        if (listItem) {
                            dvm.os.listItem = listItem;
                            dvm.os.listItem.active = true;
                        } else {
                            dvm.os.openOntology(record['@id'], dvm.util.getDctermsValue(record, 'title'))
                                .then(_.noop, dvm.util.createErrorToast);
                        }
                    }
                    dvm.newOntology = function() {
                        var date = new Date();
                        dvm.os.newOntology = {
                            '@id': 'https://mobi.com/ontologies/' + (date.getMonth() + 1) + '/' + date.getFullYear() + '/',
                            '@type': [prefixes.owl + 'Ontology'],
                            [prefixes.dcterms + 'title']: [{
                                '@value': ''
                            }],
                            [prefixes.dcterms + 'description']: [{
                                '@value': ''
                            }]
                        };
                        dvm.os.newKeywords = [];
                        dvm.os.newLanguage = undefined;
                        modalService.openModal('newOntologyOverlay');
                    }
                    dvm.showDeleteConfirmationOverlay = function(record) {
                        dvm.recordId = _.get(record, '@id', '');

                        var msg = '';
                        if (_.find(dvm.ms.sourceOntologies, {recordId: dvm.recordId})) {
                            msg += '<error-display>Warning: The ontology you\'re about to delete is currently open in the mapping tool.</error-display>';
                        }
                        modalService.openConfirmModal(msg + '<p>Are you sure that you want to delete <strong>' + dvm.util.getDctermsValue(record, 'title') + '</strong>?</p>', dvm.deleteOntology);
                    }
                    dvm.deleteOntology = function() {
                        dvm.om.deleteOntology(dvm.recordId)
                            .then(response => {
                                _.remove(ontologyRecords, record => _.get(record, '@id', '') === dvm.recordId);
                                dvm.os.closeOntology(dvm.recordId);
                                var state = dvm.os.getOntologyStateByRecordId(dvm.recordId);
                                if (!_.isEmpty(state)) {
                                    dvm.os.deleteOntologyState(dvm.recordId);
                                }
                                dvm.currentPage = 1;
                                dvm.getPageOntologyRecords();
                            }, dvm.util.createErrorToast);
                    }
                    dvm.getPageOntologyRecords = function() {
                        var ontologyRecordType = prefixes.ontologyEditor + 'OntologyRecord';
                        var catalogId = _.get(cm.localCatalog, '@id', '');
                        var paginatedConfig = {
                            pageIndex: dvm.currentPage - 1,
                            limit: dvm.limit,
                            recordType: ontologyRecordType,
                            sortOption: _.find(cm.sortOptions, {field: 'http://purl.org/dc/terms/title', asc: true}),
                            searchText: dvm.filterText
                        };
                        httpService.cancel(dvm.id);
                        cm.getRecords(catalogId, paginatedConfig, dvm.id).then(response => {
                            dvm.filteredList = response.data;
                            if (response.headers() !== undefined) {
                                dvm.totalSize = _.get(response.headers(), 'x-total-count');
                            }
                            dvm.manageRecords();
                        });
                    }
                    dvm.search = function(event) {
                        dvm.currentPage = 1;
                        dvm.getPageOntologyRecords();
                    }
                    dvm.manageRecords = function() {
                        _.forEach(dvm.filteredList, record => {
                            var request = {
                                resourceId: 'http://mobi.com/policies/record/' + encodeURIComponent(record['@id']),
                                actionId: pm.actionUpdate
                            }
                            pe.evaluateRequest(request).then(decision => {
                                record.userCanManage = decision == pe.permit;
                                record.showAccessControls = false;
                            });
                        })
                    }
                    dvm.showAccessOverlay = function(record, ruleId) {
                        modalService.openModal('recordAccessOverlay', {ruleId, resource: record['@id']});
                    }

                    $scope.$watch(() => dvm.os.list.length, (newValue, oldValue) => {
                        if (newValue !== oldValue) {
                            dvm.getPageOntologyRecords();
                        }
                    });
                    $scope.$watch(() => dvm.os.uploadList.length, (newValue, oldValue) => {
                        if (newValue !== oldValue) {
                            dvm.showSnackbar = newValue > 0;
                        }
                    });
                    $scope.$watch(() => dvm.os.uploadPending, (newValue, oldValue) => {
                        if (newValue !== oldValue) {
                            if (newValue === 0) {
                                dvm.search();
                            }
                        }
                    });

                    dvm.getPageOntologyRecords();
                }]
            }
        }
})();