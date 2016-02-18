(function() {
    'use strict';

    angular
        .module('stringSelect', ['customLabel'])
        .directive('stringSelect', stringSelect);

        function stringSelect() {
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
                templateUrl: 'directives/stringSelect/stringSelect.html'
            }
        }
})();
