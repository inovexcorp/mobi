(function() {
    'use strict';

    angular
        .module('propertyValues', [])
        .directive('propertyValues', propertyValues);

        propertyValues.$inject = ['ontologyUtilsManagerService', 'ontologyStateService', 'ontologyManagerService'];

        function propertyValues(ontologyUtilsManagerService, ontologyStateService, ontologyManagerService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'ontology-editor/directives/propertyValues/propertyValues.directive.html',
                scope: {},
                bindToController: {
                    property: '<',
                    entity: '<',
                    edit: '&?',
                    remove: '&?',
                    highlightIris: '<',
                    highlightText: '<'
                },
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    dvm.om = ontologyManagerService;
                    dvm.ontoUtils = ontologyUtilsManagerService;
                    dvm.os = ontologyStateService;

                    dvm.valueInList = function() {
                        return _.includes(dvm.highlightIris, dvm.property);
                    }
                }
            }
        }
})();
