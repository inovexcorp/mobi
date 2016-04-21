(function() {
    'use strict';

    angular
        .module('startingClassSelectOverlay', ['ontologyManager'])
        .directive('startingClassSelectOverlay', startingClassSelectOverlay);

        startingClassSelectOverlay.$inject = ['ontologyManagerService'];

        function startingClassSelectOverlay(ontologyManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {
                    onClickBack: '&',
                    onClickContinue: '&'
                },
                bindToController: {
                    ontologies: '='
                },
                controller: function() {
                    var dvm = this;

                    dvm.getOntologyId = function(classObj) {
                        return _.get(ontologyManagerService.findOntologyWithClass(dvm.ontologies, classObj['@id']), '@id', '');
                    }
                    dvm.getClasses = function() {
                        var classes = [];
                        _.forEach(dvm.ontologies, function(ontology) {
                            classes = _.concat(classes, ontologyManagerService.getClasses(ontology));
                        });
                        return classes;
                    }
                    dvm.getName = function(classObj) {
                        return ontologyManagerService.getEntityName(classObj)
                    }
                },
                templateUrl: 'modules/mapper/directives/startingClassSelectOverlay/startingClassSelectOverlay.html'
            }
        }
})();
