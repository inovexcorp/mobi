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
         * @requires modal.service:modalService
         *
         * @description
         * `openOntologySelect` is a component that creates a `ui-select` containing the branches and tags of the
         * provided {@link ontologyState.service:ontologyStateService listItem} and depending on the provided state, the
         * currently open commit. Each branch in the `ui-select` has buttons for editing the metadata and deleting the
         * branch which will open a {@link confirmModal.directive:confirmModal}. The component also houses the method
         * for opening a modal for {@link editBranchOverlay.directive:editBranchOverlay editing a branch}. Each tag in
         * the `ui-select` has a button for deleting the tag which will open a
         * {@link confirmModal.directive:confirmModal}.
         *
         * @param {Object} listItem An item from the `list` in ontologyStateService
         * @param {Object} state An item from the `states` in stateManagerService
         */
        .component('openOntologySelect', {
            bindings: {
                listItem: '=',
                state: '='
            },
            controllerAs: 'dvm',
            controller: ['$scope', '$q', '$timeout', 'catalogManagerService', 'ontologyStateService', 'prefixes', 'ontologyManagerService', 'utilService', 'modalService', OpenOntologySelectController],
            templateUrl: 'modules/ontology-editor/directives/openOntologySelect/openOntologySelect.html'
        });

        function OpenOntologySelectController($scope, $q, $timeout, catalogManagerService, ontologyStateService, prefixes, ontologyManagerService, utilService, modalService) {
            var dvm = this;
            var om = ontologyManagerService;

            dvm.os = ontologyStateService;
            dvm.cm = catalogManagerService;
            dvm.util = utilService;
            dvm.deleteError = '';
            dvm.selected = undefined;
            dvm.selectList = [];

            dvm.currentStateId = '';

            var catalogId = _.get(dvm.cm.localCatalog, '@id', '');

            dvm.getGroupTitle = function(item) {
                if (dvm.cm.isBranch(item)) {
                    return 'Branches';
                } else if (dvm.cm.isTag(item)) {
                    return 'Tags';
                } else if (dvm.cm.isCommit(item)) {
                    return 'Commits';
                } else {
                    return '(NONE)';
                }
            }
            dvm.getType = function(item) {
                if (dvm.cm.isBranch(item)) {
                    return 'Branch';
                } else if (dvm.cm.isTag(item)) {
                    return 'Tag';
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
                    dvm.cm.getBranchHeadCommit(branchId, dvm.listItem.ontologyRecord.recordId, catalogId)
                        .then(headCommit => {
                            var headCommitId = _.get(headCommit, "commit['@id']", '');
                            if (!commitId) {
                                commitId = headCommitId;
                            }
                            return dvm.os.updateOntology(dvm.listItem.ontologyRecord.recordId, branchId, commitId, commitId === headCommitId);
                        }, $q.reject)
                        .then(() => {
                            setSelectList();
                            dvm.os.resetStateTabs(dvm.listItem);
                        }, dvm.util.createErrorToast);
                } else if (dvm.cm.isTag(item)) {
                    var tagId = item['@id'];
                    var commitId = dvm.util.getPropertyId(item, prefixes.catalog + 'commit');
                    dvm.cm.getCommit(commitId)
                        .then(commit => dvm.os.updateOntologyWithCommit(dvm.listItem.ontologyRecord.recordId, commitId, tagId), $q.reject)
                        .then(() => {
                            setSelectList();
                            dvm.os.resetStateTabs(dvm.listItem);
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
                om.deleteOntologyBranch(dvm.listItem.ontologyRecord.recordId, dvm.branch['@id'])
                    .then(() => {
                        dvm.os.removeBranch(dvm.listItem.ontologyRecord.recordId, dvm.branch['@id']);
                        var currentState = _.find(dvm.state.model, {'@id': dvm.currentStateId});
                        if (_.isEqual(_.get(currentState, '@type', []), [prefixes.ontologyState + 'StateCommit'])) {
                            dvm.cm.getCommit(_.get(currentState, "['" + prefixes.ontologyState + "commit'][0]['@id']"))
                                .then(_.noop, error => {
                                    dvm.util.createWarningToast('Commit no longer exists. Opening MASTER');
                                    dvm.changeEntity({'@id': dvm.listItem.masterBranchIRI, '@type': [prefixes.catalog + 'Branch']});
                                });
                        }
                        setSelectList();
                    }, dvm.util.createErrorToast);
            }
            dvm.submit = function(branch) {
                if (branch['@id'] === dvm.listItem.ontologyRecord.branchId) {
                    dvm.listItem.ontologyRecord.branchId = '';
                    $timeout(function() {
                        dvm.listItem.ontologyRecord.branchId = branch['@id'];
                    });
                }
            }

            dvm.$doCheck = function() {
                var recordState = _.find(_.get(dvm.state, 'model', []), {'@type': [prefixes.ontologyState + 'StateRecord']});
                var currentValue = _.get(recordState, "['" + prefixes.ontologyState + "currentState'][0]['@id']", '');
                if (dvm.currentStateId !== currentValue) {
                    dvm.currentStateId = currentValue;
                    setSelected();
                    setSelectList();
                }
            }

            function setSelected() {
                var currentState = _.find(dvm.state.model, {'@id': dvm.currentStateId});
                if (_.includes(_.get(currentState, '@type', []), prefixes.ontologyState + 'StateBranch')) {
                    dvm.selected = _.find(dvm.listItem.branches, {'@id': _.get(currentState, "['" + prefixes.ontologyState + "branch'][0]['@id']")});
                } else if (_.includes(_.get(currentState, '@type', []), prefixes.ontologyState + 'StateTag')) {
                    dvm.selected = _.find(dvm.listItem.tags, {'@id': _.get(currentState, "['" + prefixes.ontologyState + "tag'][0]['@id']")});
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
                if (dvm.cm.isBranch(dvm.selected) || dvm.cm.isTag(dvm.selected)) {
                    dvm.selectList = _.concat(dvm.listItem.branches, dvm.listItem.tags);
                } else if (dvm.cm.isCommit(dvm.selected)) {
                    dvm.selectList = _.concat(dvm.listItem.branches, dvm.listItem.tags, [dvm.selected]);
                } else {
                    dvm.selectList = [];
                }
            }
        }
})();
