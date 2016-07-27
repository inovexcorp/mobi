/*-
 * #%L
 * org.matonto.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
 * %%
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */
(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name mappingOverlays
         * @requires  ontologyManager
         * @requires  mappingManager
         * @requires  mapperState
         * @requires  delimitedManager
         *
         * @description 
         * The `mappingOverlays` module only provides the `mappingOverlays` directive which creates
         * all the overlays used in the mapping tool.
         */
        .module('mappingOverlays', ['mappingManager', 'mapperState', 'delimitedManager', 'ontologyManager'])
        /**
         * @ngdoc directive
         * @name mappingOverlays.directive:mappingOverlays
         * @scope
         * @restrict E
         * @requires  ontologyManager.service:ontologyManagerService
         * @requires  mappingManager.service:mappingManagerService
         * @requires  mapperState.service:mapperStateService
         * @requires  delimitedManager.service:delimitedManagerService
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

        mappingOverlays.$inject = ['mappingManagerService', 'mapperStateService', 'delimitedManagerService', 'ontologyManagerService']

        function mappingOverlays(mappingManagerService, mapperStateService, delimitedManagerService, ontologyManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                scope: {},
                controller: function() {
                    var dvm = this;
                    dvm.state = mapperStateService;
                    dvm.mm = mappingManagerService;
                    dvm.dm = delimitedManagerService;
                    dvm.om = ontologyManagerService;

                    dvm.reset = function() {
                        dvm.state.initialize();
                        dvm.state.resetEdit();
                        dvm.mm.mapping = undefined;
                        dvm.mm.sourceOntologies = [];
                        dvm.dm.reset();
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
