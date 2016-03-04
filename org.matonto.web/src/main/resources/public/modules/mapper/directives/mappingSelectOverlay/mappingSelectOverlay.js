(function() {
    'use strict';

    angular
        .module('mappingSelectOverlay', ['mappingManager'])
        .directive('mappingSelectOverlay', mappingSelectOverlay);

        mappingSelectOverlay.$inject = ['mappingManagerService'];

        function mappingSelectOverlay(mappingManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {
                    onClickBack: '&',
                    onClickContinue: '&'
                },
                controller: function() {
                    var dvm = this;
                },
                templateUrl: 'modules/mapper/directives/mappingSelectOverlay/mappingSelectOverlay.html'
            }
        }
})();
