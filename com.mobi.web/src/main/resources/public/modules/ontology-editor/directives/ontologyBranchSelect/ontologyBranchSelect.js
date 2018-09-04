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
         * @name ontologyBranchSelect
         *
         * @description
         * The `ontologyBranchSelect` module provides the `ontologyBranchSelect` directive which creates a
         * selector for the current ontology's branches.
         */
        .module('ontologyBranchSelect', [])
        /**
         * @ngdoc directive
         * @name ontologyBranchSelect.directive:ontologyBranchSelect
         * @scope
         * @restrict E
         * @requires catalogManager.service:catalogManagerService
         * @requires ontologyState.service:ontologyStateService
         * @requires prefixes.service:prefixes
         * @requires ontologyManager.service:ontologyManagerService
         * @requires util.service:utilService
         * @requires stateManager.service:stateManagerService
         *
         * @description
         * `ontologyBranchSelect` is a directive that creates a `ui-select` containing the branches of the current
         * {@link ontologyState.service:ontologyStateService listItem and binds the selected branch to `bindModel`.
         * Each branch in the `ui-select` has buttons for editing the metadata and deleting the branch which will bring
         * up a {@link confirmationOverlay.directive:confirmationOverlay}. The directive is replaced by the contents of
         * its template.
         *
         * @param {Object} bindModel The currently selected branch
         */
        .directive('ontologyBranchSelect', ontologyBranchSelect);

        ontologyBranchSelect.$inject = ['$filter', '$q', '$timeout', 'catalogManagerService', 'ontologyStateService', 'prefixes',
            'ontologyManagerService', 'utilService', 'stateManagerService'];

        function ontologyBranchSelect($filter, $q, $timeout, catalogManagerService, ontologyStateService, prefixes, ontologyManagerService, utilService,
            stateManagerService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/ontologyBranchSelect/ontologyBranchSelect.html',
                scope: {},
                bindToController: {
                    bindModel: '=ngModel'
                },
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    var sm = stateManagerService;
                    var om = ontologyManagerService;

                    dvm.os = ontologyStateService;
                    dvm.cm = catalogManagerService;
                    dvm.util = utilService;
                    dvm.showDeleteConfirmation = false;
                    dvm.showEditOverlay = false;
                    dvm.deleteError = '';

                    var catalogId = _.get(dvm.cm.localCatalog, '@id', '');

                    dvm.changeBranch = function(item) {
                        var branchId = item['@id'];
                        var state = sm.getOntologyStateByRecordId(dvm.os.listItem.ontologyRecord.recordId);
                        var commitId = dvm.util.getPropertyId(_.find(state.model, {[prefixes.ontologyState + 'branch']: [{'@id': branchId}]}), prefixes.ontologyState + 'commit');
                        dvm.cm.getBranchHeadCommit(branchId, dvm.os.listItem.ontologyRecord.recordId, catalogId)
                            .then(headCommit => {
                                var headCommitId = _.get(headCommit, "commit['@id']", '');
                                if (!commitId) {
                                    commitId = headCommitId;
                                }
                                return $q.all([
                                    sm.updateOntologyState(dvm.os.listItem.ontologyRecord.recordId, branchId, commitId),
                                    dvm.os.updateOntology(dvm.os.listItem.ontologyRecord.recordId, branchId, commitId, commitId === headCommitId)
                                ]);
                            }, $q.reject)
                            .then(() => dvm.os.resetStateTabs(), dvm.util.createErrorToast);
                    }

                    dvm.openDeleteConfirmation = function($event, branch) {
                        $event.stopPropagation();
                        dvm.branch = branch;
                        dvm.showDeleteConfirmation = true;
                    }

                    dvm.openEditOverlay = function($event, branch) {
                        $event.stopPropagation();
                        dvm.branch = branch;
                        dvm.showEditOverlay = true;
                    }

                    dvm.delete = function() {
                        om.deleteOntologyBranch(dvm.os.listItem.ontologyRecord.recordId, dvm.branch['@id'])
                            .then(() => {
                                dvm.os.removeBranch(dvm.os.listItem.ontologyRecord.recordId, dvm.branch['@id']);
                                dvm.showDeleteConfirmation = false;
                            }, errorMessage => dvm.deleteError = errorMessage);
                    }

                    dvm.submit = function() {
                        if (dvm.branch['@id'] === dvm.bindModel) {
                            dvm.bindModel = '';
                            $timeout(function() {
                                dvm.bindModel = dvm.branch['@id'];
                            });
                        }
                    }
                }
            }
        }
})();
