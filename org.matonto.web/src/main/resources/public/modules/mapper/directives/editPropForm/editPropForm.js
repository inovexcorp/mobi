(function() {
    'use strict';

    angular
        .module('editPropForm', ['ontologyManager', 'mappingManager'])
        .directive('editPropForm', editPropForm);

        editPropForm.$inject = ['ontologyManagerService', 'mappingManagerService'];

        function editPropForm(ontologyManagerService, mappingManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {
                    columns: '=',
                    set: '&',
                    clickDelete: '&'
                },
                bindToController: {
                    mapping: '=',
                    ontologies: '=',
                    classMappingId: '=',
                    selectedPropMapping: '=',
                    selectedColumn: '='
                },
                controller: function() {
                    var dvm = this;

                    dvm.getClassId = function() {
                        return mappingManagerService.getClassIdByMappingId(dvm.mapping, dvm.classMappingId);
                    }
                    dvm.getPropId = function() {
                        return mappingManagerService.getPropIdByMappingId(dvm.mapping, dvm.selectedPropMapping);
                    }
                    dvm.getTitle = function() {
                        var classId = dvm.getClassId();
                        var ontology = ontologyManagerService.findOntologyWithClass(dvm.ontologies, classId);
                        var className = ontologyManagerService.getEntityName(ontologyManagerService.getClass(ontology, classId));
                        var propName = ontologyManagerService.getEntityName(getClassProp(classId, dvm.getPropId()));
                        return className + ': ' + propName;
                    }
                    dvm.isObjectProperty = function() {
                        return ontologyManagerService.isObjectProperty(_.get(getClassProp(dvm.getClassId(), dvm.getPropId()), '@type', []));
                    }
                    function getClassProp(classId, propId) {
                        var ontology = ontologyManagerService.findOntologyWithClass(dvm.ontologies, classId);
                        return ontologyManagerService.getClassProperty(ontology, classId, propId);
                    }
                },
                templateUrl: 'modules/mapper/directives/editPropForm/editPropForm.html'
            }
        }
})();
