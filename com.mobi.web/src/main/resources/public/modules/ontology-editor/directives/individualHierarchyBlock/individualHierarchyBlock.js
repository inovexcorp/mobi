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
        .module('individualHierarchyBlock', [])
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
