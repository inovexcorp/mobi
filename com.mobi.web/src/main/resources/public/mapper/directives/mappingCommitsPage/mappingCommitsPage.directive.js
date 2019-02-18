(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name mappingCommitsPage
         *
         * @description
         * The `mappingCommitsPage` module only provides the `mappingCommitsPage` directive which creates
         * a Bootstrap `row` with {@link block.directive:block blocks} for editing the current
         * {@link mapperState.service:mapperStateService#mapping mapping}.
         */
        .module('mappingCommitsPage', [])
        /**
         * @ngdoc directive
         * @name mappingCommitsPage.directive:mappingCommitsPage
         * @scope
         * @restrict E
         * @requires mapperState.service:mapperStateService
         * @requires util.service:utilService
         * @requires prefixes.service:prefixes
         *
         * @description
         * 
         */
        .directive('mappingCommitsPage', mappingCommitsPage);

        mappingCommitsPage.$inject = ['mapperStateService', 'utilService', 'prefixes'];

        function mappingCommitsPage(mapperStateService, utilService, prefixes) {
            return {
                restrict: 'E',
                replace: true,
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    dvm.prefixes = prefixes;
                    dvm.util = utilService;
                    dvm.state = mapperStateService;

                    if (!dvm.state.mapping.branch && !dvm.state.newMapping) {
                        dvm.state.setMasterBranch();
                    }
                },
                templateUrl: 'mapper/directives/mappingCommitsPage/mappingCommitsPage.directive.html'
            }
        }
})();