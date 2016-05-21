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
                    dvm.previousMappingName = _.get(dvm.previousMappings, 0, '');
                }],
                templateUrl: 'modules/mapper/directives/mappingSelectOverlay/mappingSelectOverlay.html'
            }
        }
})();
