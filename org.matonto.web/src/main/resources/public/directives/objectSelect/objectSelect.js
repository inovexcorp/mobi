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
                    bindModel: '=ngModel',
                    changeEvent: '&',
                    displayText: '=',
                    excludeSelf: '=',
                    onlyStrings: '=',
                    selectList: '=',
                    mutedText: '='
                },
                templateUrl: 'directives/objectSelect/objectSelect.html',
                link: function($scope) {
                    $scope.group = function(item) {
                        return ontologyManagerService.getItemNamespace(item);
                    }
                }
            }
        }
})();
