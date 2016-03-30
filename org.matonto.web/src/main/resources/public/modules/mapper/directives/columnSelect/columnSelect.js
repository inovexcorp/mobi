(function() {
    'use strict';

    angular
        .module('columnSelect', [])
        .directive('columnSelect', columnSelect);

        function columnSelect() {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {
                    columns: '='
                },
                bindToController: {
                    selectedColumn: '='
                },
                controller: angular.noop,
                templateUrl: 'modules/mapper/directives/columnSelect/columnSelect.html'
            }
        }
})();
