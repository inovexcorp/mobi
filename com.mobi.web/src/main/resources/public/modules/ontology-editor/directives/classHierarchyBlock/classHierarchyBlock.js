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
         * @name classHierarchyBlock
         *
         * @description
         * The `classHierarchyBlock` module only provides the `classHierarchyBlock` directive which creates a
         * {@link block.directive:block} for displaying the classes in an ontology.
         */
        .module('classHierarchyBlock', [])
        /**
         * @ngdoc directive
         * @name classHierarchyBlock.directive:classHierarchyBlock
         * @scope
         * @restrict E
         * @requires ontologyState.service:ontologyStateService
         * @requires ontologyManager.service:ontologyManagerService
         * @requires ontologyUtilsManager.service:ontologyUtilsManagerService
         * @requires modal.service:modalService
         *
         * @description
         * `classHierarchyBlock` is a directive that creates a {@link block.directive:block} that displays a
         * {@link hierarchyTree.directive:hierarchyTree} of the clases in the current
         * {@link ontologyState.service:ontologyStateService selected ontology} along with buttons to add and delete
         * classes. The directive houses the methods for opening modals for
         * {@link createClassOverlay.directive:createClassOverlay adding} and deleting classes. The directive is
         * replaced by the contents of its template.
         */
        .directive('classHierarchyBlock', classHierarchyBlock);

        classHierarchyBlock.$inject = ['ontologyStateService', 'ontologyManagerService', 'ontologyUtilsManagerService', 'modalService'];

        function classHierarchyBlock(ontologyStateService, ontologyManagerService, ontologyUtilsManagerService, modalService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/classHierarchyBlock/classHierarchyBlock.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    dvm.os = ontologyStateService;
                    dvm.om = ontologyManagerService;
                    dvm.utils = ontologyUtilsManagerService;

                    dvm.showDeleteConfirmation = function() {
                        modalService.openConfirmModal('<p>Are you sure that you want to delete <strong>' + dvm.os.listItem.selected['@id'] + '</strong>?</p>', dvm.utils.deleteClass);
                    }
                    dvm.showCreateClassOverlay = function() {
                        dvm.os.unSelectItem();
                        modalService.openModal('createClassOverlay');
                    }
                }
            }
        }
})();
