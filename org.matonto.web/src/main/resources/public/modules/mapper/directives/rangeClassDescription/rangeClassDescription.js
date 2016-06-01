(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name rangeClassDescription
         * @requires  prefixes
         * @requires  ontologyManager
         * @requires  mappingManager
         *
         * @description 
         * The `rangeClassDescription` module only provides the `rangeClassDescription` directive 
         * which creates a brief description of the class an object property links to.
         */
        .module('rangeClassDescription', ['prefixes', 'ontologyManager', 'mappingManager'])
        /**
         * @ngdoc directive
         * @name rangeClassDescription.directive:rangeClassDescription
         * @scope
         * @restrict E
         * @requires  prefixes.prefixes
         * @requires  ontologyManager.service:ontologyManagerService
         * @requires  mappingManager.service:mappingManagerService
         *
         * @description 
         * `rangeClassDescription` is a directive which creates a div with the name of the class
         * an object property links to and a brief description of that class. The object property 
         * in question is determined using the class id of the parent class and the property id. 
         * The directive is replaced by the contents of its template.
         *
         * @param {string} classId the id of the parent class
         * @param {string} selectedPropId the id of the object property
         */
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
