(function() {
    'use strict';

    function spinner() {
        return {
            restrict: 'E',
            scope: {
                small: '<?'
            },
            template: '<div class="spinner"><div class="icon-wrapper"><i class="fa fa-spin fa-spinner" ng-class="{\'fa-4x\': !small}"></i></div></div>'
        };
    }

    angular
        /**
         * @ngdoc overview
         * @name spinner
         *
         * @description
         * The `spinner` module only provides the `spinner` directive which creates a spinning icon with
         * a transparent background that fills the containing element.
         */
        .module('spinner', [])
        /**
         * @ngdoc directive
         * @name spinner.directive:spinner
         * @restrict E
         *
         * @description
         * `spinner` is a directive that creates a spinning icon with a transparent background that fills
         * the containing the element. Spinner size is controller by the scope variable `small`.
         */
        .directive('spinner', spinner);
})();