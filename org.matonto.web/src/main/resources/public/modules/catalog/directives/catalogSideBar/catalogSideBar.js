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
         * @requires $window
         *
         * @description 
         * `catalogSideBar` is a directive that creates a "left-nav" div with buttons for catalog
         * actions. The only action is opening the user guide for the catalog on the documentation 
         * site. The directive is replaced by the contents of its template.
         */
        .directive('catalogSideBar', catalogSideBar);

        catalogSideBar.$inject = ['$window'];

        function catalogSideBar($window) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {},
                controller: function() {
                    var dvm = this;

                    dvm.openDocs = function() {
                        $window.open("http://docs.matonto.org/#catalog");
                    }
                },
                templateUrl: 'modules/catalog/directives/catalogSideBar/catalogSideBar.html'
            }
        }
})();
