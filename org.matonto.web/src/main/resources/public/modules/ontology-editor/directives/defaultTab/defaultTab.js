(function() {
    'use strict';

    angular
        .module('defaultTab', [])
        .directive('defaultTab', defaultTab);

        function defaultTab() {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/defaultTab/defaultTab.html',
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;

                    dvm.featureList = [
                        'Upload and download turtle, RDF/XML, and OWL/XML ontology serializations.',
                        'View the ontology in four different tree views which show everything, classes only, object properties only, and datatype properties only.',
                        'Create a new ontology which is persisted in the repository and can be downloaded in supported serializations.',
                        'Add classes and/or properties to uploaded ontologies.',
                        'Add common or custom annotations to your ontologies, classes, and properties.',
                        'Delete ontologies from your repository.',
                        'Open and close ontologies to show or hide them from your view without deletion.',
                        'Select axiom values from all imported ontologies.',
                        'Set axioms on classes and/or properties with a searchable list of options sorted by ontology IRI.',
                        'Preview the current changes to your ontology in supported serializations.',
                        'View blank node values in an easy to read format for the following: restrictions, unions, and intersections.'
                    ]
                }
            }
        }
})();
