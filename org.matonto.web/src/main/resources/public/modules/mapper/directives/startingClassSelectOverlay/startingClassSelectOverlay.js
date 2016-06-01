(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name startingClassSelectOverlay
         * @requires  prefixes
         * @requires  ontologyManager
         * @requires  mappingManager
         * @requires  mapperState
         *
         * @description 
         * The `startingClassSelectOverlay` module only provides the `startingClassSelectOverlay` 
         * directive which creates and overlay with a ui-select to select a class and a preview
         * area for the selected class.
         */
        .module('startingClassSelectOverlay', ['prefixes', 'ontologyManager', 'mapperState', 'mappingManager'])
        /**
         * @ngdoc directive
         * @name startingClassSelectOverlay.directive:startingClassSelectOverlay
         * @scope
         * @restrict E
         * @requires  prefixes.prefixes
         * @requires  ontologyManager.service:ontologyManagerService
         * @requires  mappingManager.service:mappingManagerService
         * @requires  mapperState.service:mapperStateService
         *
         * @description 
         * `startingClassSelectOverlay` is a directive that creates an overlay containing a ui-select 
         * with all the classes defined within the select ontology and all the classes defined in its 
         * imported ontology and a {@link classPreview.directive:classPreview classPreview} of the selected class. 
         * The classes in the ui-select are sorted by the ontology they are defined in. The directive 
         * is replaced by the contents of its template.
         */
        .directive('startingClassSelectOverlay', startingClassSelectOverlay);

        startingClassSelectOverlay.$inject = ['prefixes', 'ontologyManagerService', 'mapperStateService', 'mappingManagerService'];

        function startingClassSelectOverlay(prefixes, ontologyManagerService, mapperStateService, mappingManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {},
                controller: function() {
                    var dvm = this;
                    dvm.ontology = ontologyManagerService;
                    dvm.manager = mappingManagerService;
                    dvm.state = mapperStateService;

                    dvm.getOntologyId = function(classObj) {
                        return _.get(dvm.ontology.findOntologyWithClass(dvm.manager.sourceOntologies, classObj['@id']), '@id', '');
                    }
                    dvm.getClasses = function() {
                        var classes = [];
                        _.forEach(dvm.manager.sourceOntologies, ontology => {
                            classes = _.concat(classes, dvm.ontology.getClasses(ontology));
                        });
                        return classes;
                    }
                    dvm.continue = function() {
                        if (dvm.state.changeOntology) {
                            dvm.state.clearCachedSourceOntologies();
                            var ontologyId = dvm.manager.getSourceOntologyId(dvm.manager.mapping.jsonld);
                            dvm.manager.mapping.jsonld = dvm.manager.createNewMapping(dvm.manager.mapping.name);
                            dvm.manager.mapping.jsonld = dvm.manager.setSourceOntology(dvm.manager.mapping.jsonld, ontologyId);
                            dvm.state.changeOntology = false;
                            dvm.state.changedMapping();
                        }
                        var ontology = dvm.ontology.findOntologyWithClass(dvm.manager.sourceOntologies, dvm.selectedClass['@id']);
                        dvm.manager.mapping.jsonld = dvm.manager.addClass(dvm.manager.mapping.jsonld, ontology, dvm.selectedClass['@id']);
                        dvm.state.resetEdit();
                        dvm.state.selectedClassMappingId = _.get(_.find(dvm.manager.mapping.jsonld, {'@type': [prefixes.delim + 'ClassMapping']}), '@id');
                        dvm.state.updateAvailableProps();
                        dvm.state.step = 4;
                    }
                    dvm.back = function() {
                        dvm.state.step = 2;
                    }

                },
                templateUrl: 'modules/mapper/directives/startingClassSelectOverlay/startingClassSelectOverlay.html'
            }
        }
})();
