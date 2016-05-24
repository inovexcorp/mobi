(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name resourcePreview
         * @requires catalogManager
         *
         * @description 
         * The `resourcePreview` module only provides the `resourcePreview` directive
         * which creates a preview of information about a particular resource object.
         */
        .module('resourcePreview', ['catalogManager'])
        /**
         * @ngdoc directive
         * @name resourcePreview.directive:resourcePreview
         * @scope
         * @restrict E
         * @requires catalogManager.catalogManagerService
         *
         * @description 
         * `resourcePreview` is a directive that creates a preview of information about
         * the selected particular resource object in the 
         * {@link catalogManager.service:catalogManagerService catalogManagerService}. 
         * The directive is replaced by the content of the template. If no selected 
         * resource is set, a static message is shown.
         *
         * @usage
         * <resource-preview></resource-preview>
         */
        .directive('resourcePreview', resourcePreview);

        resourcePreview.$inject = ['catalogManagerService'];

        function resourcePreview(catalogManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {},
                controller: function() {
                    var dvm = this;
                    dvm.catalog = catalogManagerService;

                    dvm.getDate = function(date) {
                        var jsDate = dvm.catalog.getDate(date);
                        return jsDate.toDateString();
                    }
                },
                templateUrl: 'modules/catalog/directives/resourcePreview/resourcePreview.html'
            }
        }
})();
