(function() {
    'use strict';

    function circleButton() {
        return {
            restrict: 'E',
            replace: true,
            scope: {
                btnIcon: '<',
                btnSmall: '<',
                displayText: '<'
            },
            templateUrl: 'shared/directives/circleButton/circleButton.directive.html'
        }
    }

    angular
        /**
         * @ngdoc overview
         * @name circleButton
         * 
         * @description
         * The `circleButton` module only provides the `circleButton` directive which
         * creates a circular button with a Font Awesome icon.
         */
        .module('circleButton', [])
        /**
         * @ngdoc directive
         * @name circleButton.directive:circleButton
         * @scope
         * @restrict E
         *
         * @description 
         * `circleButton` is a directive that creates a button element with the specified
         * Font Awesome icon and specified behavior. The directive is replaced with the 
         * content of the template. The button will always come styled as a Bootstrap primary 
         * button and the Font Awesome icon will always be a fixed width.
         *
         * @param {string} btnIcon the Font Awesome name of a specific icon
         * @param {boolean} [btnSmall=false] whether or not the button should be small
         * @param {boolean} displayText the text to get displayed on hover
         *
         * @usage
         * <!-- With only an icon -->
         * <circle-button btn-icon="fa-camera"></circle-button>
         *
         * <!-- With the other optional attributes -->
         * <circle-button btn-icon="fa-camera" btn-small="true" is-enabled="true" on-click="console.log('Hello world!')"></circle-button>
         */
        .directive('circleButton', circleButton);
})();
