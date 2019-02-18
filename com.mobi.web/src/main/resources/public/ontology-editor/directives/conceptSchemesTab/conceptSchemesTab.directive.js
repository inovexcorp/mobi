/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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
         * @name conceptSchemesTab
         *
         * @description
         * The `conceptSchemesTab` module only provides the `conceptSchemesTab` directive which creates a page for
         * viewing the concepts and concept schemes in an ontology/vocabulary.
         */
        .module('conceptSchemesTab', [])
        /**
         * @ngdoc directive
         * @name conceptSchemesTab.directive:conceptSchemesTab
         * @scope
         * @restrict E
         * @requires ontologyState.service:ontologyStateService
         * @requires ontologyManager.service:ontologyManagerService
         * @requires ontologyUtilsManager.service:ontologyUtilsManagerService
         * @requires propertyManager.service:propertyManagerService
         * @requires modal.service:modalService
         *
         * @description
         * `conceptSchemesTab` is a directive that creates a page containing the
         * {@link conceptSchemeHierarchyBlock.directive:conceptSchemeHierarchyBlock} of the current
         * {@link ontologyState.service:ontologyStateService selected ontology/vocabulary} and information about a
         * selected entity from that list. The selected entity display includes a
         * {@link selectedDetails.directive:selectedDetails}, a button to delete the entity, an
         * {@link annotationBlock.directive:annotationBlock}, a
         * {@link relationshipsBlock.directive:relationshipsBlock}, and a {@link usagesBlock.directive:usagesBlock}.
         * The directive houses the method for opening a modal for deleting concepts or concept schemes. The directive
         * is replaced by the contents of its template.
         */
        .directive('conceptSchemesTab', conceptSchemesTab);

        conceptSchemesTab.$inject = ['ontologyStateService', 'ontologyManagerService', 'ontologyUtilsManagerService', 'propertyManagerService', 'modalService'];

        function conceptSchemesTab(ontologyStateService, ontologyManagerService, ontologyUtilsManagerService, propertyManagerService, modalService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'ontology-editor/directives/conceptSchemesTab/conceptSchemesTab.directive.html',
                scope: {},
                controllerAs: 'dvm',
                controller: ['$scope', function($scope) {
                    var dvm = this;
                    var pm = propertyManagerService;
                    var ontoUtils = ontologyUtilsManagerService;
                    dvm.relationshipList = [];
                    dvm.om = ontologyManagerService;
                    dvm.os = ontologyStateService;


                    dvm.showDeleteConfirmation = function() {
                        modalService.openConfirmModal('<p>Are you sure that you want to delete <strong>' + dvm.os.listItem.selected['@id'] + '</strong>?</p>', dvm.deleteEntity);
                    }
                    dvm.deleteEntity = function() {
                        if (dvm.om.isConcept(dvm.os.listItem.selected, dvm.os.listItem.derivedConcepts)) {
                            ontoUtils.deleteConcept();
                        } else if (dvm.om.isConceptScheme(dvm.os.listItem.selected, dvm.os.listItem.derivedConceptSchemes)) {
                            ontoUtils.deleteConceptScheme();
                        }
                    }

                    $scope.$watch(() => dvm.os.listItem.selected, function(newValue) {
                        if (dvm.om.isConcept(dvm.os.listItem.selected, dvm.os.listItem.derivedConcepts)) {
                            var schemeRelationships = _.filter(pm.conceptSchemeRelationshipList, iri => _.includes(dvm.os.listItem.iriList, iri));
                            dvm.relationshipList = _.concat(dvm.os.listItem.derivedSemanticRelations, schemeRelationships);
                        } else if (dvm.om.isConceptScheme(dvm.os.listItem.selected, dvm.os.listItem.derivedConceptSchemes)) {
                            dvm.relationshipList = pm.schemeRelationshipList;
                        }
                    });
                }]
            }
        }
})();
