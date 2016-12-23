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
        .module('branchSelect', [])
        .directive('branchSelect', branchSelect);

        branchSelect.$inject = ['catalogManagerService', 'ontologyStateService', 'utilService'];

        function branchSelect(catalogManagerService, ontologyStateService, utilService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/branchSelect/branchSelect.html',
                scope: {},
                bindToController: {
                    bindModel: '=ngModel'
                },
                controllerAs: 'dvm',
                controller: function($scope) {
                    var dvm = this;
                    var os = ontologyStateService;
                    var cm = catalogManagerService;
                    var catalogId = _.get(cm.localCatalog, '@id', '');

                    dvm.util = utilService;
                    dvm.list = [];
                    dvm.showDeleteConfirmation = false;

                    cm.getRecordBranches(os.listItem.recordId, catalogId)
                        .then(response => dvm.list = response.data);

                    dvm.openDeleteConfirmation = function($event, branchId) {
                        $event.stopPropagation();
                        dvm.branch = branch;
                        dvm.showDeleteConfirmation = true;
                    }

                    dvm.delete = function() {
                        cm.deleteRecordBranch(dvm.branch['@id'], os.listItem.recordId, catalogId)
                            .then(() => {
                                // TODO: make this the master branch
                                /*if (dvm.branch['@id'] === os.listItem.branchId) {
                                    os.listItem.branchId = master branch;
                                }*/
                            });
                    }
                }
            }
        }
})();
