(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name catalogSideBar
         *
         * @description
         * The `catalogSideBar` module only provides the `catalogSideBar` directive which
         * creates a left navigation of action buttons for the catalog.
         */
        .module('catalogSideBar', [])
        /**
         * @ngdoc directive
         * @name catalogSideBar.directive:catalogSideBar
         * @scope
         * @restrict E
         *
         * @description 
         * `catalogSideBar` is a directive that creates a "left-nav" div with buttons for catalog
         * actions. There are currently no actions for the catalog.
         */
        .directive('catalogSideBar', catalogSideBar);

        function catalogSideBar() {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                scope: {},
                templateUrl: 'modules/catalog/directives/catalogSideBar/catalogSideBar.html'
            }
        }
})();
