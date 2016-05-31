(function() {
    'use strict';

    angular
        .module('rangeClassDescription', ['prefixes', 'ontologyManager', 'mappingManager'])
        .directive('rangeClassDescription', rangeClassDescription);

        rangeClassDescription.$inject = ['prefixes', 'ontologyManagerService', 'mappingManagerService'];

        function rangeClassDescription(prefixes, ontologyManagerService, mappingManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {},
                bindToController: {
                    classId: '@',
                    selectedPropId: '@'
                },
                controller: function() {
                    var dvm = this;
                    dvm.manager = mappingManagerService;
                    dvm.ontology = ontologyManagerService;

                    dvm.getRangeClassName = function() {
                        return dvm.ontology.getEntityName(getRangeClass());
                    }
                    dvm.getRangeClassDescription = function() {
                        return _.get(getRangeClass(), "['" + prefixes.rdfs + "comment'][0]['@value']", _.get(getRangeClass(), "['" + prefixes.dc + "description'][0]['@value']", ''));
                    }
                    function getRangeClass() {
                        var ontology = dvm.ontology.findOntologyWithClass(dvm.manager.sourceOntologies, dvm.classId);
                        var propObj = dvm.ontology.getClassProperty(ontology, dvm.classId, dvm.selectedPropId);
                        var rangeClassId = _.get(propObj, "['"+ prefixes.rdfs + "range'][0]['@id']");
                        return dvm.ontology.getClass(dvm.ontology.findOntologyWithClass(dvm.manager.sourceOntologies, rangeClassId), rangeClassId);
                    }
                },
                templateUrl: 'modules/mapper/directives/rangeClassDescription/rangeClassDescription.html'
            }
        }
})();
