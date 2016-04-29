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
                templateUrl: 'modules/ontology-editor/directives/serializationSelect/serializationSelect.html'
            }
        }
})();
