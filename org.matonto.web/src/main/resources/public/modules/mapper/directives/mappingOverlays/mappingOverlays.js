(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name mappingOverlays
         * @requires  ontologyManager
         * @requires  mappingManager
         * @requires  mapperState
         * @requires  csvManager
         *
         * @description 
         * The `mappingOverlays` module only provides the `mappingOverlays` directive which creates
         * all the overlays used in the mapping tool.
         */
        .module('mappingOverlays', ['mappingManager', 'mapperState', 'csvManager', 'ontologyManager'])
        /**
         * @ngdoc directive
         * @name mappingOverlays.directive:mappingOverlays
         * @scope
         * @restrict E
         * @requires  ontologyManager.service:ontologyManagerService
         * @requires  mappingManager.service:mappingManagerService
         * @requires  mapperState.service:mapperStateService
         * @requires  csvManager.service:csvManagerService
         *
         * @description 
         * `mappingOverlays` is a directive that creates all of the overlay used in the mapping tool. 
         * Those overlays are {@link mappingNameOverlay.directive:mappingNameOverlay mappingNameOverlay},
         * {@link fileUploadOverlay.directive:fileUploadOverlay fileUploadOverlay},
         * {@link ontologySelectOverlay.directive:ontologySelectOverlay ontologySelectOverlay},
         * {@link startingClassSelectOverlay.directive:startingClassSelectOverlay startingClassSelectOverlay},
         * {@link ontologyPreviewOverlay.directive:ontologyPreviewOverlay ontologyPreviewOverlay}, 
         * {@link iriTemplateOverlay.directive:iriTemplateOverlay iriTemplateOverlay},
         * {@link finishOverlay.directive:finishOverlay finishOverlay}, 
         * and several {@link confirmationOverlay.directive:confirmationOverlay confirmationOverlays}.
         */
        .directive('mappingOverlays', mappingOverlays);

        mappingOverlays.$inject = ['mappingManagerService', 'mapperStateService', 'csvManagerService', 'ontologyManagerService']

        function mappingOverlays(mappingManagerService, mapperStateService, csvManagerService, ontologyManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                scope: {},
                controller: function() {
                    var dvm = this;
                    dvm.state = mapperStateService;
                    dvm.manager = mappingManagerService;
                    dvm.csv = csvManagerService;
                    dvm.ontology = ontologyManagerService;

                    dvm.reset = function() {
                        dvm.state.initialize();
                        dvm.state.resetEdit();
                        dvm.manager.mapping = undefined;
                        dvm.manager.sourceOntologies = [];
                        dvm.csv.reset();
                    }
                    dvm.getDeleteEntityName = function() {
                        var ontology = dvm.manager.getSourceOntology(dvm.manager.mapping.jsonld);
                        var ontologyEntity = undefined;
                        if (dvm.isClassMapping(dvm.state.deleteId)) {
                            var classId = dvm.manager.getClassIdByMappingId(dvm.manager.mapping.jsonld, dvm.state.deleteId);
                            ontologyEntity = dvm.ontology.getClass(ontology, classId);
                        } else {
                            var propId = dvm.manager.getPropIdByMappingId(dvm.manager.mapping.jsonld, dvm.state.deleteId);
                            var classMapping = dvm.manager.findClassWithDataMapping(dvm.manager.mapping.jsonld, dvm.state.deleteId) 
                                || dvm.manager.findClassWithObjectMapping(dvm.manager.mapping.jsonld, dvm.state.deleteId);
                            var classId = dvm.manager.getClassIdByMapping(classMapping);
                            ontologyEntity = dvm.ontology.getClassProperty(ontology, classId, propId);
                        }
                        return dvm.ontology.getEntityName(ontologyEntity);
                    }
                    dvm.isClassMapping = function(entityId) {
                        var entity = _.find(dvm.manager.mapping.jsonld, {'@id': entityId});
                        return dvm.manager.isClassMapping(entity);
                    }
                    dvm.deleteEntity = function() {
                        if (dvm.isClassMapping(dvm.state.deleteId)) {
                            dvm.manager.mapping.jsonld = dvm.manager.removeClass(dvm.manager.mapping.jsonld, dvm.state.deleteId);
                        } else {
                            var classMapping = dvm.manager.findClassWithDataMapping(dvm.manager.mapping.jsonld, dvm.state.deleteId) 
                                || dvm.manager.findClassWithObjectMapping(dvm.manager.mapping.jsonld, dvm.state.deleteId);
                            dvm.manager.mapping.jsonld = dvm.manager.removeProp(dvm.manager.mapping.jsonld, classMapping['@id'], dvm.state.deleteId);
                        }
                        dvm.state.changedMapping();
                        dvm.state.resetEdit();
                        dvm.state.deleteId = '';
                    }
                    dvm.deleteMapping = function() {
                        dvm.manager.deleteMapping(dvm.manager.mapping.name).then(() => {
                            dvm.manager.mapping = undefined;
                            dvm.manager.sourceOntologies = [];
                        }, errorMessage => {
                            console.log(errorMessage);
                        });
                    }
                },
                templateUrl: 'modules/mapper/directives/mappingOverlays/mappingOverlays.html'
            }
        }
})();
