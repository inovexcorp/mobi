(function() {
    'use strict';

    angular
        .module('serializationSelect', [])
        .directive('serializationSelect', serializationSelect);

        function serializationSelect() {
            return {
                restrict: 'E',
                replace: true,
                scope: {
                    bindModel: '=ngModel'
                },
                templateUrl: 'modules/ontology-editor/directives/serializationSelect/serializationSelect.html'
            }
        }
})();
