(function() {
    'use strict';

    angular
        .module('filterList', ['catalogManager'])
        .directive('filterList', filterList);

        filterList.$inject = ['catalogManagerService'];

        function filterList(catalogManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {
                    clickFilter: '&'
                },
                controller: function() {
                    var dvm = this;
                    dvm.filters = {
                        Resources: []
                    };
                    catalogManagerService.getResourceTypes()
                        .then(function(types) {
                            dvm.filters.Resources = _.map(types, function(type) {
                                return {
                                    value: type,
                                    formatter: dvm.getType,
                                    applied: false
                                };
                            });
                        });

                    dvm.getType = function(type) {
                        return catalogManagerService.getType(type);
                    }
                },
                templateUrl: 'modules/catalog/directives/filterList/filterList.html'
            }
        }
})();
