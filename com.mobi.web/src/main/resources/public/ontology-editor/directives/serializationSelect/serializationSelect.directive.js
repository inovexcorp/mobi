(function() {
    'use strict';

    angular
        .module('serializationSelect', [])
        .directive('serializationSelect', serializationSelect);

        function serializationSelect() {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'ontology-editor/directives/serializationSelect/serializationSelect.directive.html',
                scope: {
                    bindModel: '=ngModel'
                }
            }
        }
})();
