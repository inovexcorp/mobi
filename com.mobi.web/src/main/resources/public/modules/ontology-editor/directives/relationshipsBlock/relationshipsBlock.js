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
         * @name relationshipsBlock
         *
         * @description
         * The `relationshipsBlock` module only provides the `relationshipsBlock` directive which creates
         * {@link block.directive:block} for displaying the relationships on a concept or concept scheme.
         */
        .module('relationshipsBlock', [])
        /**
         * @ngdoc directive
         * @name relationshipsBlock.directive:relationshipsBlock
         * @scope
         * @restrict E
         * @requires ontologyManager.service:ontologyManagerService
         * @requires ontologyState.service:ontologyStateService
         * @requires ontologyUtilsManager.service:ontologyUtilsManagerService
         * @requires modal.service:modalService
         * @requires prefixes.service:prefixes
         *
         * @description
         * `annotationBlock` is a directive that creates a {@link block.directive:block} that displays the
         * SKOS relationships on the
         * {@link ontologyState.service:ontologyStateService selected concept or concept scheme} using
         * {@link propertyValues.directive:propertyValues}. If the selected entity is a concept, the `block` contains a
         * button to {@link relationshipOverlay.directive:relationshipOverlay add a relationship}. If the selected
         * entity is a concept scheme, the `block` contains a button to
         * {@link topConceptOverlay.directive:topConceptOverlay add a top concept}. The directive is replaced by the
         * contents of its template.
         *
         * @param {Object[]} relationshipList the list of relationships to display
         */
        .directive('relationshipsBlock', relationshipsBlock);

        relationshipsBlock.$inject = ['ontologyManagerService', 'ontologyStateService', 'ontologyUtilsManagerService', 'modalService', 'prefixes'];

        function relationshipsBlock(ontologyManagerService, ontologyStateService, ontologyUtilsManagerService, modalService, prefixes) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/relationshipsBlock/relationshipsBlock.html',
                scope: {},
                bindToController: {
                    relationshipList: '='
                },
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    dvm.om = ontologyManagerService;
                    dvm.os = ontologyStateService;
                    dvm.ontoUtils = ontologyUtilsManagerService;
                    dvm.showTopConceptOverlay = false;
                    dvm.showRemoveOverlay = false;

                    dvm.showRelationshipOverlay = function() {
                        modalService.openModal('relationshipOverlay', {relationshipList: dvm.relationshipList}, dvm.updateHierarchy);
                    }
                    dvm.openRemoveOverlay = function(key, index) {
                        dvm.key = key;
                        modalService.openConfirmModal(dvm.ontoUtils.getRemovePropOverlayMessage(key, index), () => {
                            dvm.ontoUtils.removeProperty(key, index).then(dvm.removeFromHierarchy);
                        });
                    }
                    dvm.updateHierarchy = function(updatedRelationshipObj) {
                        dvm.ontoUtils.updateVocabularyHierarchies(updatedRelationshipObj.relationship, updatedRelationshipObj.values);
                    }
                    dvm.removeFromHierarchy = function(axiomObject) {
                        dvm.ontoUtils.removeFromVocabularyHierarchies(dvm.key, axiomObject);
                    }
                    dvm.hasTopConceptProperty = function() {
                        return !_.isEmpty(dvm.os.getEntityByRecordId(dvm.os.listItem.ontologyRecord.recordId, prefixes.skos + 'hasTopConcept', dvm.os.listItem));
                    }
                    dvm.showTopConceptOverlay = function() {
                        modalService.openModal('topConceptOverlay', {}, dvm.updateHierarchy);
                    }
                }
            }
        }
})();
