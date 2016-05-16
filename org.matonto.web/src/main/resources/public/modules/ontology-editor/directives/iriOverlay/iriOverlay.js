(function() {
    'use strict';

    angular
        .module('iriOverlay', [])
        .directive('iriOverlay', iriOverlay);

        function iriOverlay() {
            return {
                restrict: 'E',
                templateUrl: 'modules/ontology-editor/directives/iriOverlay/iriOverlay.html',
                bindToController: {
                    currentIri: '='
                },
                controllerAs: 'dvm',
                controller: ['$scope', '$filter', 'REGEX', 'prefixes', function($scope, $filter, REGEX, prefixes) {
                    var vm = $scope.$parent.vm;
                    var dvm = this;
                    var splitIri = $filter('splitIRI')(dvm.currentIri);

                    dvm.namespacePattern = REGEX.IRI;
                    dvm.localNamePattern = REGEX.LOCALNAME;

                    vm.iriBegin = splitIri.begin;
                    vm.iriThen = splitIri.then;
                    vm.iriEnd = splitIri.end;
                    vm.iriUpdate = true;
                }]
            }
        }
})();
