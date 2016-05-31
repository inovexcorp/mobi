(function() {
    'use strict';

    angular
        .module('mappingEditor', ['mappingManager', 'mapperState', 'ontologyManager', 'csvManager'])
        .directive('mappingEditor', mappingEditor);

        mappingEditor.$inject = ['$q', 'mappingManagerService', 'mapperStateService', 'ontologyManagerService', 'csvManagerService'];

        function mappingEditor($q, mappingManagerService, mapperStateService, ontologyManagerService, csvManagerService) {
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
                    dvm.csv = csvManagerService;

                    dvm.getSourceOntologyName = function() {
                        return dvm.ontology.getEntityName(dvm.manager.getSourceOntology(_.get(dvm.manager.mapping, 'jsonld')));
                    }
                    dvm.changeOntology = function() {
                        dvm.state.changeOntology = true;
                        dvm.state.cacheSourceOntologies();
                        dvm.state.step = 2;
                    }
                    dvm.submit = function() {
                        var deferred = $q.defer();
                        if (_.includes(dvm.manager.previousMappingNames, dvm.manager.mapping.name)) {
                            deferred.resolve();
                        } else {
                            dvm.manager.uploadPut(dvm.manager.mapping.jsonld, dvm.manager.mapping.name)
                                .then(() => deferred.resolve(), errorMessage => deferred.reject(errorMessage));
                        }
                        deferred.promise.then(() => {
                            dvm.csv.map(dvm.manager.mapping.name);
                            dvm.state.resetEdit();
                            dvm.state.step = 5;
                        }, errorMessage => {
                            console.log(errorMessage);
                        });
                        
                    }
                },
                templateUrl: 'modules/mapper/directives/mappingEditor/mappingEditor.html'
            }
        }
})();
