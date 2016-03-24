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
                controller: function() {
                    var dvm = this;

                    dvm.getRangeClassName = function() {
                        return ontologyManagerService.getEntityName(getRangeClass());
                    }
                    dvm.getRangeClassDescription = function() {
                        return _.get(getRangeClass(), "['" + prefixes.rdfs + "comment'][0]['@value']", '');
                    }
                    function getRangeClass() {
                        var propObj = ontologyManagerService.getClassProperty(dvm.ontologyId, dvm.classId, dvm.selectedProp);
                        return ontologyManagerService.getClass(dvm.ontologyId, _.get(propObj, "['"+ prefixes.rdfs + "range'][0]['@id']"));
                    }
                },
                templateUrl: 'modules/mapper/directives/rangeClassDescription/rangeClassDescription.html'
            }
        }
})();
