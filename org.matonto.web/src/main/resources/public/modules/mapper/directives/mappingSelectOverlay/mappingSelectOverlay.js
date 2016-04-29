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
                controller: ['$scope', function($scope) {
                    var dvm = this;
                    dvm.previousMappings = mappingManagerService.previousMappingNames;

                    dvm.updateMappingName = function() {
                        dvm.previousMappingName = (dvm.mappingType === 'new') ? '' : dvm.previousMappings[0];
                        dvm.newMappingName = '';
                    }
                }],
                templateUrl: 'modules/mapper/directives/mappingSelectOverlay/mappingSelectOverlay.html'
            }
        }
})();
