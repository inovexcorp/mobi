(function() {
    'use strict';

    angular
        .module('customSelect', ['customLabel'])
        .directive('customSelect', customSelect);

        function customSelect() {
            return {
                restrict: 'E',
                transclude: true,
                scope: {
                    bindModel: '=ngModel',
                    changeEvent: '&',
                    displayText: '=',
                    excludeSelf: '=',
                    groupBy: '&',
                    selectList: '=',
                    mutedText: '='
                },
                templateUrl: 'directives/customSelect/customSelect.html'
            }
        }
})();
