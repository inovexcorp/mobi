(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name mapperTabset
         *
         * @description
         * The `mapperTabset` module only provides the `mapperTabset` directive
         * which creates the main {@link tabset.directive:tabset tabset} for the mapping tool.
         */
        .module('mapperTabset', [])
        /**
         * @ngdoc directive
         * @name mapperTabset.directive:mapperTabset
         * @scope
         * @restrict E
         * @requires  mapperState.service:mapperStateService
         *
         * @description
         * `mapperTabset` is a directive which creates a {@link tabset.directive:tabset tabset} with different
         * pages depending on the current {@link mapperState.service:mapperStateService#step step} of the mapping
         * process. The three pages are {@link mappingSelectPage.directive:mappingSelectPage mappingSelectPage},
         * {@link fileUploadPage.directive:fileUploadPage fileUploadPage}, and the
         * {@link editMappingPage.directive:editMappingPage editMappingPage}. The directive is replaced by the
         * contents of its template.
         */
        .directive('mapperTabset', mapperTabset);

        mapperTabset.$inject = ['mapperStateService'];

        function mapperTabset(mapperStateService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'mapper/directives/mapperTabset/mapperTabset.directive.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    dvm.state = mapperStateService;
                }
            }
        }
})();
