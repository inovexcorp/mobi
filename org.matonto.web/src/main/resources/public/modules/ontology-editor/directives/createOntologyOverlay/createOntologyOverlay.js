(function() {
    'use strict';

    angular
        .module('createOntologyOverlay', ['camelCase'])
        .directive('createOntologyOverlay', createOntologyOverlay);

        function createOntologyOverlay() {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/createOntologyOverlay/createOntologyOverlay.html',
                controllerAs: 'dvm',
                controller: ['$scope', '$filter', 'REGEX', function($scope, $filter, REGEX) {
                    var vm = $scope.$parent.vm;
                    var dvm = this;
                    var date = new Date();
                    var prefix = 'https://matonto.org/ontologies/' + (date.getMonth() + 1) + '/' + date.getFullYear() + '/';

                    dvm.iriPattern = REGEX.IRI;
                    dvm.iriHasChanged = false;

                    dvm.createOntologyIri = prefix;

                    dvm.nameChanged = function() {
                        if(!dvm.iriHasChanged) {
                            dvm.createOntologyIri = prefix + $filter('camelCase')(dvm.name, 'class');
                        }
                    }
                }]
            }
        }
})();
