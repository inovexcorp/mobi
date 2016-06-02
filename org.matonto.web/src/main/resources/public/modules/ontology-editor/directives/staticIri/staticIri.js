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
                    iri: '=',
                    ontologyIriBegin: '=',
                    ontologyIriThen: '='
                },
                controllerAs: 'dvm',
                controller: ['$scope', '$filter', 'REGEX', function($scope, $filter, REGEX) {
                    var dvm = this;

                    dvm.refresh = {};
                    dvm.namespacePattern = REGEX.IRI;
                    dvm.localNamePattern = REGEX.LOCALNAME;

                    dvm.setVariables = function(obj) {
                        var splitIri = $filter('splitIRI')(dvm.iri);
                        obj.iriBegin = splitIri.begin;
                        obj.iriThen = splitIri.then;
                        obj.iriEnd = splitIri.end;
                    }

                    dvm.resetVariables = function() {
                        dvm.iriBegin = angular.copy(dvm.refresh.iriBegin);
                        dvm.iriThen = angular.copy(dvm.refresh.iriThen);
                        dvm.iriEnd = angular.copy(dvm.refresh.iriEnd);
                    }

                    dvm.afterEdit = function() {
                        dvm.ontologyIriBegin = angular.copy(dvm.iriBegin);
                        dvm.ontologyIriThen = angular.copy(dvm.iriThen);
                        dvm.showIriOverlay = false;
                    }

                    $scope.$watch('dvm.iri', function() {
                        dvm.setVariables(dvm);
                        dvm.setVariables(dvm.refresh);
                    });

                    dvm.setVariables(dvm);
                    dvm.setVariables(dvm.refresh);
                }]
            }
        }
})();
