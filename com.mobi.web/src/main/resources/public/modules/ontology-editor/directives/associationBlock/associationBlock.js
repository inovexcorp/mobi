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
         * @name associationBlock
         *
         * @description
         * The `associationBlock` module only provides the `associationBlock` directive which creates a
         * {@link block.directive:block} for displaying the classes and properties in an ontology.
         */
        .module('associationBlock', [])
        /**
         * @ngdoc directive
         * @name associationBlock.directive:associationBlock
         * @scope
         * @restrict E
         * @requires ontologyState.service:ontologyStateService
         * @requires ontologyManager.service:ontologyManagerService
         * @requires ontologyUtilsManager.service:ontologyUtilsManagerService
         * @requires modal.service:modalService
         *
         * @description
         * `associationBlock` is a directive that creates a {@link block.directive:block} that displays the
         * {@link everythingTree.directive:everythingTree} for the current
         * {@link ontologyState.service:ontologyStateService selected ontology} along with a button to delete an entity.
         * The directive houses the methods for opening the modal for deleting an entity. The directive is replaced by
         * the contents of its template.
         */
        .directive('associationBlock', associationBlock);

        associationBlock.$inject = ['ontologyStateService', 'ontologyManagerService', 'ontologyUtilsManagerService', 'modalService'];

        function associationBlock(ontologyStateService, ontologyManagerService, ontologyUtilsManagerService, modalService) {
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

                    dvm.showDeleteConfirmation = function() {
                        modalService.openConfirmModal('<p>Are you sure that you want to delete <strong>' + dvm.sm.listItem.selected['@id'] + '</strong>?</p>', dvm.deleteEntity);
                    }
                    dvm.deleteEntity = function() {
                        if (dvm.om.isClass(dvm.sm.listItem.selected)) {
                            dvm.utils.deleteClass();
                        } else if (dvm.om.isObjectProperty(dvm.sm.listItem.selected)) {
                            dvm.utils.deleteObjectProperty();
                        } else if (dvm.om.isDataTypeProperty(dvm.sm.listItem.selected)) {
                            dvm.utils.deleteDataTypeProperty();
                        }
                    }
                }
            }
        }
})();
