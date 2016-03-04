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
                controller: function($filter) {
                    var dvm = this;
                    
                    dvm.getOntologies = function() {
                        return ontologyManagerService.getList();
                    }
                    dvm.getOntologyById = function(ontologyId) {
                        return ontologyManagerService.getOntologyById(ontologyId);
                    }
                    dvm.createOptionName = function(ontology) {
                        return ontology.hasOwnProperty(prefixes.rdfs + 'label') ? ontology[prefixes.rdfs + 'label'][0]['@value'] : $filter('beautify')($filter('splitIRI')(ontology['@id']).end);
                    }
                },
                templateUrl: 'modules/mapper/directives/ontologySelectOverlay/ontologySelectOverlay.html'
            }
        }
})();
