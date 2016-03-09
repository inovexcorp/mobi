(function() {
    'use strict';

    angular
        .module('rangeClassDescription', ['prefixes', 'ontologyManager'])
        .directive('rangeClassDescription', rangeClassDescription);

        rangeClassDescription.$inject = ['prefixes', 'ontologyManagerService'];

        function rangeClassDescription(prefixes, ontologyManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {},
                bindToController: {
                    ontologyId: '=',
                    classId: '=',
                    selectedProp: '='
                },
                controller: function($scope) {
                    var dvm = this;
                    var rangeClass = ontologyManagerService.getClass(dvm.ontologyId, 
                        ontologyManagerService.getClassProperty(dvm.ontologyId, dvm.classId, dvm.selectedProp)[prefixes.rdfs + 'range'][0]['@id']);

                    $scope.$watch('dvm.selectedProp', function(oldval, newval) {
                        if (oldval !== newval) {
                            rangeClassObj = ontologyManagerService.getClass(dvm.ontologyId, 
                                ontologyManagerService.getClassProperty(dvm.ontologyId, dvm.classId, dvm.selectedProp)[prefixes.rdfs + 'range'][0]['@id']);
                        }
                    });

                    dvm.getRangeClassName = function() {
                        return ontologyManagerService.getEntityName(rangeClass);
                    }
                    dvm.getRangeClassDescription = function() {
                        return _.get(rangeClass, "['" + prefixes.rdfs + "comment'][0]['@value']", '');
                    }
                },
                templateUrl: 'modules/mapper/directives/rangeClassDescription/rangeClassDescription.html'
            }
        }
})();
