(function() {
    'use strict';

    angular
        .module('iriOverlay', [])
        .directive('iriOverlay', iriOverlay);

        function iriOverlay() {
            return {
                restrict: 'E',
                templateUrl: 'modules/ontology-editor/directives/iriOverlay/iriOverlay.html',
                controllerAs: 'dvm',
                controller: ['$scope', '$filter', 'REGEX', function($scope, $filter, REGEX) {
                    var vm = $scope.$parent.vm;
                    var iri = vm.selected.matonto.namespace ? $filter('splitIRI')(vm.selected.matonto.namespace + vm.selected['@id']) : $filter('splitIRI')(vm.selected['@id']);
                    var dvm = this;

                    vm.iriBegin = iri.begin;
                    vm.iriThen = iri.then;
                    vm.iriEnd = iri.end || $filter('camelCase')(vm.selected[vm.rdfs + 'label'][0]['@value']);
                    vm.iriUpdate = true;

                    dvm.getNamespacePattern = function() {
                        return REGEX.IRI;
                    }
                }]
            }
        }
})();
