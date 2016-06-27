(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name mappingEditor
         * @requires  ontologyManager
         * @requires  mappingManager
         * @requires  mapperState
         * @requires  delimitedManager
         *
         * @description 
         * The `mappingEditor` module only provides the `mappingEditor` directive which creates
         * the main editor for mappings and mapping data.
         */
        .module('mappingEditor', ['mappingManager', 'mapperState', 'ontologyManager', 'delimitedManager'])
        /**
         * @ngdoc directive
         * @name mappingEditor.directive:mappingEditor
         * @scope
         * @restrict E
         * @requires  ontologyManager.service:ontologyManagerService
         * @requires  mappingManager.service:mappingManagerService
         * @requires  mapperState.service:mapperStateService
         * @requires  delimitedManager.service:delimitedManagerService
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

        mappingEditor.$inject = ['$q', 'mappingManagerService', 'mapperStateService', 'ontologyManagerService', 'delimitedManagerService'];

        function mappingEditor($q, mappingManagerService, mapperStateService, ontologyManagerService, delimitedManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {},
                controller: function() {
                    var dvm = this;
                    dvm.state = mapperStateService;
                    dvm.mm = mappingManagerService;
                    dvm.om = ontologyManagerService;
                    dvm.cm = delimitedManagerService;

                    dvm.getSourceOntologyName = function() {
                        return dvm.om.getEntityName(dvm.mm.getSourceOntology(_.get(dvm.mm.mapping, 'jsonld')));
                    }
                    dvm.changeOntology = function() {
                        dvm.state.changeOntology = true;
                        dvm.state.cacheSourceOntologies();
                        dvm.state.step = dvm.state.ontologySelectStep;
                    }
                    dvm.submit = function() {
                        var deferred = $q.defer();
                        if (_.includes(dvm.mm.previousMappingNames, dvm.mm.mapping.name)) {
                            deferred.resolve();
                        } else {
                            dvm.mm.upload(dvm.mm.mapping.jsonld)
                                .then(() => deferred.resolve(), errorMessage => deferred.reject(errorMessage));
                        }
                        deferred.promise.then(() => {
                            dvm.cm.map(dvm.mm.mapping.name);
                            dvm.state.resetEdit();
                            dvm.state.step = dvm.state.finishStep;
                            dvm.saveError = false;
                        }, errorMessage => {
                            dvm.saveError = true;
                        });
                        
                    }
                },
                templateUrl: 'modules/mapper/directives/mappingEditor/mappingEditor.html'
            }
        }
})();
