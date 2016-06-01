(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name mappingEditor
         * @requires  ontologyManager
         * @requires  mappingManager
         * @requires  mapperState
         * @requires  csvManager
         *
         * @description 
         * The `mappingEditor` module only provides the `mappingEditor` directive which creates
         * the main editor for mappings and mapping data.
         */
        .module('mappingEditor', ['mappingManager', 'mapperState', 'ontologyManager', 'csvManager'])
        /**
         * @ngdoc directive
         * @name mappingEditor.directive:mappingEditor
         * @scope
         * @restrict E
         * @requires  ontologyManager.service:ontologyManagerService
         * @requires  mappingManager.service:mappingManagerService
         * @requires  mapperState.service:mapperStateService
         * @requires  csvManager.service:csvManagerService
         *
         * @description 
         * `mappingEditor` is a directive that creates a div with three main sections: the header area
         * with functionalities like editing the mapping name, the main editor area with forms to add 
         * and edit entities in the mapping, and the file preview table. The header contains a section 
         * for previewing the selected source ontology for the mapping and changing that source ontology,
         * displaying and editing the mapping name, and submiting or canceling the mapping process. The 
         * main editor area contains a pull out for previewing the mapped data, the list of class mappings 
         * and their property mappings in the mapping, and form for editing class and property mappings 
         * and adding new property mappings. The directive is replaced by the contents of its template.
         */
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
