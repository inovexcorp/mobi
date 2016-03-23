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

                    dvm.getPropId = function(propMapping) {
                        return propMapping[prefixes.delim + 'hasProperty'][0]['@id'];
                    }
                    dvm.getClassIds = function() {
                        return mappingManagerService.getMappedClassIds(dvm.mapping);
                    }
                    dvm.getPropMappings = function(classId) {
                        return mappingManagerService.getPropMappingsByClass(dvm.mapping, classId);
                    }
                    dvm.getClassName = function(classId) {
                        var classObj = ontologyManagerService.getClass(mappingManagerService.getSourceOntology(dvm.mapping), classId);
                        return ontologyManagerService.getEntityName(classObj);
                    }
                    dvm.getPropName = function(propMapping, classId) {
                        var propId = propMapping[prefixes.delim + 'hasProperty'][0]['@id'];
                        var propName = ontologyManagerService.getEntityName(
                            ontologyManagerService.getClassProperty(mappingManagerService.getSourceOntology(dvm.mapping), classId, propId)
                        );
                        var mappingName = '';
                        if (mappingManagerService.isObjectMapping(propMapping)) {
                            var classMapping = _.find(dvm.mapping.jsonld, {'@id': propMapping[prefixes.delim + 'classMapping'][0]['@id']});
                            mappingName = dvm.getClassName(classMapping[prefixes.delim + 'mapsTo'][0]['@id']);
                        } else if (mappingManagerService.isDataMapping(propMapping)) {
                            var index = parseInt(propMapping[prefixes.delim + 'columnIndex'][0]['@value'], 10);
                            mappingName = dvm.columns[index - 1];
                        }
                        return propName + ': ' + mappingName;
                    }
                    dvm.mappedAllProps = function(classId) {
                        var mappedProps = mappingManagerService.getPropMappingsByClass(dvm.mapping, classId);
                        var classProps = ontologyManagerService.getClassProperties(mappingManagerService.getSourceOntology(dvm.mapping), classId);

                        return mappedProps.length === classProps.length;
                    }
                },
                templateUrl: 'modules/mapper/directives/classList/classList.html'
            }
        }
})();
