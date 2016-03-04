(function() {
    'use strict';

    angular
        .module('baseClassSelectOverlay', ['prefixes', 'ontologyManager'])
        .directive('baseClassSelectOverlay', baseClassSelectOverlay);

        baseClassSelectOverlay.$inject = ['prefixes', 'ontologyManagerService'];

        function baseClassSelectOverlay(prefixes, ontologyManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {
                    onClickBack: '&',
                    onClickContinue: '&'
                },
                bindToController: {
                    ontologyId: '='
                },
                controller: function($filter) {
                    var dvm = this;

                    dvm.getClasses = function(ontologyId) {
                        return ontologyManagerService.getClasses(ontologyId);
                    }
                    dvm.getClass = function(ontologyId, classId) {
                        return ontologyManagerService.getClass(ontologyId, classId);
                    }
                    dvm.createOptionName = function(classObj) {
                        return classObj.hasOwnProperty(prefixes.rdfs + 'label') ? classObj[prefixes.rdfs + 'label'][0]['@value'] : $filter('beautify')($filter('splitIRI')(classObj['@id']).end);
                    }
                },
                templateUrl: 'modules/mapper/directives/baseClassSelectOverlay/baseClassSelectOverlay.html'
            }
        }
})();
