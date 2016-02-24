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
                    mutedText: '=',
                    onlyStrings: '=',
                    selectList: '='
                },
                templateUrl: 'modules/ontology-editor/directives/objectSelect/objectSelect.html',
                bindToController: {
                    bindModel: '=ngModel'
                },
                controllerAs: 'vm',
                controller: ['$scope', function($scope) {
                    var vm = this;

                    vm.id = $scope.$parent.vm.selected['@id'];

                    vm.getItemNamespace = function(item) {
                        return ontologyManagerService.getItemNamespace(item);
                    }

                    vm.getItemIri = function(item) {
                        return responseObj.getItemIri(item);
                    }
                }]
            }
        }
})();
