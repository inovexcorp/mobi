(function() {
    'use strict';

    angular
        .module('ontologyPreview', ['prefixes'])
        .directive('ontologyPreview', ontologyPreview);

        ontologyPreview.$inject = ['prefixes'];

        function ontologyPreview(prefixes) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {},
                bindToController: {
                    ontology: '='
                },
                controller: function($filter) {
                    var dvm = this;
                    
                    dvm.createTitle = function() {
                        if (dvm.ontology) {
                            return dvm.ontology.hasOwnProperty(prefixes.rdfs + 'label') ? dvm.ontology[prefixes.rdfs + 'label'][0]['@value'] : $filter('beautify')($filter('splitIRI')(dvm.ontology['@id']).end);
                        }
                        return '';
                    }
                    dvm.createDescription = function() {
                        if (dvm.ontology) {
                            if (dvm.ontology.hasOwnProperty(prefixes.dc + 'description')) {
                                return dvm.ontology[prefixes.dc + 'description'][0]['@value'];
                            }
                        }
                        return '';
                    }
                    dvm.createClassSubList = function() {
                        if (dvm.ontology) {
                            return dvm.ontology.matonto.classes.slice(0, 6).map(function(classObj) {
                                return classObj.hasOwnProperty(prefixes.rdfs + 'label') ? classObj[prefixes.rdfs + 'label'][0]["@value"] : $filter('beautify')($filter('splitIRI')(classObj['@id']).end);
                            });
                        }
                        return [];
                    }
                },
                templateUrl: 'modules/mapper/directives/ontologyPreview/ontologyPreview.html'
            }
        }
})();
