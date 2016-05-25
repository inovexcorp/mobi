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
                    var refresh = {};

                    dvm.namespacePattern = REGEX.IRI;
                    dvm.localNamePattern = REGEX.LOCALNAME;

                    function setVariables(obj) {
                        var splitIri = $filter('splitIRI')(dvm.iri);
                        obj.iriBegin = splitIri.begin;
                        obj.iriThen = splitIri.then;
                        obj.iriEnd = splitIri.end;
                    }

                    dvm.refresh = function(){
                        dvm.iriBegin = angular.copy(refresh.iriBegin);
                        dvm.iriThen = angular.copy(refresh.iriThen);
                        dvm.iriEnd = angular.copy(refresh.iriEnd);
                    }

                    dvm.afterEdit = function() {
                        vm.ontology.matonto.iriBegin = angular.copy(dvm.iriBegin);
                        vm.ontology.matonto.iriThen = angular.copy(dvm.iriThen);
                        dvm.showIriOverlay = false;
                    }

                    $scope.$watch('dvm.iri', function() {
                        setVariables(dvm);
                        setVariables(refresh);
                    });

                    setVariables(dvm);
                    setVariables(refresh);
                }]
            }
        }
})();
