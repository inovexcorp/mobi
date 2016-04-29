(function() {
    'use strict';

    angular
        .module('settingsContainer', [])
        .directive('settingsContainer', settingsContainer);

        function settingsContainer() {
            return {
                restrict: 'E',
                replace: true,
                transclude: true,
                scope: {
                    header: '='
                },
                templateUrl: 'modules/settings/directives/settingsContainer/settingsContainer.html'
            }
        }
})();
