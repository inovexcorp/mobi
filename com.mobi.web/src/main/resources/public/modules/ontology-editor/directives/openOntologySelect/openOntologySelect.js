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
         * branch which will open a {@link confirmModal.directive:confirmModal}. Each tag in the `ui-select` has a
         * button for deleting the tag which will open a {@link confirmModa.directive:confirmModal}. The component also
         * houses the method for opening a modal for
         * {@link editBranchOverlay.directive:editBranchOverlay editing a branch}.
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
            dvm.currentState = undefined;

            var catalogId = _.get(dvm.cm.localCatalog, '@id', '');

            dvm.canDelete = function(entity) {
                if (dvm.cm.isBranch(entity)) {
                    return _.get(entity, '@id') !== dvm.listItem.ontologyRecord.branchId && dvm.listItem.userCanModify;
                } else if (dvm.cm.isTag(entity)) {
                    return dvm.util.getPropertyId(dvm.currentState, prefixes.ontologyState + 'tag') !== _.get(entity, '@id') && dvm.listItem.userCanModify;
                } else {
                    return false;
                }
            }
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
            dvm.openDeleteConfirmation = function($event, entity) {
                $event.stopPropagation();
                var title = dvm.util.getDctermsValue(entity, 'title');
                if (dvm.cm.isBranch(entity)) {
                    var msg = '';
                    if (dvm.cm.isUserBranch(entity)) {
                        msg += '<p>You have made diverging changes from the head of Branch: <strong>' + title + '</strong>. Continuing with this operation will only delete your diverging changes.</p>'
                    }
                    modalService.openConfirmModal(msg + '<p>Are you sure that you want to delete Branch: <strong>' + title + '</strong>?</p>', () => dvm.deleteBranch(entity));
                } else if (dvm.cm.isTag(entity)) {
                    modalService.openConfirmModal('<p>Are you sure that you want to delete Tag: <strong>' + title + '</strong>?</p>', () => dvm.deleteTag(entity));
                }
            }
            dvm.openEditOverlay = function($event, branch) {
                $event.stopPropagation();
                modalService.openModal('editBranchOverlay', {branch}, () => dvm.submit(branch));
            }
            dvm.deleteBranch = function(branch) {
                om.deleteOntologyBranch(dvm.listItem.ontologyRecord.recordId, branch['@id'])
                    .then(() => {
                        dvm.os.removeBranch(dvm.listItem.ontologyRecord.recordId, branch['@id']);
                        if (!dvm.os.isStateBranch(dvm.currentState)) {
                            dvm.cm.getCommit(dvm.util.getPropertyId(dvm.currentState, prefixes.ontologyState + 'commit'))
                                .then(_.noop, error => {
                                    dvm.util.createWarningToast((dvm.os.isStateTag(dvm.currentState) ? 'Tag' : 'Commit') + ' no longer exists. Opening MASTER');
                                    dvm.changeEntity({'@id': dvm.listItem.masterBranchIRI, '@type': [prefixes.catalog + 'Branch']});
                                });
                        }
                        setSelectList();
                    }, dvm.util.createErrorToast);
            }
            dvm.deleteTag = function(tag) {
                dvm.cm.deleteRecordVersion(tag['@id'], dvm.listItem.ontologyRecord.recordId, catalogId)
                    .then(() => {
                        _.remove(dvm.listItem.tags, {'@id': tag['@id']});
                        setSelectList();
                    }, dvm.util.createErrorToast)
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
                var currentValue = dvm.util.getPropertyId(recordState, prefixes.ontologyState + 'currentState');
                if (dvm.currentStateId !== currentValue) {
                    dvm.currentStateId = currentValue;
                    dvm.currentState = _.find(dvm.state.model, {'@id': dvm.currentStateId});
                    setSelected();
                    setSelectList();
                }
            }

            function setSelected() {
                if (dvm.os.isStateBranch(dvm.currentState)) {
                    dvm.selected = _.find(dvm.listItem.branches, {'@id': dvm.util.getPropertyId(dvm.currentState, prefixes.ontologyState + 'branch')});
                } else if (dvm.os.isStateTag(dvm.currentState)) {
                    dvm.selected = _.find(dvm.listItem.tags, {'@id': dvm.util.getPropertyId(dvm.currentState, prefixes.ontologyState + 'tag')});
                } else {
                    var commitId = dvm.util.getPropertyId(dvm.currentState, prefixes.ontologyState + 'commit');
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
                    dvm.selectList = _.concat(dvm.listItem.branches, [dvm.selected], dvm.listItem.tags);
                } else {
                    dvm.selectList = [];
                }
            }
        }
})();
