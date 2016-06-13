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
        .module('classList', ['prefixes', 'ontologyManager', 'mappingManager'])
        .directive('classList', classList);

        classList.$inject = ['prefixes', 'ontologyManagerService', 'mappingManagerService'];

        function classList(prefixes, ontologyManagerService, mappingManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {
                    clickAddProp: '&',
                    clickClass: '&',
                    clickProp: '&',
                    clickDelete: '&'
                },
                bindToController: {
                    mapping: '=',
                    ontologies: '=',
                    columns: '=',
                    invalidPropIds: '='
                },
                controller: function() {
                    var dvm = this;

                    dvm.getClassMappings = function() {
                        return mappingManagerService.getAllClassMappings(dvm.mapping.jsonld);
                    }
                    dvm.getPropMappings = function(classMapping) {
                        return mappingManagerService.getPropMappingsByClass(dvm.mapping.jsonld, classMapping['@id']);
                    }
                    dvm.getClassTitle = function(classMapping) {
                        var className = getClassName(classMapping);
                        var links = dvm.getLinks(classMapping);
                        if (links) {
                            className = className + ' - ' + links;
                        } 
                        return className;
                    }
                    dvm.getPropTitle = function(propMapping, classMapping) {
                        var propName = getPropName(propMapping, classMapping);
                        var mappingName = '';
                        if (mappingManagerService.isObjectMapping(propMapping)) {
                            var wrapperClassMapping = _.find(dvm.mapping.jsonld, {'@id': propMapping[prefixes.delim + 'classMapping'][0]['@id']});
                            mappingName = getClassName(wrapperClassMapping);
                        } else if (mappingManagerService.isDataMapping(propMapping)) {
                            var index = parseInt(propMapping[prefixes.delim + 'columnIndex'][0]['@value'], 10);
                            mappingName = dvm.columns[index];
                        }
                        return propName + ': ' + mappingName;
                    }
                    dvm.mappedAllProps = function(classMapping) {
                        var mappedProps = mappingManagerService.getPropMappingsByClass(dvm.mapping.jsonld, classMapping['@id']);
                        var classId = getClassId(classMapping);
                        var ontology = ontologyManagerService.findOntologyWithClass(dvm.ontologies, classId);
                        var classProps = ontologyManagerService.getClassProperties(ontology, classId);

                        return mappedProps.length === classProps.length;
                    }
                    dvm.getLinks = function(classMapping) {
                        var objectMappings = _.filter(
                            _.filter(dvm.mapping.jsonld, {'@type': [prefixes.delim + 'ObjectMapping']}),
                            ["['" + prefixes.delim + "classMapping'][0]['@id']", classMapping['@id']]
                        );
                        return _.join(
                            _.map(objectMappings, function(objectMapping) {
                                var wrapperClassMapping = mappingManagerService.findClassWithObjectMapping(dvm.mapping.jsonld, objectMapping['@id']);
                                var className = getClassName(wrapperClassMapping);
                                var propName = getPropName(objectMapping, wrapperClassMapping);
                                return className + ': ' + propName;
                            }),
                            ', '
                        );
                    }
                    function getClassName(classMapping) {
                        var classId = getClassId(classMapping);
                        var ontology = ontologyManagerService.findOntologyWithClass(dvm.ontologies, classId);
                        return ontologyManagerService.getEntityName(ontologyManagerService.getClass(ontology, classId));
                    }
                    function getPropName(propMapping, classMapping) {
                        var classId = getClassId(classMapping);
                        var ontology = ontologyManagerService.findOntologyWithClass(dvm.ontologies, classId);
                        var propId = getPropId(propMapping);
                        return ontologyManagerService.getEntityName(ontologyManagerService.getClassProperty(ontology, classId, propId));
                    }
                    function getClassId(classMapping) {
                        return mappingManagerService.getClassIdByMapping(classMapping);
                    }
                    function getPropId(propMapping) {
                        return mappingManagerService.getPropIdByMapping(propMapping);
                    }
                },
                templateUrl: 'modules/mapper/directives/classList/classList.html'
            }
        }
})();
