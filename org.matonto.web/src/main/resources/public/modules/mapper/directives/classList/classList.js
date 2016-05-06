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
