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
                    columns: '=',
                    invalidPropIds: '='
                },
                controller: function() {
                    var dvm = this;
                    dvm.delim = prefixes.delim;

                    dvm.getClassMappings = function() {
                        return _.filter(dvm.mapping.jsonld, {'@type': [prefixes.delim + 'ClassMapping']});
                    }
                    dvm.getPropMappings = function(classMapping) {
                        return mappingManagerService.getPropMappingsByClass(dvm.mapping, classMapping['@id']);
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
                        var mappedProps = mappingManagerService.getPropMappingsByClass(dvm.mapping, classMapping['@id']);
                        var classProps = ontologyManagerService.getClassProperties(mappingManagerService.getSourceOntology(dvm.mapping), getClassId(classMapping));

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
                        var classObj = ontologyManagerService.getClass(
                            mappingManagerService.getSourceOntology(dvm.mapping), getClassId(classMapping));
                        return ontologyManagerService.getEntityName(classObj);
                    }
                    function getPropName(propMapping, classMapping) {
                        var propId = getPropId(propMapping);
                        var classId = getClassId(classMapping);
                        return ontologyManagerService.getEntityName(
                            ontologyManagerService.getClassProperty(mappingManagerService.getSourceOntology(dvm.mapping), classId, propId)
                        );
                    }
                    function getClassId(classMapping) {
                        return mappingManagerService.getClassByMapping(classMapping);
                    }
                    function getPropId(propMapping) {
                        return mappingManagerService.getPropByMapping(propMapping);
                    }
                },
                templateUrl: 'modules/mapper/directives/classList/classList.html'
            }
        }
})();
