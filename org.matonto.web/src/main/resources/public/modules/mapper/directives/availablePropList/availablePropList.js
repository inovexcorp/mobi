(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name availablePropList
         *
         * @description
         * The `availablePropList` module only provides the `availablePropList` directive
         * which creates a interactable list of ontology properties.
         */
        .module('availablePropList', ['ontologyManager'])
        /**
         * @ngdoc directive
         * @module availablePropList
         * @name availablePropList.directive:availablePropList
         * @scope
         * @restrict E
         * @requires  ontologyManager.ontologyManagerService
         *
         * @description
         * `availablePropList` is a directive that displays a list of passed property
         * objects. The container for the list has a class of "available-props" to be
         * used for styling. There is a button for each list item that calls the 
         * passed `openProp` function when clicked. If no property objects were passed, 
         * the list displays "None". 
         *
         * @param {object} props An array of property objects from the 
         * {@link ontologyManager ontologyManagerService#methods_restructure} method.
         * @param {function} openProp The function to be called when a property's button
         * is clicked.
         *
         * @usage
         * <available-prop-list props="[{'@id': 'test'}]" openProp="console.log('Open property')"></available-prop-list>
         */
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
                controller: ['$scope', function($scope) {
                    var dvm = this;
                    dvm.selectedProp = undefined;

                    dvm.openProperty = function(propId) {
                        $scope.openProp({propId: propId});
                    }
                    dvm.getPropName = function(prop) {
                        return ontologyManagerService.getEntityName(prop);
                    }
                    dvm.setSelectedProp = function(prop) {
                        dvm.selectedProp = prop;
                    }
                    dvm.isSelected = function(prop) {
                        return angular.equals(dvm.selectedProp, prop);
                    }
                }],
                templateUrl: 'modules/mapper/directives/availablePropList/availablePropList.html'
            }
        }
})();
