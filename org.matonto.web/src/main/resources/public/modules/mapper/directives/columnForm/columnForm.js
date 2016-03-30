(function() {
    'use strict';

    angular
        .module('columnForm', [])
        .directive('columnForm', columnForm);

        function columnForm() {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {
                    set: '&',
                    setNext: '&',
                    lastProp: '='
                },
                bindToController: {
                    columns: '=',
                    selectedColumn: '='
                },
                controller: angular.noop,
                templateUrl: 'modules/mapper/directives/columnForm/columnForm.html'
            }
        }
})();
