(function() {
    'use strict';

    angular
        .module('startingClassSelectOverlay', ['prefixes', 'ontologyManager'])
        .directive('startingClassSelectOverlay', startingClassSelectOverlay);

        startingClassSelectOverlay.$inject = ['prefixes', 'ontologyManagerService'];

        function startingClassSelectOverlay(prefixes, ontologyManagerService) {
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

                    dvm.getClasses = function(ontologyId) {
                        return ontologyManagerService.getClasses(ontologyId);
                    }
                    dvm.getClass = function(ontologyId, classId) {
                        return ontologyManagerService.getClass(ontologyId, classId);
                    }
                    dvm.createOptionName = function(classObj) {
                        return ontologyManagerService.getEntityName(classObj)
                    }
                },
                templateUrl: 'modules/mapper/directives/startingClassSelectOverlay/startingClassSelectOverlay.html'
            }
        }
})();
