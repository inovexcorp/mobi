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
         * `mappingOverlays` is a directive that creates all of the overlays used in the mapping tool.
         * Those overlays are {@link mappingNameOverlay.directive:mappingNameOverlay mappingNameOverlay},
         * {@link iriTemplateOverlay.directive:iriTemplateOverlay iriTemplateOverlay},
         * {@link invalidOntologyOverlay.directive:invalidOntologyOverlay invalidOntologyOverlay},
         * {@link createMappingOverlay.directive:createMappingOverlay createMappingOverlay},
         * {@link downloadMappingOverlay.directive:downloadMappingOverlay downloadMappingOverlay},
         * {@link mappingConfigOverlay.directive:mappingConfigOverlay mappingConfigOverlay},
         * {@link propMappingOverlay.directive:propMappingOverlay propMappingOverlay},
         * {@link runMappingOverlay.directive:runMappingOverlay runMappingOverlay},
         * and several {@link confirmationOverlay.directive:confirmationOverlay confirmationOverlays}.
         */
        .directive('mappingOverlays', mappingOverlays);

        mappingOverlays.$inject = ['utilService', 'mappingManagerService', 'mapperStateService', 'delimitedManagerService', 'ontologyManagerService']

        function mappingOverlays(utilService, mappingManagerService, mapperStateService, delimitedManagerService, ontologyManagerService) {
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
                    dvm.util = utilService;

                    dvm.reset = function() {
                        dvm.state.initialize();
                        dvm.state.resetEdit();
                        dvm.dm.reset();
                    }
                    dvm.getClassName = function(classMappingId) {
                        return dvm.util.getBeautifulIRI(dvm.mm.getClassIdByMappingId(dvm.state.mapping.jsonld, classMappingId));
                    }
                    dvm.getPropName = function(propMappingId) {
                        return dvm.util.getBeautifulIRI(dvm.mm.getPropIdByMappingId(dvm.state.mapping.jsonld, propMappingId));
                    }
                    dvm.deleteClass = function() {
                        var propsToAdd = _.map(dvm.mm.getPropsLinkingToClass(dvm.state.mapping.jsonld, dvm.state.selectedClassMappingId), prop => {
                            var propId = dvm.mm.getPropIdByMapping(prop);
                            var ontology = dvm.mm.findSourceOntologyWithProp(propId, dvm.state.sourceOntologies);
                            var classMapping = dvm.mm.findClassWithObjectMapping(dvm.state.mapping.jsonld, prop['@id']);
                            var propObj = dvm.om.getEntity([ontology.entities], propId);
                            return {
                                ontologyId: ontology.id,
                                classMappingId: classMapping['@id'],
                                propObj: propObj
                            };
                        });
                        var classId = dvm.mm.getClassIdByMappingId(dvm.state.mapping.jsonld, dvm.state.selectedClassMappingId);
                        var classOntology = dvm.mm.findSourceOntologyWithClass(classId, dvm.state.sourceOntologies);
                        var classObj = dvm.om.getEntity([classOntology.entities], classId);
                        var dataPropMappings = _.filter(dvm.mm.getPropMappingsByClass(dvm.state.mapping.jsonld, dvm.state.selectedClassMappingId), propMapping => dvm.mm.isDataMapping(propMapping));
                        dvm.mm.removeClass(dvm.state.mapping.jsonld, dvm.state.selectedClassMappingId);
                        _.forEach(dataPropMappings, propMapping => _.remove(dvm.state.invalidProps, {'@id': propMapping['@id']}));
                        dvm.state.removeAvailableProps(dvm.state.selectedClassMappingId);
                        dvm.state.availableClasses.push({ontologyId: classOntology.id, classObj});
                        _.forEach(propsToAdd, obj => dvm.state.getAvailableProps(obj.classMappingId).push(_.pick(obj, ['ontologyId', 'propObj'])));
                        dvm.state.resetEdit();
                        dvm.state.selectedClassMappingId = '';
                        dvm.state.changedMapping = true;
                    }
                    dvm.deleteProp = function() {
                        var propId = dvm.mm.getPropIdByMappingId(dvm.state.mapping.jsonld, dvm.state.selectedPropMappingId);
                        var ontology = dvm.mm.findSourceOntologyWithProp(propId, dvm.state.sourceOntologies);
                        var classMapping = _.find(dvm.state.mapping.jsonld, {'@id': dvm.state.selectedClassMappingId});
                        var propObj = dvm.om.getEntity([ontology.entities], propId);
                        dvm.state.getAvailableProps(classMapping['@id']).push({propObj, ontologyId: ontology.id});
                        dvm.mm.removeProp(dvm.state.mapping.jsonld, classMapping['@id'], dvm.state.selectedPropMappingId);
                        _.remove(dvm.state.invalidProps, {'@id': dvm.state.selectedPropMappingId});
                        dvm.state.resetEdit();
                        dvm.state.selectedClassMappingId = classMapping['@id'];
                        dvm.state.changedMapping = true;
                    }
                    dvm.deleteMapping = function() {
                        dvm.mm.deleteMapping(dvm.state.mapping.id).then(() => {
                            dvm.state.mapping = undefined;
                            dvm.state.sourceOntologies = [];
                        }, dvm.util.createErrorToast);
                    }
                },
                templateUrl: 'modules/mapper/directives/mappingOverlays/mappingOverlays.html'
            }
        }
})();
