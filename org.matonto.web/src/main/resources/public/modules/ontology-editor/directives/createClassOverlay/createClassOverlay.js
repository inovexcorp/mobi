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
                    var date = new Date().now();
                    var prefix = vm.ontology['@id'] + '#';

                    dvm.iriPattern = REGEX.IRI;
                    dvm.iriHasChanged = false;

                    vm.createClassIri = prefix;

                    dvm.nameChanged = function() {
                        if(!dvm.iriHasChanged) {
                            vm.createOntologyIri = prefix + $filter('camelCase')(dvm.name, 'class');
                        }
                    }
                }]
            }
        }
})();
