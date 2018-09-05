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
        .module('conceptHierarchyBlock', [])
        .directive('conceptHierarchyBlock', conceptHierarchyBlock);

        conceptHierarchyBlock.$inject = ['ontologyStateService', 'ontologyUtilsManagerService', 'modalService'];

        function conceptHierarchyBlock(ontologyStateService, ontologyUtilsManagerService, modalService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/conceptHierarchyBlock/conceptHierarchyBlock.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    dvm.os = ontologyStateService;
                    dvm.ontoUtils = ontologyUtilsManagerService;

                    dvm.showDeleteConfirmation = function() {
                        modalService.openConfirmModal('<p>Are you sure that you want to delete <strong>' + dvm.os.listItem.selected['@id'] + '</strong>?</p>', dvm.ontoUtils.deleteConcept);
                    }
                    dvm.showCreateConceptOverlay = function() {
                        dvm.os.unSelectItem();
                        modalService.openModal('createConceptOverlay');
                    }
                }
            }
        }
})();
