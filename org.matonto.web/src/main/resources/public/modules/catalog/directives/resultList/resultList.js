(function() {
    'use strict';

    angular
        .module('resultList', ['catalogManager'])
        .directive('resultList', resultList);

        resultList.$inject = ['catalogManagerService'];

        function resultList(catalogManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {
                    results: '=',
                    clickResource: '&',
                    changeOrder: '&'
                },
                controller: ['$scope', function($scope) {
                    var dvm = this;
                    dvm.orderBy = 'name';

                    dvm.getType = function(resource) {
                        return catalogManagerService.getType(resource);
                    }
                    dvm.getDate = function(date) {
                        var jsDate = catalogManagerService.getDate(date);
                        return jsDate.toDateString();
                    }
                }],
                templateUrl: 'modules/catalog/directives/resultList/resultList.html'
            }
        }
})();
