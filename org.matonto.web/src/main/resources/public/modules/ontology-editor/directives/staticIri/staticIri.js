(function() {
    'use strict';

    angular
        .module('staticIri', [])
        .directive('staticIri', staticIri);

        function staticIri() {
            return {
                restrict: 'E',
                templateUrl: 'modules/ontology-editor/directives/staticIri/staticIri.html',
                scope: {
                    iri: '='
                },
                bindToController: {
                    displayType: '='
                },
                controllerAs: 'dvm',
                controller: ['$scope', function($scope) {
                    var vm = $scope.$parent.vm;
                    var dvm = this;

                    dvm.edit = function() {
                        vm.iriType = dvm.displayType;
                        vm.showIriOverlay = true;
                    }
                }]
            }
        }
})();
