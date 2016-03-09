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
                    ontologyId: '=',
                    baseClassId: '='
                },
                controller: function($filter) {
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
                        var classObj = ontologyManagerService.getClass(dvm.ontologyId, classId);
                        return ontologyManagerService.getEntityName(classObj);
                    }
                    dvm.getPropName = function(propMapping, classId) {
                        var propId = propMapping[prefixes.delim + 'hasProperty'][0]['@id'];
                        var propName = ontologyManagerService.getEntityName(ontologyManagerService.getClassProperty(dvm.ontologyId, classId, propId))
                        var mappingName = '';
                        if (mappingManagerService.isObjectMapping(propMapping)) {
                            mappingName = dvm.getClassName(propMapping[prefixes.delim + 'classMapping'][0]['@id']);
                        } else if (mappingManagerService.isDataMapping(propMapping)) {
                            var index = parseInt(propMapping[prefixes.delim + 'columnIndex'][0]['@value'], 10);
                            mappingName = dvm.columns[index];
                        }
                        return propName + ': ' + mappingName;
                    }
                    dvm.isBaseClass = function(classId) {
                        return id === dvm.baseClassId;
                    }
                    dvm.mappedAllProps = function(classId) {
                        var mappedProps = mappingManagerService.getPropMappingsByClass(dvm.mapping, classId);
                        var classProps = ontologyManagerService.getClassProperties(dvm.ontologyId, classId);

                        return mappedProps.length === classProps.length;
                    }
                },
                templateUrl: 'modules/mapper/directives/classList/classList.html'
            }
        }
})();
