(function() {
    'use strict';

    angular
        .module('createClassOverlay', ['camelCase'])
        .directive('createClassOverlay', createClassOverlay);

        function createClassOverlay() {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/createClassOverlay/createClassOverlay.html',
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
                            dvm.createClassIri = prefix + $filter('camelCase')(dvm.name, 'class');
                            vm.currentIri = angular.copy(dvm.createClassIri);
                        }
                    }
                }]
            }
        }
})();
