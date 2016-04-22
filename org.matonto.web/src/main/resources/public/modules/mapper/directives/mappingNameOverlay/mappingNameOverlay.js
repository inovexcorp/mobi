(function() {
    'use strict';

    angular
        .module('mappingNameOverlay', ['mappingManager'])
        .directive('mappingNameOverlay', mappingNameOverlay);

        function mappingNameOverlay() {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {
                    mappingName: '@',
                    close: '&',
                    set: '&'
                },
                templateUrl: 'modules/mapper/directives/mappingNameOverlay/mappingNameOverlay.html'
            }
        }
})();
