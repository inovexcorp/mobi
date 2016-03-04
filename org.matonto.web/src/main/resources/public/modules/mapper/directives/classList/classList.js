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
                    clickProp: '&'
                },
                bindToController: {
                    mapping: '=',
                    ontologyId: '=',
                    baseClassId: '='
                },
                controller: function($filter) {
                    var dvm = this;

                    dvm.getClassIds = function() {
                        return mappingManagerService.getMappedClassIds(dvm.mapping);
                    }
                    dvm.getPropIds = function(classId) {
                        return mappingManagerService.getMappedPropIdsByClass(dvm.mapping, classId);
                    }
                    dvm.getClassName = function(classId) {
                        var classObj = ontologyManagerService.getClass(dvm.ontologyId, classId);
                        return classObj.hasOwnProperty(prefixes.rdfs + 'label') ? classObj[prefixes.rdfs + 'label'][0]['@value'] : $filter('beautify')($filter('splitIRI')(classId).end);
                    }
                    dvm.getPropName = function(classId, propId) {
                        var propObj = ontologyManagerService.getClassProperty(dvm.ontologyId, classId, propId);
                        return propObj.hasOwnProperty(prefixes.rdfs + 'label') ? propObj[prefixes.rdfs + 'label'][0]['@value'] : $filter('beautify')($filter('splitIRI')(propId).end);
                    }
                    dvm.isBaseClass = function(classId) {
                        return id === dvm.baseClassId;
                    }
                    dvm.mappedAllProps = function(classId) {
                        var mappedProps = mappingManagerService.getMappedPropIdsByClass(dvm.mapping, classId);
                        var classProps = ontologyManagerService.getClassProperties(dvm.ontologyId, classId);

                        return mappedProps.length < classProps;
                    }
                },
                templateUrl: 'modules/mapper/directives/classList/classList.html'
            }
        }
})();
