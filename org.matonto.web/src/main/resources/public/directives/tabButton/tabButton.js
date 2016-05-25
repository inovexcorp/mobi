(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name tabButton
         *
         * @description 
         * The `tabButton` module only provides the `tabButton` directive which creates
         * a anchor with small transcluded content and a custom on click function
         */
        .module('tabButton', [])
        /**
         * @ngdoc directive
         * @name tabButton.directive:tabButton
         * @scope
         * @restrict E
         *
         * @description 
         * `tabButton` is a directive that creates a anchor with small transcluded content 
         * and a custom on click function. If the button is "active", the "active" class is 
         * applied. This directive is intended to be used for a tab button at the top of a 
         * div. The directive is replaced by the content of the template.
         * 
         * @param {boolean=false} isActive Whether the button should have the "active" class
         * @param {function} onClick A function to be called when the anchor is clicked
         *
         * @usage
         * <tab-button is-active="false" on-click="console.log('Clicked')"></tab-button>
         */
        .directive('tabButton', tabButton);

        function tabButton() {
            return {
                require: '^tabContainer',
                restrict: 'E',
                replace: true,
                transclude: true,
                scope: {
                    isActive: '=',
                    onClick: '&'
                },
                templateUrl: 'directives/tabButton/tabButton.html'
            }
        }
})();
