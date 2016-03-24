(function() {
    'use strict';

    angular
        .module('editClassForm', ['ontologyManager'])
        .directive('editClassForm', editClassForm);

        editClassForm.$inject = ['ontologyManagerService'];

        function editClassForm(ontologyManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {
                    props: '=',
                    isLastClass: '=',
                    setBase: '&',
                    clickDelete: '&',
                    openProp: '&'
                },
                bindToController: {
                    ontologyId: '@',
                    classId: '='
                },
                controller: function() {
                    var dvm = this;

                    dvm.getTitle = function() {
                        return ontologyManagerService.getEntityName(ontologyManagerService.getClass(dvm.ontologyId, dvm.classId));
                    }
                },
                templateUrl: 'modules/mapper/directives/editClassForm/editClassForm.html'
            }
        }
})();
