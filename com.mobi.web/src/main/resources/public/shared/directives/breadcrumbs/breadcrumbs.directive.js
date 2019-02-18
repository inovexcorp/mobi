(function() {
    'use strict';

    function breadcrumbs() {
        return {
            restrict: 'E',
            templateUrl: 'shared/directives/breadcrumbs/breadcrumbs.directive.html',
            replace: true,
            scope: {
                items: '<',
                onClick: '&'
            }
        }
    }

    angular
        /**
         * @ngdoc overview
         * @name breadcrumbs
         *
         * @description
         * The `breadcrumbs` module only provides the `breadcrumbs` directive which creates
         * the breadcrumb trail for the page you are currently viewing.
         */
        .module('breadcrumbs', [])
        /**
         * @ngdoc directive
         * @name breadcrumbs.directive:breadcrumbs
         * @scope
         * @restrict E
         *
         * @description
         * HTML contents which shows the breadcrumb trail for the current page.
         */
        .directive('breadcrumbs', breadcrumbs);
})();