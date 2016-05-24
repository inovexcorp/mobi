(function() {
    'use strict';

    angular
        .module('defaultTab', [])
        .directive('defaultTab', defaultTab);

        function defaultTab() {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/defaultTab/defaultTab.html'
            }
        }
})();
