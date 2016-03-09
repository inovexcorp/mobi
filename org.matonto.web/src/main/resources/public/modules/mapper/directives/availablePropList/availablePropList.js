(function() {
    'use strict';

    angular
        .module('availablePropList', ['ontologyManager'])
        .directive('availablePropList', availablePropList);

        availablePropList.$inject = ['ontologyManagerService'];

        function availablePropList(ontologyManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {
                    props: '=',
                    openProp: '&'
                },
                controller: function() {
                    var dvm = this;
                    dvm.selectedProp = undefined;

                    dvm.getPropName = function(prop) {
                        return ontologyManagerService.getEntityName(prop);
                    }
                    dvm.setSelectedProp = function(prop) {
                        dvm.selectedProp = prop;
                    }
                    dvm.isSelected = function(prop) {
                        return angular.equals(dvm.selectedProp, prop);
                    }
                },
                templateUrl: 'modules/mapper/directives/availablePropList/availablePropList.html'
            }
        }
})();
