(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name finishOverlay
         * @requires  mappingManager
         * @requires  mapperState
         * @requires  delimitedManager
         *
         * @description 
         * The `finishOverlay` module only provides the `finishOverlay` directive which creates
         * an overlay with button to finish the mapping process and optionally save the mapping 
         * locally.
         */
        .module('finishOverlay', ['mapperState', 'mappingManager', 'delimitedManager'])
        /**
         * @ngdoc directive
         * @name finishOverlay.directive:finishOverlay
         * @scope
         * @restrict E
         * @requires  mappingManager.service:mappingManagerService
         * @requires  mapperState.service:mapperStateService
         * @requires  delimitedManager.service:delimitedManagerService
         *
         * @description 
         * `finishOverlay` is a directive that creates an overlay with button to finish the mapping 
         * process and optionally save the mapping locally. The directive is replaced by the contents 
         * of its template.
         */
        .directive('finishOverlay', finishOverlay);

        finishOverlay.$inject = ['mapperStateService', 'mappingManagerService', 'delimitedManagerService'];

        function finishOverlay(mapperStateService, mappingManagerService, delimitedManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {},
                controller: function() {
                    var dvm = this;
                    dvm.state = mapperStateService;
                    dvm.mm = mappingManagerService;
                    dvm.cm = delimitedManagerService;

                    dvm.save = function() {
                        dvm.mm.downloadMapping(dvm.mm.mapping.name);
                        dvm.finish();
                    }
                    dvm.finish = function() {
                        dvm.state.initialize();
                        dvm.state.resetEdit();
                        dvm.mm.mapping = undefined;
                        dvm.mm.sourceOntologies = [];
                        dvm.cm.reset();
                    }
                },
                templateUrl: 'modules/mapper/directives/finishOverlay/finishOverlay.html'
            }
        }
})();
