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

        mergeTab.$inject = ['$q', 'utilService', 'ontologyStateService', 'ontologyManagerService', 'catalogManagerService', 'prefixes'];

        function mergeTab($q, utilService, ontologyStateService, ontologyManagerService, catalogManagerService, prefixes) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/mergeTab/mergeTab.html',
                scope: {},
                controllerAs: 'dvm',
                controller: ['$scope', function($scope) {
                    var dvm = this;
                    var cm = catalogManagerService;
                    var om = ontologyManagerService;
                    var catalogId = _.get(cm.localCatalog, '@id', '');

                    dvm.os = ontologyStateService;
                    dvm.util = utilService;
                    dvm.branch = {};
                    dvm.error = '';
                    dvm.isUserBranch = false;

                    dvm.allResolved = function() {
                        return !_.some(dvm.os.listItem.merge.conflicts, {resolved: false});
                    }
                    dvm.attemptMerge = function() {
                        cm.getBranchConflicts(dvm.branch['@id'], dvm.os.listItem.merge.target['@id'], dvm.os.listItem.ontologyRecord.recordId, catalogId)
                            .then(conflicts => {
                                if (_.isEmpty(conflicts)) {
                                    dvm.merge();
                                } else {
                                    _.forEach(conflicts, conflict => {
                                        conflict.resolved = false;
                                        var obj = _.find(dvm.os.listItem.merge.conflicts, {iri: conflict.iri});
                                        if (_.isEmpty(obj)) {
                                            dvm.os.listItem.merge.conflicts.push(conflict);
                                        } else {
                                            _.merge(obj, conflict);
                                        }
                                    });
                                }
                            }, onError);
                    }
                    dvm.mergeWithResolutions = function() {
                        _.forEach(dvm.os.listItem.merge.conflicts, conflict => {
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
                        cm.mergeBranches(sourceId, dvm.os.listItem.merge.target['@id'], dvm.os.listItem.ontologyRecord.recordId, catalogId, dvm.os.listItem.merge.resolutions)
                            .then(commitId => dvm.os.updateOntology(dvm.os.listItem.ontologyRecord.recordId, dvm.os.listItem.merge.target['@id'], commitId), $q.reject)
                            .then(() => {
                                if (dvm.os.listItem.merge.checkbox) {
                                    om.deleteOntology(dvm.os.listItem.ontologyRecord.recordId, sourceId)
                                        .then(() => {
                                            dvm.os.removeBranch(dvm.os.listItem.ontologyRecord.recordId, sourceId);
                                            onSuccess();
                                        }, onError);
                                } else {
                                    onSuccess();
                                }
                            }, onError);
                    }
                    dvm.cancel = function() {
                        dvm.os.listItem.merge.active = false;
                        dvm.os.listItem.merge.target = undefined;
                        dvm.os.listItem.merge.checkbox = false;
                        dvm.os.listItem.merge.difference = undefined;
                        dvm.os.listItem.merge.conflicts = [];
                        dvm.os.listItem.merge.resolutions = {
                            additions: [],
                            deletions: []
                        };
                    }

                    function onSuccess() {
                        dvm.util.createSuccessToast('Your merge was successful.');
                        dvm.cancel();
                    }
                    function onError(errorMessage) {
                        dvm.error = errorMessage;
                    }
                    function setupVariables() {
                        dvm.branch = _.find(dvm.os.listItem.branches, {'@id': dvm.os.listItem.ontologyRecord.branchId});
                        if (_.includes(dvm.branch['@type'], prefixes.catalog + 'UserBranch')) {
                            if (!dvm.os.listItem.merge.target) {
                                dvm.os.listItem.merge.target = _.find(dvm.os.listItem.branches, {'@id': dvm.util.getPropertyId(dvm.branch, prefixes.catalog + 'createdFrom')});
                            }
                            dvm.isUserBranch = true;
                            dvm.os.listItem.merge.checkbox = true;
                        } else {
                            dvm.isUserBranch = false;
                        }
                    }
                    function addToResolutions(notSelected) {
                        dvm.os.listItem.merge.resolutions.additions = _.concat(dvm.os.listItem.merge.resolutions.additions, notSelected.deletions);
                        dvm.os.listItem.merge.resolutions.deletions = _.concat(dvm.os.listItem.merge.resolutions.deletions, notSelected.additions);
                    }

                    setupVariables();
                }]
            }
        }
})();
