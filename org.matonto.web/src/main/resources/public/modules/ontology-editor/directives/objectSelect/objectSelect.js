(function() {
    'use strict';

    angular
        .module('objectSelect', ['customLabel', 'ontologyManager', 'responseObj'])
        .directive('objectSelect', objectSelect);

        objectSelect.$inject = ['ontologyManagerService', 'responseObj'];

        function objectSelect(ontologyManagerService, responseObj) {
            return {
                restrict: 'E',
                scope: {
                    changeEvent: '&',
                    displayText: '=',
                    excludeSelf: '=',
                    onlyStrings: '=',
                    selectList: '=',
                    mutedText: '='
                },
                templateUrl: 'modules/ontology-editor/directives/objectSelect/objectSelect.html',
                bindToController: {
                    bindModel: '=ngModel'
                },
                controllerAs: 'dvm',
                controller: ['$scope', function($scope) {
                    var dvm = this,
                        vm = $scope.$parent.vm;

                    dvm.id = vm.selected['@id'];

                    dvm.getItemOntologyIri = function(item) {
                        return item.ontologyIri || vm.ontologies[vm.state.oi]['@id'];
                    }

                    dvm.getItemIri = function(item) {
                        return responseObj.getItemIri(item);
                    }
                }]
            }
        }
})();
