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
                    ontologyId: '@'
                },
                controller: function() {
                    var dvm = this;

                    dvm.getOntologyId = function(classObj) {
                        return dvm.ontologyId;
                    }
                    dvm.getClasses = function(ontologyId) {
                        return ontologyManagerService.getClasses(ontologyId);
                    }
                    dvm.getClass = function(ontologyId, classId) {
                        return ontologyManagerService.getClass(ontologyId, classId);
                    }
                    dvm.getName = function(classObj) {
                        return ontologyManagerService.getEntityName(classObj)
                    }
                },
                templateUrl: 'modules/mapper/directives/startingClassSelectOverlay/startingClassSelectOverlay.html'
            }
        }
})();
