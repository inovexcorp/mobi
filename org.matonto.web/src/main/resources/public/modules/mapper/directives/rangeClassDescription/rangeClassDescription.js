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
                    ontologies: '=',
                    classId: '@',
                    selectedProp: '@'
                },
                controller: function() {
                    var dvm = this;

                    dvm.getRangeClassName = function() {
                        return ontologyManagerService.getEntityName(getRangeClass());
                    }
                    dvm.getRangeClassDescription = function() {
                        return _.get(getRangeClass(), "['" + prefixes.rdfs + "comment'][0]['@value']", _.get(dvm.ontology, "['" + prefixes.dc + "description'][0]['@value']", ''));
                    }
                    function getRangeClass() {
                        var ontology = ontologyManagerService.findOntologyWithClass(dvm.ontologies, dvm.classId);
                        var propObj = ontologyManagerService.getClassProperty(ontology, dvm.classId, dvm.selectedProp);
                        var rangeClassId = _.get(propObj, "['"+ prefixes.rdfs + "range'][0]['@id']");
                        return ontologyManagerService.getClass(ontologyManagerService.findOntologyWithClass(dvm.ontologies, rangeClassId), rangeClassId);
                    }
                },
                templateUrl: 'modules/mapper/directives/rangeClassDescription/rangeClassDescription.html'
            }
        }
})();
