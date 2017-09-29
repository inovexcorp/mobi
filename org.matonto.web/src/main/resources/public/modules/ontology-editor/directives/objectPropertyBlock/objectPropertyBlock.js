/*-
 * #%L
 * org.matonto.web
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

        objectPropertyBlock.$inject = ['ontologyStateService', 'responseObj', 'ontologyUtilsManagerService'];

        function objectPropertyBlock(ontologyStateService, responseObj, ontologyUtilsManagerService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/objectPropertyBlock/objectPropertyBlock.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    dvm.ro = responseObj;
                    dvm.os = ontologyStateService;
                    dvm.ontoUtils = ontologyUtilsManagerService;

                    dvm.openAddObjectPropOverlay = function() {
                        dvm.os.editingProperty = false;
                        dvm.os.propertySelect = undefined;
                        dvm.os.propertyValue = '';
                        dvm.os.propertyIndex = 0;
                        dvm.os.showObjectPropertyOverlay = true;
                    }

                    dvm.editObjectProp = function(property, index) {
                        dvm.os.editingProperty = true;
                        dvm.os.propertySelect = property;
                        dvm.os.propertyValue = dvm.os.listItem.selected[dvm.ro.getItemIri(property)][index]['@id'];
                        dvm.os.propertyIndex = index;
                        dvm.os.showObjectPropertyOverlay = true;
                    }

                    dvm.showRemovePropertyOverlay = function(key, index) {
                        dvm.key = key;
                        dvm.index = index;
                        dvm.showRemoveOverlay = true;
                    }
                }
            }
        }
})();
