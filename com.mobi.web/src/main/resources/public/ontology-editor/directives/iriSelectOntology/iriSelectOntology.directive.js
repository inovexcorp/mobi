(function() {
    'use strict';

    angular
        .module('iriSelectOntology', [])
        .directive('iriSelectOntology', iriSelectOntology);

        iriSelectOntology.$inject = ['ontologyStateService', 'ontologyUtilsManagerService'];

        function iriSelectOntology(ontologyStateService, ontologyUtilsManagerService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'ontology-editor/directives/iriSelectOntology/iriSelectOntology.directive.html',
                scope: {
                    displayText: '<',
                    mutedText: '<',
                    isDisabledWhen: '<',
                    isRequiredWhen: '<',
                    multiSelect: '<?',
                    onChange: '&'
                },
                bindToController: {
                    bindModel: '=ngModel',
                    selectList: '<'
                },
                controllerAs: 'dvm',
                controller: ['$scope', function($scope) {
                    var dvm = this;
                    var os = ontologyStateService;
                    $scope.multiSelect = angular.isDefined($scope.multiSelect) ? $scope.multiSelect : true;

                    dvm.ontoUtils = ontologyUtilsManagerService;
                    dvm.values = [];

                    dvm.getOntologyIri = function(iri) {
                        return _.get(dvm.selectList, "['" + iri + "']", os.listItem.ontologyId);
                    }
                    dvm.getValues = function(searchText) {
                        dvm.values = dvm.ontoUtils.getSelectList(_.keys(dvm.selectList), searchText, dvm.ontoUtils.getDropDownText);
                    }
                }]
            }
        }
})();
