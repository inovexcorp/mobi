(function() {
    'use strict';

    angular
        .module('ontologyPreview', ['prefixes', 'ontologyManager'])
        .directive('ontologyPreview', ontologyPreview);

        ontologyPreview.$inject = ['prefixes', 'ontologyManagerService'];

        function ontologyPreview(prefixes, ontologyManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {},
                bindToController: {
                    ontology: '='
                },
                controller: function() {
                    var dvm = this;
                    
                    dvm.createTitle = function() {
                        return ontologyManagerService.getEntityName(dvm.ontology);
                    }
                    dvm.createDescription = function() {
                        return _.get(dvm.ontology, "['" + prefixes.dc + "description'][0]['@value']");
                    }
                    dvm.createClassSubList = function() {
                        return _.map(_.slice(_.get(dvm.ontology, 'matonto.classes'), 0, 5), function(classObj) {
                            return ontologyManagerService.getEntityName(classObj);
                        });
                    }
                },
                templateUrl: 'modules/mapper/directives/ontologyPreview/ontologyPreview.html'
            }
        }
})();
