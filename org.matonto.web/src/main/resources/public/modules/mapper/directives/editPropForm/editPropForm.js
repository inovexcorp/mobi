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
                    classMappingId: '=',
                    selectedPropMapping: '=',
                    selectedColumn: '='
                },
                controller: function() {
                    var dvm = this;
                    dvm.ontologyId = mappingManagerService.getSourceOntologyId(dvm.mapping);

                    dvm.getClassId = function() {
                        return mappingManagerService.getClassIdByMappingId(dvm.mapping, dvm.classMappingId);
                    }
                    dvm.getPropId = function() {
                        return mappingManagerService.getPropIdByMappingId(dvm.mapping, dvm.selectedPropMapping);
                    }
                    dvm.getTitle = function() {
                        var classId = dvm.getClassId();
                        var propId = dvm.getPropId();
                        var className = ontologyManagerService.getEntityName(ontologyManagerService.getClass(dvm.ontologyId, classId));
                        var propName = ontologyManagerService.getEntityName(getClassProp(classId, propId));
                        return className + ': ' + propName;
                    }
                    dvm.isObjectProperty = function() {
                        var classId = dvm.getClassId();
                        var propId = dvm.getPropId();
                        return ontologyManagerService.isObjectProperty(_.get(getClassProp(classId, propId), '@type', []));
                    }
                    function getClassProp(classId, propId) {
                        return ontologyManagerService.getClassProperty(dvm.ontologyId, classId, propId);
                    }
                },
                templateUrl: 'modules/mapper/directives/editPropForm/editPropForm.html'
            }
        }
})();
