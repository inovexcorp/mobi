(function() {
    'use strict';

    angular
        .module('ontologyPreviewOverlay', ['ontologyManager'])
        .directive('ontologyPreviewOverlay', ontologyPreviewOverlay);

        ontologyPreviewOverlay.$inject = ['ontologyManagerService'];

        function ontologyPreviewOverlay(ontologyManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {
                    close: '&'
                },
                bindToController: {
                    ontologyId: '@'
                },
                controller: function() {
                    var dvm = this;
                    dvm.ontology = ontologyManagerService.getOntologyById(dvm.ontologyId);
                    dvm.name = ontologyManagerService.getEntityName(dvm.ontology);
                },
                templateUrl: 'modules/mapper/directives/ontologyPreviewOverlay/ontologyPreviewOverlay.html'
            }
        }
})();
