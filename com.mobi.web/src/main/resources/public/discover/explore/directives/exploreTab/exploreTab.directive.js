(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name exploreTab
         *
         * @description
         * The `exploreTab` module only provides the `exploreTab` directive which creates
         * the tab containing the explore page for viewing dataset details.
         */
        .module('exploreTab', [])
        /**
         * @ngdoc directive
         * @name sparqlResultTable.directive:exploreTab
         * @scope
         * @restrict E
         * @requires discoverState.service:discoverStateService
         *
         * @description
         * HTML contents in the explore tab which contains either the class or instance cards
         * depending on the step you are currently viewing.
         */
        .directive('exploreTab', exploreTab);
        
        exploreTab.$inject = ['discoverStateService'];

        function exploreTab(discoverStateService) {
            return {
                restrict: 'E',
                templateUrl: 'discover/explore/directives/exploreTab/exploreTab.directive.html',
                replace: true,
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    this.ds = discoverStateService;
                }
            }
        }
})();