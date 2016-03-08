(function() {
    'use strict';

    angular
        .module('iriOverlay', [])
        .directive('iriOverlay', iriOverlay);

        function iriOverlay() {
            return {
                restrict: 'E',
                templateUrl: 'modules/ontology-editor/directives/iriOverlay/iriOverlay.html',
                controller: ['$scope', '$filter', function($scope, $filter) {
                    var vm = $scope.$parent.vm,
                        iri = vm.selected.matonto.namespace ? (vm.selected.matonto.namespace + vm.selected['@id']) : $filter('splitIRI')(vm.selected['@id']);

                    vm.iriBegin = iri.begin;
                    vm.iriThen = iri.then;
                    vm.iriEnd = iri.end || $filter('camelCase')(vm.selected[vm.rdfs + 'label'][0]['@value']);
                    vm.iriUpdate = true;
                }]
            }
        }
})();
