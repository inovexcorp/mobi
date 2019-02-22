/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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
         * @name mergeBlock
         *
         * @description
         * The `mergeBlock` module only provides the `mergeBlock` directive which creates a form and display for
         * merging two branches of an ontology together.
         */
        .module('mergeBlock', [])
        /**
         * @ngdoc directive
         * @name mergeBlock.directive:mergeBlock
         * @scope
         * @restrict E
         * @requires shared.service:utilService
         * @requires shared.service:ontologyStateService
         * @requires shared.service:catalogManagerService
         *
         * @description
         * `mergeBlock` is a directive that creates a form for merging the current branch of the opened
         * {@link shared.service:ontologyStateService ontology} into another branch. The form contains a
         * {@link shared.component:branchSelect} for the target branch, a {@link shared.component:checkbox}
         * for indicating whether the source branch should be removed after the merge, a button to submit the merge,
         * and a button to cancel the merge. Once a target is selected, a
         * {@link shared.component:commitDifferenceTabset} is displayed. The form calls the appropriate
         * methods to check for conflicts before performing the merge. The directive is replaced by the contents of its
         * template.
         */
        .directive('mergeBlock', mergeBlock);

        mergeBlock.$inject = ['utilService', 'ontologyStateService', 'catalogManagerService', '$q'];

        function mergeBlock(utilService, ontologyStateService, catalogManagerService, $q) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'ontology-editor/directives/mergeBlock/mergeBlock.directive.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    var cm = catalogManagerService;
                    dvm.os = ontologyStateService;
                    dvm.util = utilService;

                    var catalogId = _.get(cm.localCatalog, '@id', '');
                    dvm.error = '';
                    dvm.branches = _.reject(dvm.os.listItem.branches, {'@id': dvm.os.listItem.ontologyRecord.branchId});
                    var branch = _.find(dvm.os.listItem.branches, {'@id': dvm.os.listItem.ontologyRecord.branchId});
                    dvm.branchTitle = dvm.util.getDctermsValue(branch, 'title');
                    dvm.targetHeadCommitId = undefined;

                    dvm.changeTarget = function(value) {
                        dvm.os.listItem.merge.target = value;
                        if (dvm.os.listItem.merge.target) {
                            cm.getBranchHeadCommit(dvm.os.listItem.merge.target['@id'], dvm.os.listItem.ontologyRecord.recordId, catalogId)
                                .then(target => {
                                    dvm.targetHeadCommitId = target.commit['@id'];
                                    return cm.getDifference(dvm.os.listItem.ontologyRecord.commitId, dvm.targetHeadCommitId);
                                    }, $q.reject)
                                .then( diff => {
                                    dvm.os.listItem.merge.difference = diff;
                                }, errorMessage => {
                                    dvm.util.createErrorToast(errorMessage);
                                    dvm.os.listItem.merge.difference = undefined;
                                });
                        } else {
                            dvm.os.listItem.merge.difference = undefined;
                        }
                    }
                    dvm.submit = function() {
                        dvm.os.attemptMerge()
                            .then(() => {
                                dvm.os.resetStateTabs();
                                dvm.util.createSuccessToast('Your merge was successful.');
                                dvm.os.cancelMerge();
                            }, error => dvm.error = error);
                    }

                    dvm.changeTarget();
                }
            }
        }
})();
