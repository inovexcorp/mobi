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
                    ontologyId: '@',
                    classId: '=',
                    selectedProp: '=',
                    selectedColumn: '='
                },
                controller: function() {
                    var dvm = this;

                    dvm.getTitle = function() {
                        var className = ontologyManagerService.getEntityName(ontologyManagerService.getClass(dvm.ontologyId, dvm.classId));
                        var propName = ontologyManagerService.getEntityName(getClassProp());
                        return className + ': ' + propName;
                    }
                    dvm.isObjectProperty = function() {
                        return ontologyManagerService.isObjectProperty(_.get(getClassProp(), '@type', []), prefixes.owl);
                    }
                    function getClassProp() {
                        return ontologyManagerService.getClassProperty(dvm.ontologyId, dvm.classId, dvm.selectedProp);
                    }
                },
                templateUrl: 'modules/mapper/directives/editPropForm/editPropForm.html'
            }
        }
})();
