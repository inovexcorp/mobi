(function() {
    'use strict';

    disableAnimate.$inject = ['$animate'];

    function disableAnimate($animate) {
        return {
            restrict: 'A',
            link: function(scope, el) {
                $animate.enabled(el, false);
            }
        }
    }

    angular
        /**
         * @ngdoc overview
         * @name disableAnimate
         *
         * @description
         * The `disableAnimate` module only provides the `disableAnimate` directive which disabled ngAnimate on an
         * element.
         */
        .module('disableAnimate', [])
        /**
         * @ngdoc directive
         * @name disableAnimate.directive:disableAnimate
         * @restrict A
         * @requires $animate
         *
         * @description
         * `disableAnimate` is a directive that will disable ngAnimate on the parent element. This means that the
         * ngAnimate classes such as `.ng-enter` and `.ng-leave` will not be added to the element.
         */
        .directive('disableAnimate', disableAnimate);
})();