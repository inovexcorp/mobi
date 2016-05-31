(function() {
    'use strict';

    angular
        .module('finishOverlay', ['mapperState', 'mappingManager', 'csvManager'])
        .directive('finishOverlay', finishOverlay);

        finishOverlay.$inject = ['mapperStateService', 'mappingManagerService', 'csvManagerService'];

        function finishOverlay(mapperStateService, mappingManagerService, csvManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {},
                controller: function() {
                    var dvm = this;
                    dvm.state = mapperStateService;
                    dvm.manager = mappingManagerService;
                    dvm.csv = csvManagerService;

                    dvm.save = function() {
                        dvm.manager.downloadMapping(dvm.manager.mapping.name);
                        dvm.finish();
                    }
                    dvm.finish = function() {
                        dvm.state.initialize();
                        dvm.state.resetEdit();
                        dvm.manager.mapping = undefined;
                        dvm.manager.sourceOntologies = [];
                        dvm.csv.reset();
                    }
                },
                templateUrl: 'modules/mapper/directives/finishOverlay/finishOverlay.html'
            }
        }
})();
