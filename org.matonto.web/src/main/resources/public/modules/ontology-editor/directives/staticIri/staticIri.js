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
                    onEdit: '&'
                },
                bindToController: {
                    iri: '='
                },
                controllerAs: 'dvm',
                controller: ['$scope', '$filter', 'REGEX', function($scope, $filter, REGEX) {
                    var vm = $scope.$parent.vm;
                    var dvm = this;

                    dvm.namespacePattern = REGEX.IRI;
                    dvm.localNamePattern = REGEX.LOCALNAME;

                    function setVariables(splitIri) {
                        var splitIri = $filter('splitIRI')(dvm.iri);
                        dvm.iriBegin = splitIri.begin;
                        dvm.iriThen = splitIri.then;
                        dvm.iriEnd = splitIri.end;
                    }

                    $scope.$watch('dvm.iri', function() {
                        setVariables();
                    });

                    setVariables();
                }]
            }
        }
})();
