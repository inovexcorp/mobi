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
                controllerAs: 'dvm',
                controller: ['$scope', function($scope) {
                    var dvm = this;

                    dvm.getItemNamespace = function(item) {
                        return ontologyManagerService.getItemNamespace(item);
                    }
                }],
                templateUrl: 'modules/ontology-editor/directives/stringSelect/stringSelect.html'
            }
        }
})();
