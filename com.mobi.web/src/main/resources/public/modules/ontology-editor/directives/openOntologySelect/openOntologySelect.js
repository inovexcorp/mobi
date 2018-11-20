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
         * @name openOntologySelect
         *
         * @description
         * The `openOntologySelect` module provides the `openOntologySelect` component which creates a selector for what
         * to open the current ontology at.
         */
        .module('openOntologySelect', [])
        /**
         * @ngdoc component
         * @name openOntologySelect.component:openOntologySelect
         * @requires catalogManager.service:catalogManagerService
         * @requires ontologyState.service:ontologyStateService
         * @requires prefixes.service:prefixes
         * @requires ontologyManager.service:ontologyManagerService
         * @requires util.service:utilService
         * @requires stateManager.service:stateManagerService
         * @requires modal.service:modalService
         *
         * @description
         * `openOntologySelect` is a component that creates a `ui-select` containing the branches of the current
         * {@link ontologyState.service:ontologyStateService listItem} and optionally the currently open commit. Each
         * branch in the `ui-select` has buttons for editing the metadata and deleting the branch which will open
         * a {@link confirmModal.directive:confirmModal}. The component also houses the method for opening a modal for
         * {@link editBranchOverlay.directive:editBranchOverlay editing a branch}.
         */
        .component('openOntologySelect', {
            controllerAs: 'dvm',
            controller: ['$scope', '$q', '$timeout', 'catalogManagerService', 'ontologyStateService', 'prefixes', 'ontologyManagerService', 'utilService', 'stateManagerService', 'modalService', OpenOntologySelectController],
            templateUrl: 'modules/ontology-editor/directives/openOntologySelect/openOntologySelect.html'
        });

        function OpenOntologySelectController($scope, $q, $timeout, catalogManagerService, ontologyStateService, prefixes, ontologyManagerService, utilService, stateManagerService, modalService) {
            var dvm = this;
            var sm = stateManagerService;
            var om = ontologyManagerService;

            dvm.os = ontologyStateService;
            dvm.cm = catalogManagerService;
            dvm.util = utilService;
            dvm.deleteError = '';
            dvm.state = sm.getOntologyStateByRecordId(dvm.os.listItem.ontologyRecord.recordId);
            dvm.selected = undefined;
            dvm.selectList = [];

            var currentStateId = '';

            var catalogId = _.get(dvm.cm.localCatalog, '@id', '');

            dvm.getGroupTitle = function(item) {
                if (dvm.cm.isBranch(item)) {
                    return 'Branches';
                } else if (dvm.cm.isCommit(item)) {
                    return 'Commits';
                } else {
                    return '(NONE)';
                }
            }
            dvm.getType = function(item) {
                if (dvm.cm.isBranch(item)) {
                    return 'Branch';
                } else if (dvm.cm.isCommit(item)) {
                    return 'Commit';
                } else {
                    return '(NONE)';
                }
            }
            dvm.changeEntity = function(item) {
                if (dvm.cm.isBranch(item)) {
                    var branchId = item['@id'];
                    var commitId = dvm.util.getPropertyId(_.find(dvm.state.model, {[prefixes.ontologyState + 'branch']: [{'@id': branchId}]}), prefixes.ontologyState + 'commit');
                    dvm.cm.getBranchHeadCommit(branchId, dvm.os.listItem.ontologyRecord.recordId, catalogId)
                        .then(headCommit => {
                            var headCommitId = _.get(headCommit, "commit['@id']", '');
                            if (!commitId) {
                                commitId = headCommitId;
                            }
                            return $q.all([
                                sm.updateOntologyState(dvm.os.listItem.ontologyRecord.recordId, commitId, branchId),
                                dvm.os.updateOntology(dvm.os.listItem.ontologyRecord.recordId, branchId, commitId, commitId === headCommitId)
                            ]);
                        }, $q.reject)
                        .then(() => {
                            setSelectList();
                            dvm.os.resetStateTabs();
                        }, dvm.util.createErrorToast);
                }
            }
            dvm.openDeleteConfirmation = function($event, branch) {
                $event.stopPropagation();
                dvm.branch = branch;
                var title = dvm.util.getDctermsValue(branch, 'title');
                var msg = '';
                if (dvm.cm.isUserBranch(branch)) {
                    msg += '<p>You have made diverging changes from the head of Branch: <strong>' + title + '</strong>. Continuing with this operation will only delete your diverging changes.</p>'
                }
                modalService.openConfirmModal(msg + '<p>Are you sure that you want to delete Branch: <strong>' + title + '</strong>?</p>', dvm.delete);
            }
            dvm.openEditOverlay = function($event, branch) {
                $event.stopPropagation();
                modalService.openModal('editBranchOverlay', {branch}, () => dvm.submit(branch));
            }
            dvm.delete = function() {
                om.deleteOntologyBranch(dvm.os.listItem.ontologyRecord.recordId, dvm.branch['@id'])
                    .then(() => {
                        dvm.os.removeBranch(dvm.os.listItem.ontologyRecord.recordId, dvm.branch['@id']);
                    }, dvm.util.createErrorToast);
            }
            dvm.submit = function(branch) {
                if (branch['@id'] === dvm.os.listItem.ontologyRecord.branchId) {
                    dvm.os.listItem.ontologyRecord.branchId = '';
                    $timeout(function() {
                        dvm.os.listItem.ontologyRecord.branchId = branch['@id'];
                    });
                }
            }

            dvm.$doCheck = function() {
                var recordState = _.find(dvm.state.model, {'@type': [prefixes.ontologyState + 'StateRecord']});
                var currentValue = _.get(recordState, "['" + prefixes.ontologyState + "currentState'][0]['@id']");
                if (currentStateId !== currentValue) {
                    currentStateId = currentValue;
                    setSelected();
                    setSelectList();
                }
            }

            function setSelected() {
                var currentState = _.find(dvm.state.model, {'@id': currentStateId});
                if (_.includes(_.get(currentState, '@type', []), prefixes.ontologyState + 'StateBranch')) {
                    dvm.selected = _.find(dvm.os.listItem.branches, {'@id': _.get(currentState, "['" + prefixes.ontologyState + "branch'][0]['@id']")});
                } else {
                    var commitId = _.get(currentState, "['" + prefixes.ontologyState + "commit'][0]['@id']");
                    dvm.selected = {
                        '@id': commitId,
                        '@type': [prefixes.catalog + 'Commit'],
                        [prefixes.dcterms + 'title']: [{'@value': dvm.util.condenseCommitId(commitId)}]
                    };
                }
            }
            function setSelectList() {
                if (dvm.cm.isBranch(dvm.selected)) {
                    dvm.selectList = dvm.os.listItem.branches;
                } else if (dvm.cm.isCommit(dvm.selected)) {
                    dvm.selectList = _.concat(dvm.os.listItem.branches, [dvm.selected]);
                } else {
                    dvm.selectList = [];
                }
            }
        }
})();
