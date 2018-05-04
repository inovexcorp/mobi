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
                    target: '=',
                    removeBranch: '='
                },
                controllerAs: 'dvm',
                controller: ['$scope', function($scope) {
                    var dvm = this;
                    var cm = catalogManagerService;
                    var catalogId = _.get(cm.localCatalog, '@id', '');
                    dvm.os = ontologyStateService;
                    dvm.util = utilService;
                    dvm.tabs = {
                        changes: true,
                        commits: false
                    };

                    dvm.branchTitle = dvm.util.getDctermsValue(dvm.branch, 'title');

                    dvm.matchesCurrent = function(branch) {
                        return branch['@id'] !== dvm.branch['@id'];
                    }
                    dvm.changeTarget = function() {
                        if (dvm.target) {
                            cm.getBranchDifference(dvm.branch['@id'], dvm.target['@id'], dvm.os.listItem.ontologyRecord.recordId, catalogId)
                                .then(diff => {
                                    dvm.os.listItem.merge.difference = diff;
                                }, errorMessage => {
                                    dvm.util.createErrorToast(errorMessage);
                                    dvm.os.listItem.merge.difference = undefined;
                                });
                        } else {
                            dvm.os.listItem.merge.difference = undefined;
                        }
                    }

                    dvm.changeTarget();
                }]
            }
        }
})();
