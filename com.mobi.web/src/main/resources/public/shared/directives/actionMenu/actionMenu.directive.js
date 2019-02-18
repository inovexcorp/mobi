(function() {
    'use strict';

    function actionMenu() {
        return {
            restrict: 'E',
            replace: true,
            transclude: true,
            scope: {},
            templateUrl: 'shared/directives/actionMenu/actionMenu.directive.html'
        };
    }

    angular
        /**
         * @ngdoc overview
         * @name actionMenu
         *
         * @description
         * The `actionMenu` module only provides the `actionMenu` directive which creates a div element with a
         * dropdown of actions.
         */
        .module('actionMenu', [])
        /**
         * @ngdoc directive
         * @name actionMenu.directive:actionMenu
         * @scope
         * @restrict E
         *
         * @description
         * `actionMenu` is a directive that creates a `uib-dropdown` div element that is meant to contain
         * {@link actionMenuItem.directive:actionMenuItem actionMenuItems} for performing various actions. Typically,
         * this directive should be used in a `.list-group-item`. The directive is replaced by the content of the
         * template.
         */
        .directive('actionMenu', actionMenu);
})();