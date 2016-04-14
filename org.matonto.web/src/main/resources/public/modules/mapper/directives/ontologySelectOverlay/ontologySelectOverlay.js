(function() {
    'use strict';

    angular
        .module('ontologySelectOverlay', ['ontologyManager'])
        .directive('ontologySelectOverlay', ontologySelectOverlay);

        ontologySelectOverlay.$inject = ['$filter', '$q', 'ontologyManagerService'];

        function ontologySelectOverlay($filter, $q, ontologyManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {
                    onClickBack: '&',
                    onClickContinue: '&'
                },
                bindToController: {
                    ontology: '='
                },
                controller: function() {
                    var dvm = this;
                    var ontologyObjs = angular.copy(ontologyManagerService.getList());
                    if (dvm.ontology) {
                        ontologyObjs = _.union(ontologyObjs, [dvm.ontology]);
                    }
                    dvm.ontologyIds = _.uniq(_.concat(ontologyManagerService.getOntologyIds(), _.map(ontologyObjs, '@id')));
                    dvm.selectedOntology = undefined;
                    
                    dvm.getOntology = function(ontologyId) {
                        var deferred = $q.defer();
                        var ontology = _.find(ontologyObjs, {'@id': ontologyId});
                        if (!ontology) {
                            ontologyManagerService.getThenRestructure(ontologyId).then(function(response) {
                                ontologyObjs.push(response);
                                deferred.resolve(response);
                            });
                        } else {
                            deferred.resolve(ontology);
                        }
                        deferred.promise.then(function(response) {
                            dvm.selectedOntology = response;
                        });
                    }
                    dvm.getName = function(ontologyId) {
                        var ontology = _.find(ontologyObjs, {'@id': ontologyId});
                        if (ontology) {
                            return ontologyManagerService.getEntityName(ontology);                            
                        } else {
                            return $filter('beautify')($filter('splitIRI')(ontologyId).end);
                        }
                    }
                },
                templateUrl: 'modules/mapper/directives/ontologySelectOverlay/ontologySelectOverlay.html'
            }
        }
})();
