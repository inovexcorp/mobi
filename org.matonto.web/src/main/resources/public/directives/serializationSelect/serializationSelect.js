(function() {
    'use strict';

    angular
        .module('serializationSelect', [])
        .directive('serializationSelect', serializationSelect);

        function serializationSelect() {
            return {
                restrict: 'E',
                scope: {
                    bindModel: '=ngModel'
                },
                templateUrl: 'directives/serializationSelect/serializationSelect.html'
            }
        }
})();
