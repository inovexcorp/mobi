(function() {
    'use strict';

    angular
        .module('resourcePreview', ['catalogManager'])
        .directive('resourcePreview', resourcePreview);

        resourcePreview.$inject = ['catalogManagerService'];

        function resourcePreview(catalogManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {
                    resource: '='
                },
                controller: function() {
                    var dvm = this;

                    dvm.getDate = function(date) {
                        var jsDate = catalogManagerService.getDate(date);
                        return jsDate.toDateString();
                    }
                },
                templateUrl: 'modules/catalog/directives/resourcePreview/resourcePreview.html'
            }
        }
})();
