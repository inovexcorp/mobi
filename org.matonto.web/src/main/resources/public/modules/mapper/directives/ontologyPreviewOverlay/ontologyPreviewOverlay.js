(function() {
    'use strict';

    angular
        .module('ontologyPreviewOverlay', ['ontologyManager', 'mapperState'])
        .directive('ontologyPreviewOverlay', ontologyPreviewOverlay);

        ontologyPreviewOverlay.$inject = ['ontologyManagerService', 'mapperStateService'];

        function ontologyPreviewOverlay(ontologyManagerService, mapperStateService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {
                    ontology: '='
                },
                controller: function() {
                    var dvm = this;
                    dvm.ontology = ontologyManagerService;
                    dvm.state = mapperStateService;
                },
                templateUrl: 'modules/mapper/directives/ontologyPreviewOverlay/ontologyPreviewOverlay.html'
            }
        }
})();
