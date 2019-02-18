(function() {
    'use strict';

    function actionMenuItem() {
        return {
            require: '^^actionMenu',
            restrict: 'E',
            replace: true,
            scope: {
                displayText: '<',
                icon: '<'
            },
            templateUrl: 'shared/directives/actionMenuItem/actionMenuItem.directive.html'
        };
    }

    angular
        /**
         * @ngdoc overview
         * @name actionMenu
         *
         * @description
         * The `actionMenu` module only provides the `actionMenu` directive which creates a link element for an
         * {@link actionMenu.directive:actionMenu}.
         */
        .module('actionMenuItem', [])
        /**
         * @ngdoc directive
         * @name actionMenu.directive:actionMenu
         * @scope
         * @restrict E
         *
         * @description
         * `actionMenu` is a directive that creates a link element to be used within an
         * {@link actionMenu.directive:actionMenu}. The directive expects text to be used for the link display along
         * with a Font Awesome class name for an icon display as well. The directive is replaced by the content of the
         * template.
         *
         * @param {string} displayText The text to be displayed for the action menu item
         * @param {string} icon A Font Awesome class name for an icon in the action menu item
         */
        .directive('actionMenuItem', actionMenuItem);
})();