(function() {
    'use strict';

    function materialTab() {
        return {
            restrict: 'E',
            require: '^^materialTabset',
            transclude: true,
            replace: true,
            scope: {
                active: '=?',
                hideTab: '<?',
                heading: '<',
                onClick: '&'
            },
            templateUrl: 'shared/directives/materialTab/materialTab.directive.html',
            link: function(scope, elem, attr, materialTabsetController) {
                materialTabsetController.addTab(scope);
                scope.$on('$destroy', function() {
                    materialTabsetController.removeTab(scope);
                });
            }
        }
    }

    angular
        /**
         * @ngdoc overview
         * @name materialTab
         *
         * @description
         * The `materialTab` module provides the `materialTab` directive which creates a tab for use within a
         * {@link materialTabset.directive:materialTabset}.
         */
        .module('materialTab', [])
        /**
         * @ngdoc directive
         * @name materialTab.directive:materialTab
         * @scope
         * @restrict E
         *
         * @description
         * `materialTab` is a directive that creates a `div` containing transluded content. It is meant to be used as
         * a child of the {@link materialTabset.directive:materialTabset} directive. The data provided on this
         * directive is used to populate behavior in the headers generated in the `materialTabset`. This includes
         * whether or not the tab is active, the heading text, whether the tab should be hidden, and the click behavior.
         * The directive is replaced by the contents of its template.
         */
        .directive('materialTab', materialTab);
})();
