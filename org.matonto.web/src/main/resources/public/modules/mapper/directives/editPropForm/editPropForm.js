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
        .module('editPropForm', ['ontologyManager', 'mappingManager'])
        .directive('editPropForm', editPropForm);

        editPropForm.$inject = ['ontologyManagerService', 'mappingManagerService'];

        function editPropForm(ontologyManagerService, mappingManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {
                    columns: '=',
                    set: '&',
                    clickDelete: '&'
                },
                bindToController: {
                    mapping: '=',
                    ontologies: '=',
                    classMappingId: '=',
                    selectedPropMapping: '=',
                    selectedColumn: '='
                },
                controller: function() {
                    var dvm = this;

                    dvm.getClassId = function() {
                        return mappingManagerService.getClassIdByMappingId(dvm.mapping.jsonld, dvm.classMappingId);
                    }
                    dvm.getPropId = function() {
                        return mappingManagerService.getPropIdByMappingId(dvm.mapping.jsonld, dvm.selectedPropMapping);
                    }
                    dvm.getTitle = function() {
                        var classId = dvm.getClassId();
                        var ontology = ontologyManagerService.findOntologyWithClass(dvm.ontologies, classId);
                        var className = ontologyManagerService.getEntityName(ontologyManagerService.getClass(ontology, classId));
                        var propName = ontologyManagerService.getEntityName(getClassProp(classId, dvm.getPropId()));
                        return className + ': ' + propName;
                    }
                    dvm.isObjectProperty = function() {
                        return ontologyManagerService.isObjectProperty(_.get(getClassProp(dvm.getClassId(), dvm.getPropId()), '@type', []));
                    }
                    function getClassProp(classId, propId) {
                        var ontology = ontologyManagerService.findOntologyWithClass(dvm.ontologies, classId);
                        return ontologyManagerService.getClassProperty(ontology, classId, propId);
                    }
                },
                templateUrl: 'modules/mapper/directives/editPropForm/editPropForm.html'
            }
        }
})();
