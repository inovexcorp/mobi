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
        .module('mergeBlock', [])
        .directive('mergeBlock', mergeBlock);

        mergeBlock.$inject = ['utilService', 'ontologyStateService', 'catalogManagerService', '$q'];

        function mergeBlock(utilService, ontologyStateService, catalogManagerService, $q) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/mergeBlock/mergeBlock.html',
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

                    dvm.changeTarget = function() {
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
