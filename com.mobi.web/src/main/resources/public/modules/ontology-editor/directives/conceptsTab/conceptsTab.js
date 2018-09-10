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
         * @name conceptsTab
         *
         * @description
         * The `conceptsTab` module only provides the `conceptsTab` directive which creates a page for viewing the
         * concepts in an ontology/vocabulary.
         */
        .module('conceptsTab', [])
        /**
         * @ngdoc directive
         * @name conceptsTab.directive:conceptsTab
         * @scope
         * @restrict E
         * @requires ontologyState.service:ontologyStateService
         * @requires ontologyUtilsManager.service:ontologyUtilsManagerService
         * @requires propertyManager.service:propertyManagerService
         * @requires modal.service:modalService
         *
         * @description
         * `conceptsTab` is a directive that creates a page containing the
         * {@link conceptHierarchyBlock.directive:conceptHierarchyBlock} of the current
         * {@link ontologyState.service:ontologyStateService selected ontology/vocabulary} and information about a
         * selected concept from that list. The selected concept display includes a
         * {@link selectedDetails.directive:selectedDetails}, a button to delete the concept, an
         * {@link annotationBlock.directive:annotationBlock}, a
         * {@link relationshipsBlock.directive:relationshipsBlock}, and a {@link usagesBlock.directive:usagesBlock}.
         * The directive houses the method for opening a modal for deleting concepts. The directive is replaced by the
         * contents of its template.
         */
        .directive('conceptsTab', conceptsTab);

        conceptsTab.$inject = ['ontologyStateService', 'ontologyUtilsManagerService', 'propertyManagerService', 'modalService'];

        function conceptsTab(ontologyStateService, ontologyUtilsManagerService, propertyManagerService, modalService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/conceptsTab/conceptsTab.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    var pm = propertyManagerService;
                    var ontoUtils = ontologyUtilsManagerService;
                    dvm.os = ontologyStateService;

                    var schemeRelationships = _.filter(pm.conceptSchemeRelationshipList, iri => _.includes(dvm.os.listItem.iriList, iri));
                    dvm.relationshipList = _.concat(dvm.os.listItem.derivedSemanticRelations, schemeRelationships);

                    dvm.showDeleteConfirmation = function() {
                        modalService.openConfirmModal('<p>Are you sure that you want to delete <strong>' + dvm.os.listItem.selected['@id'] + '</strong>?</p>', ontoUtils.deleteConcept);
                    }
                }
            }
        }
})();
