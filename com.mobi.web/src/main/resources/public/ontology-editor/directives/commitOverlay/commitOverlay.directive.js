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
         * @name commitOverlay
         *
         * @description
         * The `commitOverlay` module only provides the `commitOverlay` directive which creates content
         * for a modal to commit changes to an ontology.
         */
        .module('commitOverlay', [])
        .config(ignoreUnhandledRejectionsConfig)
        /**
         * @ngdoc directive
         * @name commitOverlay.directive:commitOverlay
         * @scope
         * @restrict E
         * @requires ontologyState.service:ontologyStateService
         * @requires catalogManager.service:catalogManagerService
         * @requires util.service:utilService
         *
         * @description
         * `commitOverlay` is a directive that creates content for a modal to commit the changes to the
         * {@link ontologyState.service:ontologyStateService selected ontology}. The form in the modal contains a
         * {@link textArea.directive:textArea} for the commit message. Meant to be used in conjunction with the
         * {@link modalService.directive:modalService}.
         *
         * @param {Function} close A function that closes the modal
         * @param {Function} dismiss A function that dismisses the modal
         */
        .directive('commitOverlay', commitOverlay);

        commitOverlay.$inject = ['$q', 'ontologyStateService', 'catalogManagerService', 'utilService'];

        function commitOverlay($q, ontologyStateService, catalogManagerService, utilService) {
            return {
                restrict: 'E',
                templateUrl: 'modules/ontology-editor/directives/commitOverlay/commitOverlay.directive.html',
                scope: {
                    close: '&',
                    dismiss: '&'
                },
                controllerAs: 'dvm',
                controller: ['$scope', function($scope) {
                    var dvm = this;
                    var cm = catalogManagerService;
                    var catalogId = _.get(cm.localCatalog, '@id', '');
                    var util = utilService;

                    dvm.os = ontologyStateService;
                    dvm.error = '';

                    dvm.commit = function() {
                        if (dvm.os.listItem.upToDate) {
                            createCommit(dvm.os.listItem.ontologyRecord.branchId);
                        } else {
                            var branch = _.find(dvm.os.listItem.branches, {'@id': dvm.os.listItem.ontologyRecord.branchId});
                            var branchConfig = {title: util.getDctermsValue(branch, 'title')};
                            var description = util.getDctermsValue(branch, 'description');
                            if (description) {
                                branchConfig.description = description;
                            }
                            var branchId;
                            cm.createRecordUserBranch(dvm.os.listItem.ontologyRecord.recordId, catalogId, branchConfig, dvm.os.listItem.ontologyRecord.commitId, dvm.os.listItem.ontologyRecord.branchId)
                                .then(branchIri => {
                                    branchId = branchIri;
                                    return cm.getRecordBranch(branchId, dvm.os.listItem.ontologyRecord.recordId, catalogId);
                                }, $q.reject)
                                .then(branch => {
                                    dvm.os.listItem.branches.push(branch);
                                    dvm.os.listItem.ontologyRecord.branchId = branch['@id'];
                                    dvm.os.listItem.upToDate = true;
                                    dvm.os.listItem.userBranch = true;
                                    createCommit(branch['@id']);
                                }, onError);
                        }
                    }
                    dvm.cancel = function() {
                        $scope.dismiss();
                    }

                    function onError(errorMessage) {
                        dvm.error = errorMessage;
                    }

                    function createCommit(branchId) {
                        var commitId;
                        cm.createBranchCommit(branchId, dvm.os.listItem.ontologyRecord.recordId, catalogId, dvm.comment)
                            .then(commitIri => {
                                commitId = commitIri;
                                return dvm.os.updateOntologyState({recordId: dvm.os.listItem.ontologyRecord.recordId, commitId, branchId});
                            }, $q.reject)
                            .then(() => {
                                dvm.os.listItem.ontologyRecord.branchId = branchId;
                                dvm.os.listItem.ontologyRecord.commitId = commitId;
                                dvm.os.clearInProgressCommit();
                                $scope.close();
                            }, onError);
                    }
                }]
            }
        }
})();
