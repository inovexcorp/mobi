(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name mappingTitle
         *
         * @description
         * The `mappingTitle` module only provides the `mappingTitle` directive
         * which creates a div containing the name of the current
         * {@link mapperState.service:mapperStateService#mapping mapping}.
         */
        .module('mappingTitle', [])
        /**
         * @ngdoc directive
         * @name mappingTitle.directive:mappingTitle
         * @scope
         * @restrict E
         * @requires  mapperState.service:mapperStateService
         *
         * @description
         * `mappingTitle` is a directive which creates a div with the name of the current
         * {@link mapperState.service:mapperStateService#mapping mapping}.
         */
        .directive('mappingTitle', mappingTitle);

        mappingTitle.$inject = ['mapperStateService'];

        function mappingTitle(mapperStateService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {},
                controller: function() {
                    var dvm = this;
                    dvm.state = mapperStateService;
                },
                templateUrl: 'mapper/directives/mappingTitle/mappingTitle.directive.html'
            }
        }
})();
