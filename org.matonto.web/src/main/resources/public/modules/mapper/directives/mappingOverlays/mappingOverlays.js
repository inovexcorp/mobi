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
         * @name mappingOverlays
         *
         * @description 
         * The `mappingOverlays` module only provides the `mappingOverlays` directive which creates
         * all the overlays used in the mapping tool.
         */
        .module('mappingOverlays', [])
        /**
         * @ngdoc directive
         * @name mappingOverlays.directive:mappingOverlays
         * @scope
         * @restrict E
         * @requires  ontologyManager.service:ontologyManagerService
         * @requires  mappingManager.service:mappingManagerService
         * @requires  mapperState.service:mapperStateService
         * @requires  delimitedManager.service:delimitedManagerService
         *
         * @description 
         * `mappingOverlays` is a directive that creates all of the overlay used in the mapping tool. 
         * Those overlays are {@link mappingNameOverlay.directive:mappingNameOverlay mappingNameOverlay},
         * {@link iriTemplateOverlay.directive:iriTemplateOverlay iriTemplateOverlay},
         * {@link invalidOntologyOverlay.directive:invalidOntologyOverlay invalidOntologyOverlay},
         * {@link createMappingOverlay.directive:createMappingOverlay createMappingOverlay},
         * {@link downloadMappingOverlay.directive:downloadMappingOverlay downloadMappingOverlay},
         * {@link mappingConfigOverlay.directive:mappingConfigOverlay mappingConfigOverlay},
         * {@link propMappingOverlay.directive:propMappingOverlay propMappingOverlay},
         * and several {@link confirmationOverlay.directive:confirmationOverlay confirmationOverlays}.
         */
        .directive('mappingOverlays', mappingOverlays);

        mappingOverlays.$inject = ['mappingManagerService', 'mapperStateService', 'delimitedManagerService', 'ontologyManagerService']

        function mappingOverlays(mappingManagerService, mapperStateService, delimitedManagerService, ontologyManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                scope: {},
                controller: function() {
                    var dvm = this;
                    dvm.state = mapperStateService;
                    dvm.mm = mappingManagerService;
                    dvm.dm = delimitedManagerService;
                    dvm.om = ontologyManagerService;

                    dvm.reset = function() {
                        dvm.state.initialize();
                        dvm.state.resetEdit();
                        dvm.dm.reset();
                    }
                    dvm.getClassName = function(classMappingId) {
                        var classId = dvm.mm.getClassIdByMappingId(dvm.state.mapping.jsonld, classMappingId);
                        return dvm.om.getEntityName(dvm.om.getEntity(_.get(dvm.mm.findSourceOntologyWithClass(classId, dvm.state.sourceOntologies), 'entities'), classId));
                    }
                    dvm.getPropName = function(propMappingId) {
                        var propId = dvm.mm.getPropIdByMappingId(dvm.state.mapping.jsonld, propMappingId);
                        return dvm.om.getEntityName(dvm.om.getEntity(_.get(dvm.mm.findSourceOntologyWithProp(propId, dvm.state.sourceOntologies), 'entities'), propId));
                    }
                    dvm.deleteClass = function() {
                        var classesToUpdate = _.map(dvm.mm.getPropsLinkingToClass(dvm.state.mapping.jsonld, dvm.state.selectedClassMappingId), prop => {
                            var propId = dvm.mm.getPropIdByMapping(prop);
                            var ontology = dvm.mm.findSourceOntologyWithProp(propId, dvm.state.sourceOntologies);
                            var classMapping = dvm.mm.findClassWithObjectMapping(dvm.state.mapping.jsonld, prop['@id']);
                            return {
                                ontologyId: ontology.id,
                                classMappingId: classMapping['@id'],
                                propId: propId
                            };
                        });
                        var dataPropMappings = _.filter(dvm.mm.getPropMappingsByClass(dvm.state.mapping.jsonld, dvm.state.selectedClassMappingId), propMapping => dvm.mm.isDataMapping(propMapping));
                        dvm.state.mapping.jsonld = dvm.mm.removeClass(dvm.state.mapping.jsonld, dvm.state.selectedClassMappingId);
                        _.forEach(dataPropMappings, propMapping => _.remove(dvm.state.invalidProps, {'@id': propMapping['@id']}));
                        dvm.state.removeAvailableProps(dvm.state.selectedClassMappingId);
                        _.forEach(classesToUpdate, obj => dvm.state.getAvailableProps(obj.classMappingId).push({'@id': obj.propId, ontologyId: obj.ontologyId}));
                        dvm.state.resetEdit();
                        dvm.state.selectedClassMappingId = _.get(dvm.mm.getBaseClass(dvm.state.mapping.jsonld), '@id', '');
                    }
                    dvm.deleteProp = function() {
                        var propId = dvm.mm.getPropIdByMappingId(dvm.state.mapping.jsonld, dvm.state.selectedPropMappingId);
                        var ontology = dvm.mm.findSourceOntologyWithProp(propId, dvm.state.sourceOntologies);
                        var classMapping = _.find(dvm.state.mapping.jsonld, {'@id': dvm.state.selectedClassMappingId});
                        dvm.state.getAvailableProps(classMapping['@id']).push({'@id': propId, ontologyId: ontology.id});
                        dvm.state.mapping.jsonld = dvm.mm.removeProp(dvm.state.mapping.jsonld, classMapping['@id'], dvm.state.selectedPropMappingId);
                        _.remove(dvm.state.invalidProps, {'@id': dvm.state.selectedPropMappingId});
                        dvm.state.resetEdit();
                        dvm.state.selectedClassMappingId = classMapping['@id'];
                    }
                    dvm.deleteMapping = function() {
                        dvm.mm.deleteMapping(dvm.state.mapping.id).then(() => {
                            dvm.state.mapping = undefined;
                            dvm.state.sourceOntologies = [];
                        }, errorMessage => {
                            console.log(errorMessage);
                        });
                    }
                },
                templateUrl: 'modules/mapper/directives/mappingOverlays/mappingOverlays.html'
            }
        }
})();
