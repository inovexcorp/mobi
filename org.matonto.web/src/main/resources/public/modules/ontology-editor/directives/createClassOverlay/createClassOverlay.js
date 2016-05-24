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
                    var prefix = vm.ontology.matonto.iriBegin + vm.ontology.matonto.iriThen;

                    dvm.iriPattern = REGEX.IRI;
                    dvm.createClassIri = prefix;

                    dvm.nameChanged = function() {
                        if(!dvm.iriHasChanged) {
                            dvm.createClassIri = prefix + $filter('camelCase')(dvm.name, 'class');
                        }
                    }

                    dvm.onEdit = function(iriBegin, iriThen, iriEnd) {
                        dvm.iriHasChanged = true;
                        dvm.createClassIri = iriBegin + iriThen + iriEnd;
                    }
                }]
            }
        }
})();
