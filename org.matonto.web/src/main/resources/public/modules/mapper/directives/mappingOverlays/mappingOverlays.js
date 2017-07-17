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
         *
         * @description
         * The `mappingOverlays` module only provides the `mappingOverlays` directive which creates
         * all the overlays used in the mapping tool.
         */
        .module('mappingOverlays', [])
        /**
         * @ngdoc directive
         * @name mappingOverlays.directive:mappingOverlays
         * @scope
         * @restrict E
         * @requires util.service:utilService
         * @requires mappingManager.service:mappingManagerService
         * @requires mapperState.service:mapperStateService
         * @requires delimitedManager.service:delimitedManagerService
         *
         * @description
         * `mappingOverlays` is a directive that creates all of the overlays used in the mapping tool.
         * {@link iriTemplateOverlay.directive:iriTemplateOverlay iriTemplateOverlay},
         * {@link invalidOntologyOverlay.directive:invalidOntologyOverlay invalidOntologyOverlay},
         * {@link createMappingOverlay.directive:createMappingOverlay createMappingOverlay},
         * {@link downloadMappingOverlay.directive:downloadMappingOverlay downloadMappingOverlay},
         * {@link mappingConfigOverlay.directive:mappingConfigOverlay mappingConfigOverlay},
         * {@link classMappingOverlay.directive:classMappingOverlay classMappingOverlay},
         * {@link propMappingOverlay.directive:propMappingOverlay propMappingOverlay},
         * {@link runMappingOverlay.directive:runMappingOverlay runMappingOverlay},
         * and several {@link confirmationOverlay.directive:confirmationOverlay confirmationOverlays}.
         */
        .directive('mappingOverlays', mappingOverlays);

        mappingOverlays.$inject = ['utilService', 'mappingManagerService', 'mapperStateService', 'delimitedManagerService']

        function mappingOverlays(utilService, mappingManagerService, mapperStateService, delimitedManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                scope: {},
                controller: function() {
                    var dvm = this;
                    dvm.state = mapperStateService;
                    dvm.mm = mappingManagerService;
                    dvm.dm = delimitedManagerService;
                    dvm.util = utilService;

                    dvm.reset = function() {
                        dvm.state.initialize();
                        dvm.state.resetEdit();
                        dvm.dm.reset();
                    }
                    dvm.getClassName = function(classMappingId) {
                        return dvm.util.getBeautifulIRI(dvm.mm.getClassIdByMappingId(dvm.state.mapping.jsonld, classMappingId));
                    }
                    dvm.getPropName = function(propMappingId) {
                        return dvm.util.getBeautifulIRI(dvm.mm.getPropIdByMappingId(dvm.state.mapping.jsonld, propMappingId));
                    }
                    dvm.deleteClass = function() {
                        dvm.state.deleteClass(dvm.state.selectedClassMappingId);
                        dvm.state.resetEdit();
                        dvm.state.selectedClassMappingId = '';
                    }
                    dvm.deleteProp = function() {
                        var classMapping = _.find(dvm.state.mapping.jsonld, {'@id': dvm.state.selectedClassMappingId});
                        dvm.state.deleteProp(dvm.state.selectedPropMappingId, classMapping['@id']);
                        dvm.state.resetEdit();
                        dvm.state.selectedClassMappingId = classMapping['@id'];
                    }
                },
                templateUrl: 'modules/mapper/directives/mappingOverlays/mappingOverlays.html'
            }
        }
})();
