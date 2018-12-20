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
         * @name savedChangesTab
         *
         * @description
         * The `savedChangesTab` module only provides the `savedChangesTab` directive which creates a page for viewing
         * the saved changes (aka inProgressCommit) of an ontology.
         */
        .module('savedChangesTab', [])
        /**
         * @ngdoc directive
         * @name savedChangesTab.directive:savedChangesTab
         * @scope
         * @restrict E
         * @requires ontologyState.service:ontologyStateService
         * @requires ontologyManager.service:ontologyManagerService
         * @requires util.service:utilService
         * @requires catalogManager.service:catalogManagerService
         * @requires prefixes.service:prefixes
         *
         * @description
         * `savedChangesTab` is a directive that creates a page that displays all the current users's saved changes
         * (aka inProgressCommit) of the current
         * {@link ontologyState.service:ontologyStateService selected ontology and branch}. The changes are grouped by
         * subject. The display will include a button to remove all the saved changes if there are any. If there are
         * no changes, an {@link infoMessage.directive:infoMessage} is shown stating as such. If the current branch is
         * not up to date and there are changes, an {@link errorDisplay.directive:errorDisplay} is shown. If there are
         * no changes and the current branch is not up to date, an `errorDisplay` is shown with a link to pull in the
         * latest changes. If there are no changes and the user is on a UserBranch then an `errorDisplay` is shown with
         * a lin to "pull changes" which will perform a merge of the UserBranch into the parent branch. If there are
         * no changes, the user is on a UserBranch, and the parent branch no longer exists, an `errorDisplay` is shown
         * with a link to restore the parent branch with the UserBranch. The directive is replaced by the contents of
         * its template.
         */
        .directive('savedChangesTab', savedChangesTab);

        savedChangesTab.$inject = ['$q', 'ontologyStateService', 'ontologyManagerService', 'utilService', 'catalogManagerService', 'prefixes'];

        function savedChangesTab($q, ontologyStateService, ontologyManagerService, utilService, catalogManagerService, prefixes) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/savedChangesTab/savedChangesTab.html',
                scope: {},
                controllerAs: 'dvm',
                controller: ['$scope', function($scope) {
                    var dvm = this;
                    var cm = catalogManagerService;
                    var om = ontologyManagerService;
                    var catalogId = _.get(cm.localCatalog, '@id', '');
                    var typeIRI = prefixes.rdf + 'type';
                    var types = [prefixes.owl + 'Class', prefixes.owl + 'ObjectProperty', prefixes.owl + 'DatatypeProperty', prefixes.owl + 'AnnotationProperty', prefixes.owl + 'NamedIndividual', prefixes.skos + 'Concept', prefixes.skos + 'ConceptScheme'];

                    dvm.os = ontologyStateService;
                    dvm.util = utilService;
                    dvm.list = [];
                    dvm.showList = getList();
                    dvm.checkedStatements = {
                        additions: [],
                        deletions: []
                    };

                    dvm.index = 0;
                    dvm.size = 100;

                    dvm.go = function($event, id) {
                        $event.stopPropagation();
                        dvm.os.goTo(id);
                    }
                    dvm.update = function() {
                        cm.getBranchHeadCommit(dvm.os.listItem.ontologyRecord.branchId, dvm.os.listItem.ontologyRecord.recordId, catalogId)
                            .then(headCommit => {
                                var commitId = _.get(headCommit, "commit['@id']", '');
                                return dvm.os.updateOntology(dvm.os.listItem.ontologyRecord.recordId, dvm.os.listItem.ontologyRecord.branchId, commitId);
                            }, $q.reject)
                            .then(() => dvm.util.createSuccessToast('Your ontology has been updated.'), dvm.util.createErrorToast);
                    }
                    dvm.restoreBranchWithUserBranch = function() {
                        var userBranchId = dvm.os.listItem.ontologyRecord.branchId;
                        var userBranch = _.find(dvm.os.listItem.branches, {'@id': userBranchId})
                        var createdFromId = dvm.util.getPropertyId(userBranch, prefixes.catalog + 'createdFrom');
                        var branchConfig = {
                            title: dvm.util.getDctermsValue(userBranch, 'title'),
                            description: dvm.util.getDctermsValue(userBranch, 'description')
                        };

                        var createdBranchId;
                        cm.createRecordBranch(dvm.os.listItem.ontologyRecord.recordId, catalogId, branchConfig, dvm.os.listItem.ontologyRecord.commitId)
                            .then(branchId => {
                                createdBranchId = branchId;
                                return cm.getRecordBranch(branchId, dvm.os.listItem.ontologyRecord.recordId, catalogId);
                            }, $q.reject)
                            .then(branch => {
                                dvm.os.listItem.branches.push(branch);
                                dvm.os.listItem.ontologyRecord.branchId = branch['@id'];
                                var commitId = dvm.util.getPropertyId(branch, prefixes.catalog + 'head');
                                return dvm.os.updateOntologyState({recordId: dvm.os.listItem.ontologyRecord.recordId, commitId, branchId: createdBranchId});
                            }, $q.reject)
                            .then(() => {
                                return om.deleteOntologyBranch(dvm.os.listItem.ontologyRecord.recordId, userBranchId);
                            }, $q.reject)
                            .then(() => {
                                dvm.os.removeBranch(dvm.os.listItem.ontologyRecord.recordId, userBranchId);
                                changeUserBranchesCreatedFrom(createdFromId, createdBranchId);
                                dvm.util.createSuccessToast('Branch has been restored with changes.');
                            }, dvm.util.createErrorToast);
                    }
                    dvm.mergeUserBranch = function() {
                        var branch = _.find(dvm.os.listItem.branches, {'@id': dvm.os.listItem.ontologyRecord.branchId});
                        dvm.os.listItem.merge.target = _.find(dvm.os.listItem.branches, {'@id': dvm.util.getPropertyId(branch, prefixes.catalog + 'createdFrom')});
                        dvm.os.listItem.merge.checkbox = true;
                        dvm.os.checkConflicts()
                            .then(() => {
                                dvm.os.merge()
                                    .then(() => {
                                        dvm.os.resetStateTabs();
                                        dvm.util.createSuccessToast('Changes have been pulled successfully');
                                        dvm.os.cancelMerge();
                                    }, () => {
                                        dvm.util.createErrorToast('Pulling changes failed');
                                        dvm.os.cancelMerge();
                                    });
                            }, () => dvm.os.listItem.merge.active = true);
                    }
                    dvm.removeChanges = function() {
                        cm.deleteInProgressCommit(dvm.os.listItem.ontologyRecord.recordId, catalogId)
                            .then(() => dvm.os.updateOntology(dvm.os.listItem.ontologyRecord.recordId, dvm.os.listItem.ontologyRecord.branchId, dvm.os.listItem.ontologyRecord.commitId, dvm.os.listItem.upToDate), $q.reject)
                            .then(() => dvm.os.clearInProgressCommit(), errorMessage => dvm.error = errorMessage);
                    }
                    dvm.orderByIRI = function(item) {
                        return dvm.util.getBeautifulIRI(item.id);
                    }
                    dvm.getMoreResults = function() {
                        dvm.index++;
                        var currChunk = _.get(dvm.chunks, dvm.index, []);
                        dvm.showList = _.concat(dvm.showList, currChunk);
                    }

                    $scope.$watchGroup(['dvm.os.listItem.inProgressCommit.additions', 'dvm.os.listItem.inProgressCommit.deletions'], () => {
                        var ids = _.unionWith(_.map(dvm.os.listItem.inProgressCommit.additions, '@id'), _.map(dvm.os.listItem.inProgressCommit.deletions, '@id'), _.isEqual);
                        dvm.list = _.map(ids, id => {
                            var additions = dvm.util.getChangesById(id, dvm.os.listItem.inProgressCommit.additions);
                            var deletions = dvm.util.getChangesById(id, dvm.os.listItem.inProgressCommit.deletions);

                            return {
                                id,
                                additions,
                                deletions,
                                disableAll: hasSpecificType(additions) || hasSpecificType(deletions)
                            }
                        });

                        dvm.list = _.sortBy(dvm.list, dvm.orderByIRI)
                        dvm.showList = getList();
                    });

                    function changeUserBranchesCreatedFrom(oldCreatedFromId, newCreatedFromId) {
                        _.forEach(dvm.os.listItem.branches, branch => {
                            if (cm.isUserBranch(branch)) {
                                var currentCreatedFromId = dvm.util.getPropertyId(branch, prefixes.catalog + 'createdFrom');
                                if (currentCreatedFromId === oldCreatedFromId) {
                                    dvm.util.replacePropertyId(branch, prefixes.catalog + 'createdFrom', dvm.util.getPropertyId(branch, prefixes.catalog + 'createdFrom'), newCreatedFromId);
                                    cm.updateRecordBranch(branch['@id'], dvm.os.listItem.ontologyRecord.recordId, catalogId, branch)
                                        .then(() => dvm.util.createSuccessToast('Updated referenced branch.'), dvm.util.createErrorToast);
                                }
                            }
                        });
                        dvm.os.listItem.upToDate = true;
                        dvm.os.listItem.userBranch = false;
                        dvm.os.listItem.createdFromExists = true;
                    }
                    function hasSpecificType(array) {
                        return !!_.intersection(_.map(_.filter(array, {p: typeIRI}), 'o'), types).length;
                    }
                    function getList() {
                        dvm.chunks = _.chunk(dvm.list, dvm.size);
                        return _.get(dvm.chunks, dvm.index, []);
                    }
                }]
            }
        }
})();
