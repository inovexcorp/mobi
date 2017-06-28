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

        mappingOverlays.$inject = ['utilService', 'mappingManagerService', 'mapperStateService', 'delimitedManagerService', 'ontologyManagerService', 'prefixes']

        function mappingOverlays(utilService, mappingManagerService, mapperStateService, delimitedManagerService, ontologyManagerService, prefixes) {
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
                        dvm.state.deleteClass(dvm.state.selectedClassMappingId);
                        /*var propsToAdd = _.map(dvm.mm.getPropsLinkingToClass(dvm.state.mapping.jsonld, dvm.state.selectedClassMappingId), prop => {
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
                        var classMapping = _.find(dvm.state.mapping.jsonld, {'@id': dvm.state.selectedClassMappingId});
                        var classId = dvm.mm.getClassIdByMapping(classMapping);
                        var classOntology = dvm.mm.findSourceOntologyWithClass(classId, dvm.state.sourceOntologies);
                        var classObj = dvm.om.getEntity([classOntology.entities], classId);
                        var propMappings = dvm.mm.getPropMappingsByClass(dvm.state.mapping.jsonld, dvm.state.selectedClassMappingId);
                        dvm.mm.removeClass(dvm.state.mapping.jsonld, dvm.state.selectedClassMappingId);
                        dvm.state.deleteEntity(classMapping);
                        _.forEach(propMappings, propMapping => {
                            if (dvm.mm.isDataMapping(propMapping)) {
                                _.remove(dvm.state.invalidProps, {'@id': propMapping['@id']})
                            }
                            dvm.state.deleteEntity(propMapping);
                        });
                        dvm.state.removeAvailableProps(dvm.state.selectedClassMappingId);
                        dvm.state.availableClasses.push({ontologyId: classOntology.id, classObj});
                        _.forEach(propsToAdd, obj => dvm.state.getAvailableProps(obj.classMappingId).push(_.pick(obj, ['ontologyId', 'propObj'])));*/
                        dvm.state.resetEdit();
                        dvm.state.selectedClassMappingId = '';
                        dvm.state.changedMapping = true;
                    }
                    dvm.deleteProp = function() {
                        var classMapping = _.find(dvm.state.mapping.jsonld, {'@id': dvm.state.selectedClassMappingId});
                        dvm.state.deleteProp(dvm.state.selectedPropMappingId, classMapping['@id']);
                        /*var propMapping = _.find(dvm.state.mapping.jsonld, {'@id': dvm.state.selectedPropMappingId});
                        var propId = dvm.mm.getPropIdByMapping(propMapping);
                        var ontology = dvm.mm.findSourceOntologyWithProp(propId, dvm.state.sourceOntologies);
                        var propObj = _.includes(dvm.mm.annotationProperties, propId) ? {'@id': propId} : dvm.om.getEntity([_.get(ontology, 'entities')], propId);
                        dvm.state.getAvailableProps(classMapping['@id']).push({propObj, ontologyId: _.get(ontology, 'id', '')});
                        dvm.mm.removeProp(dvm.state.mapping.jsonld, classMapping['@id'], dvm.state.selectedPropMappingId);
                        dvm.state.deleteEntity(propMapping);
                        var additionsObj = _.find(dvm.state.mapping.difference.deletions, {'@id': dvm.state.selectedClassMappingId});
                        var prop = prefixes.delim + (dvm.mm.isDataMapping(propMapping) ? 'dataProperty' : 'objectProperty');
                        if (dvm.util.hasPropertyId(additionsObj, prop, propMapping['@id'])) {
                            dvm.util.removePropertyId(additionsObj, prop, propMapping['@id'])
                        } else {
                            var deletionsObj = _.find(dvm.state.mapping.difference.deletions, {'@id': dvm.state.selectedClassMappingId});
                            if (deletionsObj) {
                                if (!_.has(deletionsObj, "['" + prop + "']")) {
                                    deletionsObj[prop] = [];
                                }
                                deletionsObj[prop].push({'@id': propMapping['@id']});
                            } else {
                                dvm.state.mapping.difference.deletions.push({'@id': dvm.state.selectedClassMappingId, [prop]: [{'@id': propMapping['@id']}]});
                            }
                        }
                        _.remove(dvm.state.invalidProps, {'@id': dvm.state.selectedPropMappingId});*/
                        dvm.state.resetEdit();
                        dvm.state.selectedClassMappingId = classMapping['@id'];
                        dvm.state.changedMapping = true;
                    }
                },
                templateUrl: 'modules/mapper/directives/mappingOverlays/mappingOverlays.html'
            }
        }
})();
