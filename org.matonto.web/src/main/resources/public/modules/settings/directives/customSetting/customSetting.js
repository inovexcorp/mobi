(function() {
    'use strict';

    angular
        .module('customSetting', [])
        .directive('customSetting', customSetting);

        function customSetting() {
            return {
                restrict: 'E',
                replace: true,
                transclude: true,
                scope: {
                    header: '=',
                    question: '='
                },
                templateUrl: 'modules/settings/directives/customSetting/customSetting.html'
            }
        }
})();
