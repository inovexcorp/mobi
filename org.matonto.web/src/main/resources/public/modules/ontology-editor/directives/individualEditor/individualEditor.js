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
        .module('individualEditor', [])
        .directive('individualEditor', individualEditor);

        individualEditor.$inject = ['responseObj', 'stateManagerService', 'ontologyManagerService', 'prefixes'];

        function individualEditor(responseObj, stateManagerService, ontologyManagerService, prefixes) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/individualEditor/individualEditor.html',
                scope: {},
                controllerAs: 'dvm',
                controller: ['$scope', function($scope) {
                    var dvm = this;

                    dvm.sm = stateManagerService;
                    dvm.om = ontologyManagerService;
                    dvm.ro = responseObj;
                    dvm.prefixes = prefixes;

                    dvm.openAddDataPropOverlay = function() {
                        dvm.sm.editingProperty = false;
                        dvm.sm.propertySelect = undefined;
                        dvm.sm.propertyValue = '';
                        dvm.sm.propertyType = undefined;
                        dvm.sm.propertyIndex = 0;
                        dvm.sm.showDataPropertyOverlay = true;
                    }

                    dvm.editDataProp = function(property, index) {
                        dvm.sm.editingProperty = true;
                        dvm.sm.propertySelect = property;
                        dvm.sm.propertyValue = dvm.sm.selected[dvm.ro.getItemIri(property)][index]['@value'];
                        dvm.sm.propertyType = _.find(dvm.sm.state.dataPropertyRange, datatype => dvm.ro.getItemIri(datatype) === dvm.sm.selected[dvm.ro.getItemIri(property)][index]['@type']);
                        dvm.sm.propertyIndex = index;
                        dvm.sm.showDataPropertyOverlay = true;
                    }

                    dvm.openAddObjectPropOverlay = function() {
                        dvm.sm.editingProperty = false;
                        dvm.sm.propertySelect = undefined;
                        dvm.sm.propertyValue = undefined;
                        dvm.sm.propertyIndex = 0;
                        dvm.sm.showObjectPropertyOverlay = true;
                    }

                    dvm.editObjectProp = function(property, index) {
                        dvm.sm.editingProperty = true;
                        dvm.sm.propertySelect = property;
                        dvm.sm.propertyValue = dvm.sm.selected[dvm.ro.getItemIri(property)][index]['@id'];
                        dvm.sm.propertyIndex = index;
                        dvm.sm.showObjectPropertyOverlay = true;
                    }

                    dvm.showRemovePropertyOverlay = function(key, index) {
                        dvm.sm.key = key;
                        dvm.sm.index = index;
                        dvm.sm.showRemoveIndividualPropertyOverlay = true;
                    }

                    function getSubClasses() {
                        dvm.subClasses = dvm.om.getClassIRIs(dvm.sm.ontology);
                    }

                    $scope.$watch('dvm.sm.ontology', getSubClasses);
                    getSubClasses();
                }]
            }
        }
})();
