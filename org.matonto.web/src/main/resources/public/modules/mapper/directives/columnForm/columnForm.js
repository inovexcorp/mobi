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
                    selectedColumn: '=ngModel'
                },
                controller: function() {
                    var dvm = this;
                },
                templateUrl: 'modules/mapper/directives/columnForm/columnForm.html'
            }
        }
})();
