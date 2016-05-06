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
                controller: ['$scope', '$filter', 'REGEX', 'prefixes', function($scope, $filter, REGEX, prefixes) {
                    var vm = $scope.$parent.vm;
                    var iri = _.has(vm.selected, 'matonto.namespace') ? $filter('splitIRI')(vm.selected.matonto.namespace + vm.selected['@id']) : $filter('splitIRI')(vm.selected['@id']);
                    var dvm = this;

                    dvm.namespacePattern = REGEX.IRI;
                    dvm.localNamePattern = REGEX.LOCALNAME;

                    var type = (_.indexOf(vm.selected['@type'], prefixes.owl + 'Class') !== -1) ? 'class' : 'property';

                    vm.iriBegin = iri.begin;
                    vm.iriThen = iri.then;
                    vm.iriEnd = iri.end || $filter('camelCase')(_.get(vm.selected, "['" + vm.rdfs + "label'][0]['@value']"), type);
                    vm.iriUpdate = true;
                }]
            }
        }
})();
