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
                    orderBy: '=',
                    currentPage: '=',
                    clickResource: '&',
                    changeOrder: '&',
                    clickLink: '&',
                    download: '&'
                },
                controller: function() {
                    var dvm = this;

                    dvm.getDate = function(date) {
                        var jsDate = catalogManagerService.getDate(date);
                        return jsDate.toDateString();
                    }
                },
                templateUrl: 'modules/catalog/directives/resultList/resultList.html'
            }
        }
})();
