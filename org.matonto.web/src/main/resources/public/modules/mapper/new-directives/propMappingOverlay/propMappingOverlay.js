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
        .module('propMappingOverlay', [])
        .directive('propMappingOverlay', propMappingOverlay);

        propMappingOverlay.$inject = ['prefixes', 'ontologyManagerService', 'mapperStateService', 'mappingManagerService', 'delimitedManagerService'];

        function propMappingOverlay(prefixes, ontologyManagerService, mapperStateService, mappingManagerService, delimitedManagerService) {
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
                    dvm.dm = delimitedManagerService;
                    
                    dvm.selectedProp = undefined;
                    dvm.selectedColumn = '';
                    if (!dvm.state.newProp && dvm.state.selectedPropMappingId) {
                        var propMapping = _.find(dvm.mm.mapping.jsonld, {'@id': dvm.state.selectedPropMappingId});
                        var propId = dvm.mm.getPropIdByMapping(propMapping);
                        dvm.selectedProp = dvm.om.getEntity(_.get(dvm.mm.findSourceOntologyWithProp(propId), 'entities'), propId);
                        dvm.selectedColumn = dvm.dm.filePreview.headers[parseInt(_.get(propMapping, "['" + prefixes.delim + "columnIndex'][0]['@value']"), 10)];
                    }

                    dvm.getRangeClass = function(propObj) {
                        var rangeClassId = _.get(propObj, "['"+ prefixes.rdfs + "range'][0]['@id']");
                        return dvm.om.getEntity(_.get(dvm.mm.findSourceOntologyWithClass(rangeClassId), 'entities'), rangeClassId);
                    }
                    dvm.set = function() {
                        var selectedClassMappingId = '';
                        if (dvm.state.newProp) {
                            var propId = dvm.selectedProp['@id'];
                            var ontology = dvm.mm.findSourceOntologyWithProp(propId);
                            if (dvm.om.isObjectProperty(dvm.selectedProp)) {
                                var classMappings = dvm.mm.getAllClassMappings(dvm.mm.mapping.jsonld);
                                dvm.mm.mapping.jsonld = dvm.mm.addObjectProp(dvm.mm.mapping.jsonld, ontology.entities, dvm.state.selectedClassMappingId, propId);
                                var classMapping = _.differenceBy(dvm.mm.getAllClassMappings(dvm.mm.mapping.jsonld), classMappings, '@id')[0];
                                dvm.state.setAvailableProps(classMapping['@id']);
                                selectedClassMappingId = classMapping['@id'];
                            } else {
                                var columnIdx = dvm.dm.filePreview.headers.indexOf(dvm.selectedColumn);
                                dvm.mm.mapping.jsonld = dvm.mm.addDataProp(dvm.mm.mapping.jsonld, ontology.entities, dvm.state.selectedClassMappingId, propId, columnIdx);
                                selectedClassMappingId = dvm.state.selectedClassMappingId;
                            }
                            
                            dvm.state.setAvailableProps(dvm.state.selectedClassMappingId);
                            dvm.state.newProp = false;
                        } else {
                            if (dvm.mm.isDataMapping(_.find(dvm.mm.mapping.jsonld, {'@id': dvm.selectedPropMappingId}))) {
                                var columnIdx = dvm.dm.filePreview.headers.indexOf(dvm.selectedColumn);
                                var propId = dvm.mm.getPropIdByMappingId(dvm.mm.mapping.jsonld, dvm.selectedPropMappingId);
                                var ontology = dvm.mm.findSourceOntologyWithClass(dvm.mm.getClassIdByMappingId(dvm.mm.mapping.jsonld, dvm.state.selectedClassMappingId));
                                dvm.mm.mapping.jsonld = dvm.mm.addDataProp(dvm.mm.mapping.jsonld, ontology.entities, dvm.state.selectedClassMappingId, propId, columnIdx);
                                selectedClassMappingId = dvm.state.selectedClassMappingId;
                            }
                        }

                        dvm.state.resetEdit();
                        dvm.state.selectedClassMappingId = selectedClassMappingId;
                        dvm.state.displayPropMappingOverlay = false;
                    }
                    dvm.cancel = function() {
                        dvm.state.displayPropMappingOverlay = false;
                        dvm.state.newProp = false;
                    }
                },
                templateUrl: 'modules/mapper/new-directives/propMappingOverlay/propMappingOverlay.html'
            }
        }
})();