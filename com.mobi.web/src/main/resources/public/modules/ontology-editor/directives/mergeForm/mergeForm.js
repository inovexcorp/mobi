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
        .module('mergeForm', [])
        .directive('mergeForm', mergeForm);

        mergeForm.$inject = ['utilService', 'ontologyStateService', 'catalogManagerService'];

        function mergeForm(utilService, ontologyStateService, catalogManagerService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/mergeForm/mergeForm.html',
                scope: {},
                bindToController: {
                    branch: '<',
                    isUserBranch: '<',
                    targetId: '=',
                    removeBranch: '='
                },
                controllerAs: 'dvm',
                controller: ['$scope', function($scope) {
                    var dvm = this;
                    var cm = catalogManagerService;
                    var catalogId = _.get(cm.localCatalog, '@id', '');
                    dvm.os = ontologyStateService;
                    dvm.util = utilService;
                    dvm.difference = undefined;
                    dvm.tabs = {
                        changes: true,
                        commits: false
                    };

                    dvm.branchTitle = dvm.util.getDctermsValue(dvm.branch, 'title');

                    dvm.matchesCurrent = function(branch) {
                        return branch['@id'] !== dvm.os.listItem.ontologyRecord.branchId;
                    }
                    dvm.changeTarget = function() {
                        if (dvm.targetId) {
                            cm.getBranchDifference(dvm.os.listItem.ontologyRecord.branchId, dvm.targetId, dvm.os.listItem.ontologyRecord.recordId, catalogId)
                                .then(diff => {
                                    dvm.difference = diff;
                                }, errorMessage => {
                                    dvm.util.createErrorToast(errorMessage);
                                    dvm.difference = undefined;
                                });
                        } else {
                            dvm.difference = undefined;
                        }
                    }

                    dvm.changeTarget();
                }]
            }
        }
})();
