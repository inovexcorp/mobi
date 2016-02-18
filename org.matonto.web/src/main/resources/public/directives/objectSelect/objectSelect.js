(function() {
    'use strict';

    angular
        .module('objectSelect', ['customLabel'])
        .directive('objectSelect', objectSelect);

        function objectSelect() {
            return {
                restrict: 'E',
                transclude: true,
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
                templateUrl: 'directives/objectSelect/objectSelect.html'
            }
        }
})();
