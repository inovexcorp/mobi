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
        /**
         * @ngdoc overview
         * @name newPropForm
         * @requires  ontologyManager
         * @requires  mappingManager
         * @requires  mapperState
         * @requires  csvManager
         *
         * @description 
         * The `newPropForm` module only provides the `newPropForm` directive which creates
         * a form to add a new property mapping to the selected mapping.
         */
        .module('newPropForm', ['ontologyManager', 'mappingManager', 'mapperState', 'csvManager'])
        /**
         * @ngdoc directive
         * @name newPropForm.directive:newPropForm
         * @scope
         * @restrict E
         * @requires  ontologyManager.service:ontologyManagerService
         * @requires  mappingManager.service:mappingManagerService
         * @requires  mapperState.service:mapperStateService
         * @requires  csvManager.service:csvManagerService
         *
         * @description 
         * `newPropForm` is a directive that creates a form with functionality to add a new 
         * property mapping to the selected mapping. It creates a {@link propSelect.directive:propSelect}
         * with all the unmapped properties for a class. If the selected property is an object 
         * property, it renders a description of the class it links to. If the selected property
         * is a data property, it renders a {@link columnSelect.directive:columnSelect columnSelect} to pick
         * the column the property maps to. There are buttons to set the property and optionally
         * continue to add properties for the same class. The directive is replaced by the 
         * contents of its template.
         */
        .directive('newPropForm', newPropForm);

        newPropForm.$inject = ['ontologyManagerService', 'mappingManagerService', 'mapperStateService', 'csvManagerService'];

        function newPropForm(ontologyManagerService, mappingManagerService, mapperStateService, csvManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {},
                controller: function() {
                    var dvm = this;
                    dvm.state = mapperStateService;
                    dvm.mm = mappingManagerService;
                    dvm.om = ontologyManagerService;
                    dvm.cm = csvManagerService;

                    dvm.update = function() {
                        if (!dvm.isObjectProperty()) {
                            dvm.state.updateAvailableColumns();
                        }
                    }
                    dvm.isObjectProperty = function() {
                        return dvm.om.isObjectProperty(_.get(dvm.state.selectedProp, '@type', []));
                    }
                    dvm.getClassName = function() {
                        var classId = dvm.mm.getClassIdByMappingId(dvm.mm.mapping.jsonld, dvm.state.selectedClassMappingId);
                        var ontology = dvm.om.findOntologyWithClass(dvm.mm.sourceOntologies, classId);
                        return dvm.om.getEntityName(dvm.om.getClass(ontology, classId));
                    }
                    dvm.set = function() {
                        if (dvm.isObjectProperty()) {
                            dvm.mm.mapping.jsonld = dvm.mm.addObjectProp(dvm.mm.mapping.jsonld, dvm.mm.sourceOntologies, 
                                dvm.state.selectedClassMappingId, dvm.state.selectedProp['@id']);
                        } else {
                            var columnIdx = dvm.cm.filePreview.headers.indexOf(dvm.state.selectedColumn);
                            var propId = dvm.state.selectedProp['@id'];
                            var classId = dvm.mm.getClassIdByMappingId(dvm.mm.mapping.jsonld, dvm.state.selectedClassMappingId)
                            var ontology = dvm.om.findOntologyWithClass(dvm.mm.sourceOntologies, classId);
                            dvm.mm.mapping.jsonld = dvm.mm.addDataProp(dvm.mm.mapping.jsonld, ontology, dvm.state.selectedClassMappingId, propId, columnIdx);
                        }
                        
                        dvm.state.openedClasses = _.union(dvm.state.openedClasses, [dvm.state.selectedClassMappingId]);
                        dvm.state.resetEdit();
                        dvm.state.changedMapping();
                    }
                    dvm.setNext = function() {
                        var classMappingId = dvm.state.selectedClassMappingId;
                        dvm.set();
                        dvm.state.newProp = true;
                        dvm.state.selectedClassMappingId = classMappingId;
                        dvm.state.updateAvailableProps();
                    }
                },
                templateUrl: 'modules/mapper/directives/newPropForm/newPropForm.html'
            }
        }
})();
