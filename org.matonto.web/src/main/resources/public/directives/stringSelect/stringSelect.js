(function() {
    'use strict';

    angular
        .module('stringSelect', ['customLabel'])
        .directive('stringSelect', stringSelect);

        function stringSelect() {
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
                controller: function() {},
                templateUrl: 'directives/stringSelect/stringSelect.html'
            }
        }
})();
