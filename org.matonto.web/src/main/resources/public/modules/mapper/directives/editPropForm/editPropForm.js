(function() {
    'use strict';

    angular
        .module('editPropForm', ['prefixes', 'ontologyManager'])
        .directive('editPropForm', editPropForm);

        editPropForm.$inject = ['prefixes', 'ontologyManagerService'];

        function editPropForm(prefixes, ontologyManagerService) {
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
                    ontologyId: '=',
                    classId: '=',
                    selectedProp: '=',
                    selectedColumn: '='
                },
                controller: function($scope) {
                    var dvm = this;
                    var selectedPropObj = ontologyManagerService.getClassProperty(dvm.ontologyId, dvm.classId, dvm.selectedProp);

                    $scope.$watch('dvm.selectedProp', function(oldval, newval) {
                        if (oldval !== newval) {
                            selectedPropObj = ontologyManagerService.getClassProperty(dvm.ontologyId, dvm.classId, dvm.selectedProp);
                        }
                    });

                    dvm.getTitle = function() {
                        var className = ontologyManagerService.getEntityName(ontologyManagerService.getClass(dvm.ontologyId, dvm.classId));
                        var propName = ontologyManagerService.getEntityName(selectedPropObj);
                        return className + ': ' + propName;
                    }
                    dvm.isDatatypeProperty = function() {
                        return ontologyManagerService.isDatatypeProperty(selectedPropObj);
                    }
                    dvm.isObjectProperty = function() {
                        return ontologyManagerService.isObjectProp(selectedPropObj);
                    }
                },
                templateUrl: 'modules/mapper/directives/editPropForm/editPropForm.html'
            }
        }
})();
