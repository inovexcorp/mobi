(function() {
    'use strict';

    angular
        .module('ontologySelectOverlay', ['ontologyManager', 'mapperState', 'mappingManager'])
        .directive('ontologySelectOverlay', ontologySelectOverlay);

        ontologySelectOverlay.$inject = ['$filter', '$q', 'ontologyManagerService', 'mapperStateService', 'mappingManagerService'];

        function ontologySelectOverlay($filter, $q, ontologyManagerService, mapperStateService, mappingManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {},
                controller: function() {
                    var dvm = this;
                    dvm.state = mapperStateService;
                    dvm.manager = mappingManagerService;
                    dvm.ontology = ontologyManagerService;

                    var ontologyObjs = angular.copy(dvm.ontology.getList());
                    var sourceOntology;

                    if (dvm.manager.sourceOntologies && dvm.manager.sourceOntologies.length) {
                        sourceOntology = dvm.manager.getSourceOntology(dvm.manager.mapping.jsonld);
                        ontologyObjs = _.union(ontologyObjs, [sourceOntology]);
                    }
                    dvm.ontologyIds = _.union(dvm.ontology.getOntologyIds(), _.map(ontologyObjs, '@id'));
                    if (sourceOntology) {
                        dvm.selectedOntology = angular.copy(sourceOntology);
                        dvm.selectedOntologyId = dvm.ontologyIds[dvm.ontologyIds.indexOf(dvm.selectedOntology['@id'])];
                    } else {
                        dvm.selectedOntology = undefined;
                        dvm.selectedOntologyId = '';
                    }

                    
                    dvm.isOpen = function(ontologyId) {
                        return _.findIndex(ontologyObjs, {'@id': ontologyId}) >= 0;
                    }
                    dvm.getOntology = function(ontologyId) {
                        var deferred = $q.defer();
                        var ontology = _.find(ontologyObjs, {'@id': ontologyId});
                        if (!ontology) {
                            dvm.ontology.getThenRestructure(ontologyId).then(response => {
                                ontologyObjs.push(response);
                                deferred.resolve(response);
                            });
                        } else {
                            deferred.resolve(ontology);
                        }
                        deferred.promise.then(response => {
                            dvm.selectedOntology = response;
                        });
                    }
                    dvm.getName = function(ontologyId) {
                        var ontology = _.find(ontologyObjs, {'@id': ontologyId});
                        if (ontology) {
                            return dvm.ontology.getEntityName(ontology);                            
                        } else {
                            return dvm.ontology.getBeautifulIRI(ontologyId);
                        }
                    }

                    dvm.continue = function() {
                        if (dvm.state.changeOntology) {
                            dvm.state.cacheSourceOntologies();
                        }
                        if (dvm.state.getCachedSourceOntologyId() !== dvm.selectedOntologyId) {
                            dvm.manager.mapping.jsonld = dvm.manager.setSourceOntology(dvm.manager.mapping.jsonld, dvm.selectedOntologyId);                        
                            dvm.manager.sourceOntologies = [dvm.selectedOntology];
                            dvm.ontology.getImportedOntologies(dvm.selectedOntologyId).then(response => {
                                dvm.manager.sourceOntologies = _.concat(dvm.manager.sourceOntologies, response);
                            });
                        }

                        dvm.state.step = 3;
                    }

                    dvm.back = function() {
                        if (dvm.state.changeOntology) {
                            dvm.state.restoreCachedSourceOntologies();
                            dvm.state.changeOntology = false;
                            dvm.state.step = 4;
                        } else {
                            dvm.manager.mapping.jsonld = dvm.manager.setSourceOntology(dvm.manager.mapping.jsonld, '');                        
                            dvm.manager.sourceOntologies = [];
                            dvm.state.step = 1;
                        }
                    }
                },
                templateUrl: 'modules/mapper/directives/ontologySelectOverlay/ontologySelectOverlay.html'
            }
        }
})();
