(function() {
    'use strict';
    
    angular
        /**
         * @ngdoc overview
         * @name discoverTabset
         *
         * @description
         * The `discoverTabset` module only provides the `discoverTabset` directive which creates
         * the discover tabset.
         */
        .module('discoverTabset', [])
        /**
         * @ngdoc directive
         * @name discoverTabset.directive:discoverTabset
         * @scope
         * @restrict E
         * @requires discoverState.service:discoverStateService
         *
         * @description
         * HTML contents in the discover tabset which contains the explore and query tabs.
         */
        .directive('discoverTabset', discoverTabset);
        
    discoverTabset.$inject = ['discoverStateService'];
        
    function discoverTabset(discoverStateService) {
        return {
            restrict: 'E',
            templateUrl: 'discover/directives/discoverTabset/discoverTabset.directive.html',
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