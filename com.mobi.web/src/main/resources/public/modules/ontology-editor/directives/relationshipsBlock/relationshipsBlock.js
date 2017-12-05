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
         * the relationships block within the ontology editor.
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
         * @requires prefixes.service:prefixes
         * @requires responseObj.service:responseObj
         *
         * @description
         * HTML contents in the relationships block with provides the users with a display of SKOS relationships
         * for the selected entity. A link to add additional relationships is also provided.
         *
         * @param {Object[]} relationshipList the list of relationships to display
         */
        .directive('relationshipsBlock', relationshipsBlock);

        relationshipsBlock.$inject = ['ontologyManagerService', 'ontologyStateService', 'ontologyUtilsManagerService', 'prefixes', 'responseObj'];

        function relationshipsBlock(ontologyManagerService, ontologyStateService, ontologyUtilsManagerService, prefixes, responseObj) {
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
                    var ro = responseObj;
                    dvm.om = ontologyManagerService;
                    dvm.os = ontologyStateService;
                    dvm.ontoUtils = ontologyUtilsManagerService;
                    dvm.showTopConceptOverlay = false;
                    dvm.showRemoveOverlay = false;

                    dvm.openRemoveOverlay = function(key, index) {
                        dvm.key = key;
                        dvm.index = index;
                        dvm.showRemoveOverlay = true;
                    }
                    dvm.updateHierarchy = function(relationship, values) {
                        dvm.ontoUtils.updateVocabularyHierarchies(ro.getItemIri(relationship), values);
                    }
                    dvm.removeFromHierarchy = function(axiomObject) {
                        dvm.ontoUtils.removeFromVocabularyHierarchies(dvm.key, axiomObject);
                    }
                    dvm.hasTopConceptProperty = function() {
                        return !_.isEmpty(dvm.os.getEntityByRecordId(dvm.os.listItem.ontologyRecord.recordId, prefixes.skos + 'hasTopConcept', dvm.os.listItem));
                    }
                }
            }
        }
})();
