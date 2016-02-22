(function() {
    'use strict';

    angular
        .module('objectSelect', ['customLabel', 'ontologyManager'])
        .directive('objectSelect', objectSelect);

        objectSelect.$inject = ['ontologyManagerService'];

        function objectSelect(ontologyManagerService) {
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
                templateUrl: 'directives/objectSelect/objectSelect.html',
                bindToController: {
                    bindModel: '=ngModel'
                },
                controllerAs: 'vm',
                controller: ['$scope', function($scope) {
                    var vm = this;
                    vm.getItemNamespace = function(item) {
                        return ontologyManagerService.getItemNamespace(item);
                    }
                }]
            }
        }
})();
