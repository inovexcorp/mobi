(function() {
    'use strict';

    angular
        .module('stringSelect', ['customLabel', 'ontologyManager'])
        .directive('stringSelect', stringSelect);

        stringSelect.$inject = ['ontologyManagerService'];

        function stringSelect(ontologyManagerService) {
            return {
                restrict: 'E',
                scope: {
                    bindModel: '=ngModel',
                    changeEvent: '&',
                    displayText: '=',
                    excludeSelf: '=',
                    groupBy: '&',
                    onlyStrings: '=',
                    selectList: '=',
                    mutedText: '='
                },
                bindToController: {
                    bindModel: '=ngModel'
                },
                controllerAs: 'vm',
                controller: ['$scope', function($scope) {
                    var vm = this;

                    vm.getItemNamespace = function(item) {
                        return ontologyManagerService.getItemNamespace(item);
                    }
                }],
                templateUrl: 'directives/stringSelect/stringSelect.html'
            }
        }
})();
