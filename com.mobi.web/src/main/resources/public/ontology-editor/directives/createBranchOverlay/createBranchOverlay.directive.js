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
         * @name createBranchOverlay
         *
         * @description
         * The `createBranchOverlay` module only provides the `createBranchOverlay` directive which creates content
         * for a modal to create a branch on an ontology.
         */
        .module('createBranchOverlay', [])
        /**
         * @ngdoc directive
         * @name createBranchOverlay.directive:createBranchOverlay
         * @scope
         * @restrict E
         * @requires catalogManager.service:catalogManagerService
         * @requires ontologyState.service:ontologyStateService
         * @requires prefixes.service:prefixes
         *
         * @description
         * `createBranchOverlay` is a directive that creates content for a modal that creates a branch in the current
         * {@link ontologyState.service:ontologyStateService selected ontology}. The form in the modal contains a
         * {@link textInput.directive:textInput} for the branch title and a {@link textArea.directive:textArea} for the
         * branch description. Meant to be used in conjunction with the {@link modalService.directive:modalService}.
         *
         * @param {Function} close A function that closes the modal
         * @param {Function} dismiss A function that dismisses the modal
         */
        .directive('createBranchOverlay', createBranchOverlay);

        createBranchOverlay.$inject = ['$q', 'catalogManagerService', 'ontologyStateService', 'prefixes'];

        function createBranchOverlay($q, catalogManagerService, ontologyStateService, prefixes) {
            return {
                restrict: 'E',
                templateUrl: 'modules/ontology-editor/directives/createBranchOverlay/createBranchOverlay.directive.html',
                scope: {
                    dismiss: '&',
                    close: '&'
                },
                controllerAs: 'dvm',
                controller: ['$scope', function($scope) {
                    var dvm = this;
                    var cm = catalogManagerService;
                    var catalogId = _.get(cm.localCatalog, '@id', '');

                    dvm.os = ontologyStateService;
                    dvm.error = '';
                    dvm.branchConfig = {
                        title: '',
                        description: ''
                    };

                    dvm.create = function() {
                        if (dvm.branchConfig.description === '') {
                            _.unset(dvm.branchConfig, 'description');
                        }
                        var commitId;
                        cm.createRecordBranch(dvm.os.listItem.ontologyRecord.recordId, catalogId, dvm.branchConfig, dvm.os.listItem.ontologyRecord.commitId)
                        .then(branchId => cm.getRecordBranch(branchId, dvm.os.listItem.ontologyRecord.recordId, catalogId), $q.reject)
                        .then(branch => {
                            dvm.os.listItem.branches.push(branch);
                            dvm.os.listItem.ontologyRecord.branchId = branch['@id'];
                            commitId = branch[prefixes.catalog + 'head'][0]['@id'];
                            dvm.os.listItem.upToDate = true;
                            return dvm.os.updateOntologyState({recordId: dvm.os.listItem.ontologyRecord.recordId, commitId, branchId: dvm.os.listItem.ontologyRecord.branchId});
                        }, $q.reject)
                        .then(() => {
                            $scope.close();
                            dvm.os.resetStateTabs();
                        }, onError);
                    }
                    dvm.cancel = function() {
                        $scope.dismiss();
                    }

                    function onError(errorMessage) {
                        dvm.error = errorMessage;
                    }
                }]
            }
        }
})();
