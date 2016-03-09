(function() {
    'use strict';

    angular
        .module('ontologySelectOverlay', ['prefixes', 'ontologyManager'])
        .directive('ontologySelectOverlay', ontologySelectOverlay);

        ontologySelectOverlay.$inject = ['prefixes', 'ontologyManagerService'];

        function ontologySelectOverlay(prefixes, ontologyManagerService) {
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
                    
                    dvm.getOntologies = function() {
                        return ontologyManagerService.getList();
                    }
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
