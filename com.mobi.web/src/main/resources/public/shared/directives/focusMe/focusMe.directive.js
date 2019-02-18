(function() {
    'use strict';

    function focusMe() {
        return {
            restrict: 'A',
            link: function(scope, elem, attrs) {
                scope.$watch(attrs.focusMe, function(newValue) {
                    newValue && elem[0].focus()
                });
            }
        }
    }

    angular
        /**
         * @ngdoc overview
         * @name focusMe
         *
         * @description
         * The `focusMe` module provides the `focusMe` directive which provides a way to focus an element when it
         * becomes visible.
         */
        .module('focusMe', [])
        /**
         * @ngdoc directive
         * @name focusMe.directive:focusMe
         * @restrict A
         *
         * @description
         * `focusMe` is a directive that sets the focus of the element it is set on when it becomes visible if the
         * directive value is set to true.
         */
        .directive('focusMe', focusMe);
})();