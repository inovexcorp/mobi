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
        .module('mergeTab', [])
        .directive('mergeTab', mergeTab);

        mergeTab.$inject = ['utilService', 'ontologyStateService', 'catalogManagerService', 'ontologyManagerService',
            'prefixes', 'stateManagerService'];

        function mergeTab(utilService, ontologyStateService, catalogManagerService, ontologyManagerService, prefixes,
            stateManagerService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/mergeTab/mergeTab.html',
                scope: {},
                controllerAs: 'dvm',
                controller: ['$scope', function($scope) {
                    var dvm = this;
                    var om = ontologyManagerService;
                    var cm = catalogManagerService;
                    var catalogId = _.get(cm.localCatalog, '@id', '');
                    var sm = stateManagerService;
                    var resolutions = {
                        additions: [],
                        deletions: []
                    };

                    dvm.os = ontologyStateService;
                    dvm.util = utilService;
                    dvm.branch = {};
                    dvm.branchTitle = '';
                    dvm.error = '';
                    dvm.targetId = undefined;
                    dvm.index = undefined;
                    dvm.isUserBranch = false;
                    dvm.checkbox = false;
                    dvm.conflicts = [];
                    dvm.selected = undefined;

                    dvm.attemptMerge = function() {
                        cm.getBranchConflicts(dvm.branch['@id'], dvm.targetId, dvm.os.listItem.recordId, catalogId)
                            .then(conflicts => {
                                if (_.isEmpty(conflicts)) {
                                    dvm.merge();
                                } else {
                                    _.forEach(conflicts, conflict => {
                                        conflict.resolved = false;
                                        var obj = _.find(dvm.conflicts, {iri: conflict.iri});
                                        if (_.isEmpty(obj)) {
                                            dvm.conflicts.push(conflict);
                                        } else {
                                            _.merge(obj, conflict);
                                        }
                                    });
                                }
                            }, onError);
                    }

                    dvm.mergeWithResolutions = function() {
                        _.forEach(dvm.conflicts, conflict => {
                            if (conflict.resolved === 'left') {
                                addToResolutions(conflict.left, conflict.right);
                            } else if (conflict.resolved === 'right') {
                                addToResolutions(conflict.right, conflict.left);
                            }
                        });
                        dvm.merge();
                    }

                    dvm.merge = function() {
                        cm.mergeBranches(dvm.branch['@id'], dvm.targetId, dvm.os.listItem.recordId, catalogId,
                            resolutions).then(commitId =>
                                om.updateOntology(dvm.os.listItem.recordId, dvm.targetId, commitId, dvm.os.state.type)
                                    .then(() => {
                                        if (dvm.checkbox) {
                                            cm.deleteRecordBranch(dvm.branch['@id'], dvm.os.listItem.recordId,
                                                catalogId).then(() => {
                                                    om.removeBranch(dvm.os.listItem.recordId, dvm.branch['@id']);
                                                    onSuccess();
                                                }, onError);
                                        } else {
                                            onSuccess();
                                        }
                                    }, onError), onError);
                    }

                    dvm.removeCurrent = function(branch) {
                        return branch['@id'] !== dvm.os.listItem.branchId;
                    }

                    dvm.allResolved = function() {
                        return _.findIndex(dvm.conflicts, {resolved: false}) === -1;
                    }

                    dvm.go = function($event, id) {
                        $event.stopPropagation();
                        dvm.os.goTo(id);
                    }

                    dvm.select = function(index) {
                        dvm.index = index;
                        dvm.selected = dvm.conflicts[dvm.index];
                    }

                    dvm.hasNext = function() {
                        return (dvm.index + 1) < dvm.conflicts.length;
                    }

                    dvm.getTargetTitle = function() {
                        var targetBranch = _.find(dvm.os.listItem.branches, branch => branch['@id'] === dvm.targetId);
                        return dvm.util.getDctermsValue(targetBranch, 'title');
                    }

                    dvm.backToList = function() {
                        dvm.index = undefined;
                        dvm.selected = undefined;
                    }

                    function onSuccess() {
                        dvm.targetId = undefined;
                        dvm.selected = undefined;
                        dvm.index = undefined;
                        resolutions = {
                            additions: [],
                            deletions: []
                        }
                        dvm.conflicts = [];
                        dvm.error = '';
                        dvm.targetId = undefined;
                        dvm.isUserBranch = false;
                        dvm.checkbox = false;
                    }

                    function onError(errorMessage) {
                        dvm.error = errorMessage;
                    }

                    function setupVariables() {
                        dvm.branch = _.find(dvm.os.listItem.branches, {'@id': dvm.os.listItem.branchId});
                        dvm.branchTitle = dvm.util.getDctermsValue(dvm.branch, 'title');
                        if (_.includes(dvm.branch['@type'], prefixes.catalog + 'UserBranch')) {
                            dvm.targetId = _.get(dvm.branch, "['" + prefixes.catalog + "createdFrom'][0]['@id']", '');
                            dvm.isUserBranch = true;
                            dvm.checkbox = true;
                        } else {
                            dvm.targetId = undefined;
                            dvm.isUserBranch = false;
                            dvm.checkbox = false;
                        }
                    }

                    function addToResolutions(selected, notSelected) {
                        resolutions.additions = _.concat(resolutions.additions, selected.additions,
                            notSelected.deletions);
                        resolutions.deletions = _.concat(resolutions.deletions, selected.deletions,
                            notSelected.additions);
                    }

                    $scope.$watch('dvm.os.listItem.branchId', setupVariables);
                }]
            }
        }
})();
