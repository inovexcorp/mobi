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
        .module('branchSelect', [])
        .directive('branchSelect', branchSelect);

        branchSelect.$inject = ['$q', 'catalogManagerService', 'ontologyStateService',
            'ontologyManagerService', 'utilService', 'stateManagerService'];

        function branchSelect($q, catalogManagerService, ontologyStateService, ontologyManagerService, utilService,
            stateManagerService) {
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
                        cm.getBranchHeadCommit(branchId, dvm.os.listItem.ontologyRecord.recordId, catalogId)
                            .then(headCommit => {
                                var commitId = _.get(headCommit, "commit['@id']", '');
                                $q.all([
                                    sm.updateOntologyState(dvm.os.listItem.ontologyRecord.recordId, branchId, commitId),
                                    dvm.os.updateOntology(dvm.os.listItem.ontologyRecord.recordId, branchId, commitId)
                                ]).then(() => dvm.os.resetStateTabs());
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

                    dvm.getBranchName = function(branch) {
                        dvm.os.listItem.userBranch = dvm.os.isUserBranch(branch);
                        return dvm.util.getDctermsValue(branch, 'title');
                    }

                    dvm.delete = function() {
                        om.deleteOntology(dvm.os.listItem.ontologyRecord.recordId, dvm.branch['@id'])
                            .then(() => {
                                dvm.os.removeBranch(dvm.os.listItem.ontologyRecord.recordId, dvm.branch['@id']);
                                dvm.showDeleteConfirmation = false;
                            }, errorMessage => dvm.deleteError = errorMessage);
                    }
                }
            }
        }
})();
