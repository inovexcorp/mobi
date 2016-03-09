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
                    columns: '=',
                    selectedColumn: '='
                },
                controller: function() {
                    var dvm = this;
                },
                templateUrl: 'modules/mapper/directives/columnSelect/columnSelect.html'
            }
        }
})();
