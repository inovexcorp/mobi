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
        .module('createBranchOverlay', [])
        .directive('createBranchOverlay', createBranchOverlay);

        createBranchOverlay.$inject = ['$q', 'catalogManagerService', 'ontologyStateService', 'stateManagerService',
            'prefixes'];

        function createBranchOverlay($q, catalogManagerService, ontologyStateService, stateManagerService, prefixes) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/createBranchOverlay/createBranchOverlay.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    var cm = catalogManagerService;
                    var sm = stateManagerService;
                    var catalogId = _.get(cm.localCatalog, '@id', '');

                    dvm.os = ontologyStateService;
                    dvm.error = '';
                    dvm.branchConfig = {
                        title: '',
                        description: ''
                    };

                    dvm.create = function() {
                        if (dvm.branchConfig.description === '') {
                            _.unset(dvm.branchConfig, 'description');
                        }
                        var commitId;
                        cm.createRecordBranch(dvm.os.listItem.ontologyRecord.recordId, catalogId, dvm.branchConfig, dvm.os.listItem.ontologyRecord.commitId)
                        .then(branchId => cm.getRecordBranch(branchId, dvm.os.listItem.ontologyRecord.recordId, catalogId), $q.reject)
                        .then(branch => {
                            dvm.os.listItem.branches.push(branch);
                            dvm.os.listItem.ontologyRecord.branchId = branch['@id'];
                            commitId = branch[prefixes.catalog + 'head'][0]['@id'];
                            return dvm.os.updateOntology(dvm.os.listItem.ontologyRecord.recordId, dvm.os.listItem.ontologyRecord.branchId, commitId);
                        }, $q.reject)
                        .then(() => {
                            dvm.os.showCreateBranchOverlay = false;
                            dvm.os.resetStateTabs();
                        }, onError);

                    }

                    function onError(errorMessage) {
                        dvm.error = errorMessage;
                    }
                }
            }
        }
})();
