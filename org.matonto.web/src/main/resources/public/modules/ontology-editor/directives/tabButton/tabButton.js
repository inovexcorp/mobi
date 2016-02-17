(function() {
    'use strict';

    angular
        .module('tabButton', [])
        .directive('tabButton', tabButton);

        function tabButton() {
            return {
                restrict: 'E',
                replace: true,
                scope: {
                    displayText: '=',
                    isActive: '=',
                    onClick: '&'
                },
                templateUrl: 'modules/ontology-editor/directives/tabButton/tabButton.html'
            }
        }
})();
