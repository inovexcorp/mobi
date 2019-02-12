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
         * @name resolveConflictsBlock
         *
         * @description
         * The `resolveConflictsBlock` module only provides the `resolveConflictsBlock` directive which creates a
         * display for resolving conflicts between two branches of an ontology being merged together.
         */
        .module('resolveConflictsBlock', [])
        .config(['$qProvider', function($qProvider) {
            $qProvider.errorOnUnhandledRejections(false);
        }])
        /**
         * @ngdoc directive
         * @name resolveConflictsBlock.directive:resolveConflictsBlock
         * @scope
         * @restrict E
         * @requires util.service:utilService
         * @requires ontologyState.service:ontologyStateService
         *
         * @description
         * `resolveConflictsBlock` is a directive that creates a series of displays for resolving conflicts between the
         * current branch of the opened {@link ontologyState.service:ontologyStateService ontology} into a target
         * branch. The display includes information about the branches being merged, a
         * {@link resolveConflictsForm.directive:resolveConflictsForm}, a button to submit the merge, and a button to
         * cancel the merge. The directive calls the appropriate methods to merge with the selected resolutions from
         * the `resolveConflictsForm`. The directive is replaced by the contents of its template.
         */
        .directive('resolveConflictsBlock', resolveConflictsBlock);

        resolveConflictsBlock.$inject = ['utilService', 'ontologyStateService'];

        function resolveConflictsBlock(utilService, ontologyStateService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/resolveConflictsBlock/resolveConflictsBlock.html',
                scope: {},
                controllerAs: 'dvm',
                controller: ['$scope', function($scope) {
                    var dvm = this;
                    dvm.os = ontologyStateService;
                    dvm.util = utilService;
                    dvm.error = '';

                    var branch = _.find(dvm.os.listItem.branches, {'@id': dvm.os.listItem.ontologyRecord.branchId});
                    dvm.branchTitle = dvm.util.getDctermsValue(branch, 'title');
                    dvm.targetTitle = dvm.util.getDctermsValue(dvm.os.listItem.merge.target, 'title');

                    dvm.allResolved = function() {
                        return !_.some(dvm.os.listItem.merge.conflicts, {resolved: false});
                    }
                    dvm.submit = function() {
                        dvm.os.listItem.merge.resolutions = {
                            additions: [],
                            deletions: []
                        };
                        _.forEach(dvm.os.listItem.merge.conflicts, conflict => {
                            if (conflict.resolved === 'left') {
                                addToResolutions(conflict.right);
                            } else if (conflict.resolved === 'right') {
                                addToResolutions(conflict.left);
                            }
                        });
                        dvm.os.merge()
                            .then(() => {
                                dvm.os.resetStateTabs();
                                dvm.util.createSuccessToast('Your merge was successful with resolutions.');
                                dvm.os.cancelMerge();
                            }, error => dvm.error = error);
                    }

                    function addToResolutions(notSelected) {
                        if (notSelected.additions.length) {
                            dvm.os.listItem.merge.resolutions.deletions = _.concat(dvm.os.listItem.merge.resolutions.deletions, notSelected.additions);
                        } else {
                            dvm.os.listItem.merge.resolutions.additions = _.concat(dvm.os.listItem.merge.resolutions.additions, notSelected.deletions);
                        }
                    }
                }]
            }
        }
})();
