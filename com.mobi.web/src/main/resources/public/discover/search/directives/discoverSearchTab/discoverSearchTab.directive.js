(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name discoverSearchTab
         *
         * @description
         * The `discoverSearchTab` module only provides the `discoverSearchTab` directive which creates
         * the search tab within the discover page.
         */
        .module('discoverSearchTab', [])
        /**
         * @ngdoc directive
         * @name discoverSearchTab.directive:discoverSearchTab
         * @scope
         * @restrict E
         *
         * @description
         * HTML contents in the search tab within the discover page which gives the users the option to
         * create a SPARQL query using the provided inputs.
         */
        .directive('discoverSearchTab', discoverSearchTab);

        discoverSearchTab.$inject = ['discoverStateService'];

        function discoverSearchTab(discoverStateService) {
            return {
                restrict: 'E',
                templateUrl: 'discover/search/directives/discoverSearchTab/discoverSearchTab.directive.html',
                replace: true,
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    dvm.ds = discoverStateService;
                }
            }
        }
})();