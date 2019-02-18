(function() {
    'use strict';

    function infoMessage() {
        return {
            restrict: 'E',
            replace: true,
            transclude: true,
            templateUrl: 'shared/directives/infoMessage/infoMessage.directive.html',
            scope: {}
        }
    }

    angular
        .module('infoMessage', [])
        .directive('infoMessage', infoMessage);
})();
