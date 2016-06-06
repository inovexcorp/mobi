(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name invalidOntologyOverlay
         * @requires  mappingManager
         * @requires  mapperState
         *
         * @description 
         * The `invalidOntologyOverlay` module only provides the `invalidOntologyOverlay` directive which creates
         * an overlay telling the user that the source ontology for a mapping is incompatible.
         */
        .module('invalidOntologyOverlay', ['mapperState', 'mappingManager'])
        /**
         * @ngdoc directive
         * @name invalidOntologyOverlay.directive:invalidOntologyOverlay
         * @scope
         * @restrict E
         * @requires  mappingManager.service:mappingManagerService
         * @requires  mapperState.service:mapperStateService
         *
         * @description 
         * `invalidOntologyOverlay` is a directive that creates an overlay with a message telling the user that the
         * source ontology for a mapping is incompatible. The directive is replaced by the contents of its template.
         */
        .directive('invalidOntologyOverlay', invalidOntologyOverlay);

        invalidOntologyOverlay.$inject = ['mapperStateService', 'mappingManagerService'];

        function invalidOntologyOverlay(mapperStateService, mappingManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {},
                controller: function() {
                    var dvm = this;
                    dvm.state = mapperStateService;
                    dvm.manager = mappingManagerService;

                    dvm.close = function() {
                        dvm.state.initialize();
                        dvm.state.invalidOntology = false;
                        dvm.manager.mapping = undefined;
                        dvm.manager.sourceOntologies = [];
                    }
                },
                templateUrl: 'modules/mapper/directives/invalidOntologyOverlay/invalidOntologyOverlay.html'
            }
        }
})();
