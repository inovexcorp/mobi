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
                    dvm.numClassPreview = 5;
                    dvm.full = false;

                    dvm.createTitle = function() {
                        return ontologyManagerService.getEntityName(dvm.ontology);
                    }
                    dvm.createDescription = function() {
                        return _.get(dvm.ontology, "['" + prefixes.dc + "description'][0]['@value']", '');
                    }
                    dvm.getClasses = function() {
                        return ontologyManagerService.getClasses(dvm.ontology);
                    }
                    dvm.getClassList = function() {
                        var classes = dvm.getClasses();
                        if (!dvm.full) {
                            classes = _.take(classes, dvm.numClassPreview);
                        }
                        return _.map(classes, function(classObj) {
                            return ontologyManagerService.getEntityName(classObj);
                        });
                    }
                },
                templateUrl: 'modules/mapper/directives/ontologyPreview/ontologyPreview.html'
            }
        }
})();
