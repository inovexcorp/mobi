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
(function() {
    'use strict';

    angular
        .module('branchSelect', [])
        .directive('branchSelect', branchSelect);

        branchSelect.$inject = ['$q', 'catalogManagerService', 'ontologyStateService',
            'utilService', 'stateManagerService', 'ontologyManagerService'];

        function branchSelect($q, catalogManagerService, ontologyStateService, utilService,
            stateManagerService, ontologyManagerService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/branchSelect/branchSelect.html',
                scope: {},
                bindToController: {
                    bindModel: '=ngModel'
                },
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    var cm = catalogManagerService;
                    var sm = stateManagerService;
                    var om = ontologyManagerService;
                    var catalogId = _.get(cm.localCatalog, '@id', '');

                    dvm.os = ontologyStateService;
                    dvm.util = utilService;
                    dvm.showDeleteConfirmation = false;
                    dvm.showEditOverlay = false;
                    dvm.deleteError = '';

                    dvm.changeBranch = function(item) {
                        var branchId = item['@id'];
                        cm.getBranchHeadCommit(branchId, dvm.os.listItem.recordId, catalogId)
                            .then(headCommit => {
                                var commitId = _.get(headCommit, "commit[0]['@graph'][0]['@id']", '');
                                $q.all([
                                    sm.updateOntologyState(dvm.os.listItem.recordId, branchId, commitId),
                                    om.updateOntology(dvm.os.listItem.recordId, branchId, commitId)
                                ]).then(dvm.os.resetStateTabs());
                            });

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
                        cm.deleteRecordBranch(dvm.branch['@id'], dvm.os.listItem.recordId, catalogId)
                            .then(() => {
                                om.removeBranch(dvm.os.listItem.recordId, dvm.branch['@id']);
                                // _.remove(dvm.os.listItem.branches, branch => _.isEqual(branch, dvm.branch));
                                dvm.showDeleteConfirmation = false;
                            }, errorMessage => dvm.deleteError = errorMessage);
                    }
                }
            }
        }
})();
