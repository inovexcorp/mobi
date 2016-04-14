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
                    ontology: '='
                },
                controller: function() {
                    var dvm = this;

                    dvm.getOntologyId = function(classObj) {
                        return dvm.ontology['@id'];
                    }
                    dvm.getClasses = function() {
                        return ontologyManagerService.getClasses(dvm.ontology);
                    }
                    dvm.getClass = function(classId) {
                        return ontologyManagerService.getClass(dvm.ontology, classId);
                    }
                    dvm.getName = function(classObj) {
                        return ontologyManagerService.getEntityName(classObj)
                    }
                },
                templateUrl: 'modules/mapper/directives/startingClassSelectOverlay/startingClassSelectOverlay.html'
            }
        }
})();
