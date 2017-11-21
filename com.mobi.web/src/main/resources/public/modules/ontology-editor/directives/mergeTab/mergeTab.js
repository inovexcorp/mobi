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
        .module('mergeTab', [])
        .directive('mergeTab', mergeTab);

        mergeTab.$inject = ['$q', 'utilService', 'ontologyStateService', 'catalogManagerService', 'prefixes'];

        function mergeTab($q, utilService, ontologyStateService, catalogManagerService, prefixes) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/mergeTab/mergeTab.html',
                scope: {},
                controllerAs: 'dvm',
                controller: ['$scope', function($scope) {
                    var dvm = this;
                    var cm = catalogManagerService;
                    var catalogId = _.get(cm.localCatalog, '@id', '');

                    dvm.os = ontologyStateService;
                    dvm.util = utilService;
                    dvm.resolutions = {
                        additions: [],
                        deletions: []
                    };
                    dvm.branch = {};
                    dvm.branchTitle = '';
                    dvm.error = '';
                    dvm.targetId = undefined;
                    dvm.isUserBranch = false;
                    dvm.checkbox = false;
                    dvm.conflicts = [];

                    dvm.allResolved = function() {
                        return _.findIndex(dvm.conflicts, {resolved: false}) === -1;
                    }
                    dvm.attemptMerge = function() {
                        cm.getBranchConflicts(dvm.branch['@id'], dvm.targetId, dvm.os.listItem.ontologyRecord.recordId, catalogId)
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
                                addToResolutions(conflict.right);
                            } else if (conflict.resolved === 'right') {
                                addToResolutions(conflict.left);
                            }
                        });
                        dvm.merge();
                    }
                    dvm.merge = function() {
                        var sourceId = angular.copy(dvm.branch['@id']);
                        cm.mergeBranches(sourceId, dvm.targetId, dvm.os.listItem.ontologyRecord.recordId, catalogId, dvm.resolutions)
                            .then(commitId => dvm.os.updateOntology(dvm.os.listItem.ontologyRecord.recordId, dvm.targetId, commitId), $q.reject)
                            .then(() => {
                                if (dvm.checkbox) {
                                    cm.deleteRecordBranch(sourceId, dvm.os.listItem.ontologyRecord.recordId, catalogId)
                                        .then(() => {
                                            dvm.os.removeBranch(dvm.os.listItem.ontologyRecord.recordId, sourceId);
                                            onSuccess();
                                        }, onError);
                                } else {
                                    onSuccess();
                                }
                            }, onError);
                    }
                    dvm.getTargetTitle = function() {
                        var targetBranch = _.find(dvm.os.listItem.branches, branch => branch['@id'] === dvm.targetId);
                        return dvm.util.getDctermsValue(targetBranch, 'title');
                    }

                    function onSuccess() {
                        dvm.util.createSuccessToast('Your merge was successful.');
                        dvm.os.listItem.merge = false;
                    }
                    function onError(errorMessage) {
                        dvm.error = errorMessage;
                    }
                    function setupVariables() {
                        dvm.branch = _.find(dvm.os.listItem.branches, {'@id': dvm.os.listItem.ontologyRecord.branchId});
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
                    function addToResolutions(notSelected) {
                        dvm.resolutions.additions = _.concat(dvm.resolutions.additions, notSelected.deletions);
                        dvm.resolutions.deletions = _.concat(dvm.resolutions.deletions, notSelected.additions);
                    }

                    setupVariables();
                }]
            }
        }
})();
