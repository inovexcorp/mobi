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

        mergeTab.$inject = ['utilService', 'ontologyStateService', 'catalogManagerService', 'ontologyManagerService'];

        function mergeTab(utilService, ontologyStateService, catalogManagerService, ontologyManagerService) {
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

                    dvm.os = ontologyStateService;
                    dvm.util = utilService;
                    dvm.resolutions = {};
                    dvm.branch = {};
                    dvm.branchTitle = '';
                    dvm.error = '';
                    dvm.checkbox = false;

                    dvm.attemptMerge = function() {
                        cm.getBranchConflicts(dvm.branch['@id'], dvm.targetId, dvm.os.listItem.recordId, catalogId)
                            .then(conflicts => {
                                if (_.isEmpty(conflicts)) {
                                    dvm.merge();
                                } else {
                                    // TODO: resolve them
                                }
                            }, onError);
                    }

                    dvm.merge = function() {
                        cm.mergeBranches(dvm.branch['@id'], dvm.targetId, dvm.os.listItem.recordId, catalogId,
                            dvm.resolutions).then(commitId =>
                                om.changeBranch(dvm.os.listItem.ontologyId, dvm.os.listItem.recordId, dvm.targetId,
                                    commitId, dvm.os.state.type).then(() => {
                                        if (dvm.checkbox) {
                                            cm.deleteRecordBranch(dvm.branch['@id'], dvm.os.listItem.recordId,
                                                catalogId).then(() => {
                                                    om.removeBranch(dvm.os.listItem.recordId, dvm.branch['@id']);
                                                    onSuccess();
                                                }, onError)
                                        } else {
                                            onSuccess();
                                        }
                                    }, onError), onError);
                    }

                    dvm.removeCurrent = function(branch) {
                        return branch['@id'] !== dvm.os.listItem.branchId;
                    }

                    function onSuccess() {
                        dvm.targetId = undefined;
                    }

                    function onError(errorMessage) {
                        dvm.error = errorMessage;
                    }

                    function setupVariables() {
                        dvm.branch = _.find(dvm.os.listItem.branches, {'@id': dvm.os.listItem.branchId});
                        dvm.branchTitle = dvm.util.getDctermsValue(dvm.branch, 'title');
                        dvm.checkbox = false;
                    }

                    $scope.$watch('dvm.os.listItem.branchId', setupVariables);
                }]
            }
        }
})();
