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
        .module('conceptSchemeHierarchyBlock', [])
        .directive('conceptSchemeHierarchyBlock', conceptSchemeHierarchyBlock);

        conceptSchemeHierarchyBlock.$inject = ['ontologyStateService', 'ontologyManagerService', 'ontologyUtilsManagerService', 'modalService'];

        function conceptSchemeHierarchyBlock(ontologyStateService, ontologyManagerService, ontologyUtilsManagerService, modalService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/conceptSchemeHierarchyBlock/conceptSchemeHierarchyBlock.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    dvm.os = ontologyStateService;
                    dvm.om = ontologyManagerService
                    dvm.ontoUtils = ontologyUtilsManagerService;

                    dvm.showDeleteConfirmation = function() {
                        modalService.openConfirmModal('<p>Are you sure that you want to delete <strong>' + dvm.os.listItem.selected['@id'] + '</strong>?</p>', dvm.deleteEntity);
                    }
                    dvm.deleteEntity = function() {
                        if (dvm.om.isConcept(dvm.os.listItem.selected, dvm.os.listItem.derivedConcepts)) {
                            dvm.ontoUtils.deleteConcept();
                        } else if (dvm.om.isConceptScheme(dvm.os.listItem.selected, dvm.os.listItem.derivedConceptSchemes)) {
                            dvm.ontoUtils.deleteConceptScheme();
                        }
                    }
                    dvm.showCreateConceptSchemeOverlay = function() {
                        dvm.os.unSelectItem();
                        modalService.openModal('createConceptSchemeOverlay');
                    }
                }
            }
        }
})();
