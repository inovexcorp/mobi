(function() {
    'use strict';

    angular
        .module('resourceType', ['catalogManager'])
        .directive('resourceType', resourceType);

        resourceType.$inject = ['catalogManagerService'];

        function resourceType(catalogManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {
                    resource: '='
                },
                controller: function() {
                    var dvm = this;
                    dvm.getType = function(resource) {
                        return catalogManagerService.getType(resource.type);
                    }
                },
                templateUrl: 'modules/catalog/directives/resourceType/resourceType.html'
            }
        }
})();
