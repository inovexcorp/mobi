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
         * @name propMappingOverlay
         *
         * @description
         * The `propMappingOverlay` module only provides the `propMappingOverlay` directive which creates
         * an overlay with functionality to create or edit a property mapping in the current
         * {@link mapperState.service:mapperStateService#mapping mapping}.
         */
        .module('propMappingOverlay', [])
        /**
         * @ngdoc directive
         * @name propMappingOverlay.directive:propMappingOverlay
         * @scope
         * @restrict E
         * @requires  prefixes.service:prefixes
         * @requires  ontologyManager.service:ontologyManagerService
         * @requires  mappingManager.service:mappingManagerService
         * @requires  mapperState.service:mapperStateService
         *
         * @description
         * `propMappingOverlay` is a directive that creates an overlay with functionality to create or edit a
         * property mapping in the current {@link mapperState.service:mapperStateService#mapping mapping}.
         * If the selected property in the {@link propSelect.directive:propSelect propSelect} is a data property,
         * a {@link columnSelect.directive:columnSelect columnSelect} will appear to select the linked column index
         * for the data property mapping being created/edited. If the selected property is an object property,
         * a description of the class the property links to will be displayed. The directive is replaced by the
         * contents of its template.
         */
        .directive('propMappingOverlay', propMappingOverlay);

        propMappingOverlay.$inject = ['prefixes', 'ontologyManagerService', 'mapperStateService', 'mappingManagerService'];

        function propMappingOverlay(prefixes, ontologyManagerService, mapperStateService, mappingManagerService) {
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

                    dvm.propIdObj = undefined;
                    dvm.selectedProp = undefined;
                    dvm.selectedColumn = '';
                    if (!dvm.state.newProp && dvm.state.selectedPropMappingId) {
                        var propMapping = _.find(dvm.state.mapping.jsonld, {'@id': dvm.state.selectedPropMappingId});
                        var propId = dvm.mm.getPropIdByMapping(propMapping);
                        var ontology = dvm.mm.findSourceOntologyWithProp(propId, dvm.state.sourceOntologies);
                        dvm.propIdObj = {'@id': propId, ontologyId: _.get(ontology, 'id')};
                        dvm.selectedProp = dvm.om.getEntity(_.get(ontology, 'entities'), propId);
                        dvm.selectedColumn = _.get(propMapping, "['" + prefixes.delim + "columnIndex'][0]['@value']");
                    }

                    dvm.getRangeClass = function(propObj) {
                        var rangeClassId = _.get(propObj, "['"+ prefixes.rdfs + "range'][0]['@id']");
                        return dvm.om.getEntity(_.get(dvm.mm.findSourceOntologyWithClass(rangeClassId, dvm.state.sourceOntologies), 'entities'), rangeClassId);
                    }
                    dvm.setSelectedProp = function(propIdObj) {
                        dvm.selectedProp = _.find(_.get(_.find(dvm.state.sourceOntologies, {id: propIdObj.ontologyId}), 'entities'), {'@id': propIdObj['@id']});
                    }
                    dvm.set = function() {
                        var selectedClassMappingId = '';
                        if (dvm.state.newProp) {
                            var propId = dvm.selectedProp['@id'];
                            var ontology = dvm.mm.findSourceOntologyWithProp(propId, dvm.state.sourceOntologies);
                            if (dvm.om.isObjectProperty(dvm.selectedProp)) {
                                // Add range class mapping first
                                var rangeClassId = _.get(dvm.selectedProp, "['"+ prefixes.rdfs + "range'][0]['@id']");
                                var rangeOntology = dvm.mm.findSourceOntologyWithClass(rangeClassId, dvm.state.sourceOntologies);
                                var classMapping = dvm.mm.addClass(dvm.state.mapping.jsonld, rangeOntology.entities, rangeClassId);

                                // Add object property mapping pointing to new range class mapping
                                dvm.mm.addObjectProp(dvm.state.mapping.jsonld, ontology.entities, dvm.state.selectedClassMappingId, propId, classMapping['@id']);
                                dvm.state.setAvailableProps(classMapping['@id']);
                                selectedClassMappingId = classMapping['@id'];
                            } else {
                                dvm.mm.addDataProp(dvm.state.mapping.jsonld, ontology.entities, dvm.state.selectedClassMappingId, propId, dvm.selectedColumn);
                                selectedClassMappingId = dvm.state.selectedClassMappingId;
                            }

                            dvm.state.setAvailableProps(dvm.state.selectedClassMappingId);
                            dvm.state.newProp = false;
                        } else {
                            var propMapping = _.find(dvm.state.mapping.jsonld, {'@id': dvm.state.selectedPropMappingId});
                            if (dvm.mm.isDataMapping(propMapping)) {
                                propMapping[prefixes.delim + 'columnIndex'][0]['@value'] = dvm.selectedColumn;
                                _.remove(dvm.state.invalidProps, {'@id': dvm.state.selectedPropMappingId})
                            }
                            selectedClassMappingId = dvm.state.selectedClassMappingId;
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
                templateUrl: 'modules/mapper/directives/propMappingOverlay/propMappingOverlay.html'
            }
        }
})();
