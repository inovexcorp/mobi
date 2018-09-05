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
         * @name individualHierarchyBlock
         *
         * @description
         * The `individualHierarchyBlock` module only provides the `individualHierarchyBlock` directive which creates a
         * {@link block.directive:block} for displaying the individuals in an ontology.
         */
        .module('individualHierarchyBlock', [])
        /**
         * @ngdoc directive
         * @name individualHierarchyBlock.directive:individualHierarchyBlock
         * @scope
         * @restrict E
         * @requires ontologyState.service:ontologyStateService
         * @requires ontologyUtilsManager.service:ontologyUtilsManagerService
         * @requires modal.service:modalService
         *
         * @description
         * `individualHierarchyBlock` is a directive that creates a {@link block.directive:block} that displays a
         * {@link hierarchyTree.directive:hierarchyTree} of the individuals in the current
         * {@link ontologyState.service:ontologyStateService selected ontology} underneath their class types. The
         * `block` also has buttons to add and delete individuals. The directive houses the methods for opening modals
         * for {@link createIndividualOverlay.directive:createIndividualOverlay adding} and deleting individuals. The
         * directive is replaced by the contents of its template.
         */
        .directive('individualHierarchyBlock', individualHierarchyBlock);

        individualHierarchyBlock.$inject = ['ontologyStateService', 'ontologyUtilsManagerService', 'modalService'];

        function individualHierarchyBlock(ontologyStateService, ontologyUtilsManagerService, modalService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/individualHierarchyBlock/individualHierarchyBlock.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    dvm.sm = ontologyStateService;
                    dvm.utils = ontologyUtilsManagerService;

                    dvm.showDeleteConfirmation = function() {
                        modalService.openConfirmModal('<p>Are you sure that you want to delete <strong>' + dvm.sm.listItem.selected['@id'] + '</strong>?</p>', dvm.utils.deleteIndividual);
                    }
                    dvm.showCreateIndividualOverlay = function() {
                        dvm.sm.unSelectItem();
                        modalService.openModal('createIndividualOverlay');
                    }
                }
            }
        }
})();
