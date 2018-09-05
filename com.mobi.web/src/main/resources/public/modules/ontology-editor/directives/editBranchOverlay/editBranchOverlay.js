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
        .module('editBranchOverlay', [])
        .directive('editBranchOverlay', editBranchOverlay);

        editBranchOverlay.$inject = ['catalogManagerService', 'ontologyStateService', 'prefixes', 'utilService'];

        function editBranchOverlay(catalogManagerService, ontologyStateService, prefixes, utilService) {
            return {
                restrict: 'E',
                templateUrl: 'modules/ontology-editor/directives/editBranchOverlay/editBranchOverlay.html',
                scope: {
                    resolve: '<',
                    close: '&',
                    dismiss: '&'
                },
                controllerAs: 'dvm',
                controller: ['$scope', function($scope) {
                    var dvm = this;
                    var cm = catalogManagerService;
                    var os = ontologyStateService;
                    var util = utilService;
                    var catalogId = _.get(cm.localCatalog, '@id', '');

                    dvm.error = '';
                    dvm.branchTitle = util.getDctermsValue($scope.resolve.branch, 'title');
                    dvm.branchDescription = util.getDctermsValue($scope.resolve.branch, 'description');

                    dvm.edit = function() {
                        util.updateDctermsValue($scope.resolve.branch, 'title', dvm.branchTitle);
                        if (dvm.branchDescription === '') {
                            _.unset($scope.resolve.branch, prefixes.dcterms + 'description');
                        } else {
                            util.updateDctermsValue($scope.resolve.branch, 'description', dvm.branchDescription);
                        }
                        cm.updateRecordBranch($scope.resolve.branch['@id'], os.listItem.ontologyRecord.recordId, catalogId, $scope.resolve.branch)
                            .then(() => {
                                $scope.close();
                            }, errorMessage => dvm.error = errorMessage);
                    }
                    dvm.cancel = function() {
                        $scope.dismiss();
                    }
                }]
            }
        }
})();
