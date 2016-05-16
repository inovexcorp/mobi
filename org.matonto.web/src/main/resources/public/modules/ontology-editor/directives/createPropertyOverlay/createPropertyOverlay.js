(function() {
    'use strict';

    angular
        .module('createPropertyOverlay', ['camelCase'])
        .directive('createPropertyOverlay', createPropertyOverlay);

        function createPropertyOverlay() {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/createPropertyOverlay/createPropertyOverlay.html',
                controllerAs: 'dvm',
                controller: ['$scope', '$filter', 'REGEX', function($scope, $filter, REGEX) {
                    var vm = $scope.$parent.vm;
                    var dvm = this;
                    var prefix = vm.ontology['@id'] + '#';

                    dvm.iriPattern = REGEX.IRI;
                    dvm.createClassIri = prefix;
                    vm.currentIri = angular.copy(dvm.createClassIri);

                    dvm.nameChanged = function() {
                        if(!vm.iriHasChanged) {
                            dvm.createClassIri = prefix + $filter('camelCase')(dvm.name, 'property');
                            vm.currentIri = angular.copy(dvm.createClassIri);
                        }
                    }
                }]
            }
        }
})();
