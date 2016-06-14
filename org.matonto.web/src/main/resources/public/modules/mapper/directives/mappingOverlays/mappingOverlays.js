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
                    dvm.mm = mappingManagerService;
                    dvm.cm = csvManagerService;
                    dvm.om = ontologyManagerService;

                    dvm.reset = function() {
                        dvm.state.initialize();
                        dvm.state.resetEdit();
                        dvm.mm.mapping = undefined;
                        dvm.mm.sourceOntologies = [];
                        dvm.cm.reset();
                    }
                    dvm.getDeleteEntityName = function() {
                        var ontology = dvm.mm.getSourceOntology(dvm.mm.mapping.jsonld);
                        var ontologyEntity = undefined;
                        if (dvm.isClassMapping(dvm.state.deleteId)) {
                            var classId = dvm.mm.getClassIdByMappingId(dvm.mm.mapping.jsonld, dvm.state.deleteId);
                            ontologyEntity = dvm.om.getClass(ontology, classId);
                        } else {
                            var propId = dvm.mm.getPropIdByMappingId(dvm.mm.mapping.jsonld, dvm.state.deleteId);
                            var classMapping = dvm.mm.findClassWithDataMapping(dvm.mm.mapping.jsonld, dvm.state.deleteId) 
                                || dvm.mm.findClassWithObjectMapping(dvm.mm.mapping.jsonld, dvm.state.deleteId);
                            var classId = dvm.mm.getClassIdByMapping(classMapping);
                            ontologyEntity = dvm.om.getClassProperty(ontology, classId, propId);
                        }
                        return dvm.om.getEntityName(ontologyEntity);
                    }
                    dvm.isClassMapping = function(entityId) {
                        var entity = _.find(dvm.mm.mapping.jsonld, {'@id': entityId});
                        return dvm.mm.isClassMapping(entity);
                    }
                    dvm.deleteEntity = function() {
                        if (dvm.isClassMapping(dvm.state.deleteId)) {
                            _.pull(dvm.state.openedClasses, dvm.state.deleteId);
                            dvm.mm.mapping.jsonld = dvm.mm.removeClass(dvm.mm.mapping.jsonld, dvm.state.deleteId);
                        } else {
                            var classMapping = dvm.mm.findClassWithDataMapping(dvm.mm.mapping.jsonld, dvm.state.deleteId) 
                                || dvm.mm.findClassWithObjectMapping(dvm.mm.mapping.jsonld, dvm.state.deleteId);
                            dvm.mm.mapping.jsonld = dvm.mm.removeProp(dvm.mm.mapping.jsonld, classMapping['@id'], dvm.state.deleteId);
                        }
                        dvm.state.changedMapping();
                        dvm.state.resetEdit();
                        dvm.state.deleteId = '';
                    }
                    dvm.deleteMapping = function() {
                        dvm.mm.deleteMapping(dvm.mm.mapping.name).then(() => {
                            dvm.mm.mapping = undefined;
                            dvm.mm.sourceOntologies = [];
                        }, errorMessage => {
                            console.log(errorMessage);
                        });
                    }
                },
                templateUrl: 'modules/mapper/directives/mappingOverlays/mappingOverlays.html'
            }
        }
})();
