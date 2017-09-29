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
        .module('editBranchOverlay', [])
        .directive('editBranchOverlay', editBranchOverlay);

        editBranchOverlay.$inject = ['catalogManagerService', 'ontologyStateService', 'prefixes', 'utilService'];

        function editBranchOverlay(catalogManagerService, ontologyStateService, prefixes, utilService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/editBranchOverlay/editBranchOverlay.html',
                scope: {},
                bindToController: {
                    branch: '=',
                    overlayFlag: '='
                },
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    var cm = catalogManagerService;
                    var os = ontologyStateService;
                    var util = utilService;
                    var catalogId = _.get(cm.localCatalog, '@id', '');

                    dvm.error = '';
                    dvm.branchTitle = util.getDctermsValue(dvm.branch, 'title');
                    dvm.branchDescription = util.getDctermsValue(dvm.branch, 'description');

                    dvm.edit = function() {
                        util.setDctermsValue(dvm.branch, 'title', dvm.branchTitle);
                        if (dvm.branchDescription === '') {
                            _.unset(dvm.branch, prefixes.dcterms + 'description');
                        } else {
                            util.setDctermsValue(dvm.branch, 'description', dvm.branchDescription);
                        }
                        cm.updateRecordBranch(dvm.branch['@id'], os.listItem.ontologyRecord.recordId, catalogId, dvm.branch)
                            .then(() => dvm.overlayFlag = false, errorMessage => dvm.error = errorMessage);
                    }
                }
            }
        }
})();
