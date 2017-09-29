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
        .module('associationBlock', [])
        .directive('associationBlock', associationBlock);

        associationBlock.$inject = ['ontologyStateService', 'ontologyManagerService', 'ontologyUtilsManagerService'];

        function associationBlock(ontologyStateService, ontologyManagerService, ontologyUtilsManagerService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/associationBlock/associationBlock.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    dvm.sm = ontologyStateService;
                    dvm.om = ontologyManagerService;
                    dvm.utils = ontologyUtilsManagerService;

                    dvm.deleteEntity = function() {
                        if (dvm.om.isClass(dvm.sm.listItem.selected)) {
                            dvm.utils.deleteClass();
                        } else if (dvm.om.isObjectProperty(dvm.sm.listItem.selected)) {
                            dvm.utils.deleteObjectProperty();
                        } else if (dvm.om.isDataTypeProperty(dvm.sm.listItem.selected)) {
                            dvm.utils.deleteDataTypeProperty();
                        }
                        dvm.showDeleteConfirmation = false;
                    }
                }
            }
        }
})();
