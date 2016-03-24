(function() {
    'use strict';

    angular
        .module('ontologySelectOverlay', ['ontologyManager'])
        .directive('ontologySelectOverlay', ontologySelectOverlay);

        ontologySelectOverlay.$inject = ['ontologyManagerService'];

        function ontologySelectOverlay(ontologyManagerService) {
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
                    dvm.ontologies = ontologyManagerService.getList();
                    
                    dvm.getOntologyById = function(ontologyId) {
                        return ontologyManagerService.getOntologyById(ontologyId);
                    }
                    dvm.createOptionName = function(ontology) {
                        return ontologyManagerService.getEntityName(ontology);
                    }
                },
                templateUrl: 'modules/mapper/directives/ontologySelectOverlay/ontologySelectOverlay.html'
            }
        }
})();
