(function() {
    'use strict';

    angular
        .module('editClassForm', ['prefixes', 'ontologyManager'])
        .directive('editClassForm', editClassForm);

        editClassForm.$inject = ['prefixes', 'ontologyManagerService'];

        function editClassForm(prefixes, ontologyManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {
                    baseClassId: '=',
                    props: '=',
                    setBase: '&',
                    clickDelete: '&',
                    openProp: '&'
                },
                bindToController: {
                    ontologyId: '=',
                    classId: '='
                },
                controller: function($scope) {
                    var dvm = this;

                    dvm.getTitle = function() {
                        return ontologyManagerService.getEntityName(ontologyManagerService.getClass(dvm.ontologyId, dvm.classId));
                    }
                },
                templateUrl: 'modules/mapper/directives/editClassForm/editClassForm.html'
            }
        }
})();
