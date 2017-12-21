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
        .module('objectPropertyBlock', [])
        .directive('objectPropertyBlock', objectPropertyBlock);

        objectPropertyBlock.$inject = ['ontologyStateService', 'ontologyUtilsManagerService'];

        function objectPropertyBlock(ontologyStateService, ontologyUtilsManagerService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/objectPropertyBlock/objectPropertyBlock.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    dvm.os = ontologyStateService;
                    dvm.ontoUtils = ontologyUtilsManagerService;
                    dvm.objectProperties = _.keys(dvm.os.listItem.objectProperties.iris);

                    dvm.openAddObjectPropOverlay = function() {
                        dvm.os.editingProperty = false;
                        dvm.os.propertySelect = undefined;
                        dvm.os.propertyValue = '';
                        dvm.os.propertyIndex = 0;
                        dvm.os.showObjectPropertyOverlay = true;
                    }
                    dvm.showRemovePropertyOverlay = function(key, index) {
                        dvm.key = key;
                        dvm.index = index;
                        dvm.showRemoveOverlay = true;
                    }
                    dvm.removeObjectProperty = function(axiomObject) {
                        var types = dvm.os.listItem.selected['@type'];
                        if (dvm.ontoUtils.containsDerivedConcept(types) || dvm.ontoUtils.containsDerivedConceptScheme(types)) {
                            dvm.ontoUtils.removeFromVocabularyHierarchies(dvm.key, axiomObject);
                        }
                    }
                }
            }
        }
})();
