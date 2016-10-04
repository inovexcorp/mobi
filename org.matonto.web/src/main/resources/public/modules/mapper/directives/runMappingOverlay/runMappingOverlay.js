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
         * @name runMappingOverlay
         */
        .module('runMappingOverlay', [])
        /**
         * @ngdoc directive
         * @name runMappingOverlay.directive:runMappingOverlay
         * @scope
         * @restrict E
         * @requires  $filter
         * @requires  ontologyManager.service:ontologyManagerService
         * @requires  mappingManager.service:mappingManagerService
         * @requires  mapperState.service:mapperStateService
         */
        .directive('runMappingOverlay', runMappingOverlay);

        runMappingOverlay.$inject = ['$filter', 'mapperStateService', 'mappingManagerService', 'delimitedManagerService'];

        function runMappingOverlay($filter, mapperStateService, mappingManagerService, delimitedManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {},
                controller: function() {
                    var dvm = this;
                    dvm.state = mapperStateService;
                    dvm.mm = mappingManagerService;
                    dvm.dm = delimitedManagerService;
                    dvm.fileName = ($filter('splitIRI')(dvm.mm.mapping.id)).end;
                    dvm.format = 'jsonld';
                    dvm.errorMessage = '';

                    dvm.run = function() {
                        if (dvm.state.editMapping) {
                            if (_.includes(dvm.mm.mappingIds, dvm.mm.mapping.id)) {
                                dvm.mm.deleteMapping(dvm.mm.mapping.id)
                                    .then(() => dvm.mm.upload(dvm.mm.mapping.jsonld, dvm.mm.mapping.id), errorMessage => dvm.errorMessage = errorMessage)
                                    .then(() => runMapping(), errorMessage => dvm.errorMessage = errorMessage);
                            } else {
                                dvm.mm.upload(dvm.mm.mapping.jsonld, dvm.mm.mapping.id)
                                    .then(() => runMapping(), errorMessage => dvm.errorMessage = errorMessage);
                            }
                        } else {
                            runMapping();
                        }
                    }
                    dvm.cancel = function() {
                        dvm.state.displayRunMappingOverlay = false;
                    }
                    function runMapping() {
                        dvm.dm.map(dvm.mm.mapping.id, dvm.format, dvm.fileName);
                        dvm.state.step = dvm.state.selectMappingStep;
                        dvm.state.initialize();
                        dvm.state.resetEdit();
                        dvm.mm.mapping = undefined;
                        dvm.mm.sourceOntologies = [];
                        dvm.dm.reset();
                        dvm.state.displayRunMappingOverlay = false;
                    }
                },
                templateUrl: 'modules/mapper/directives/runMappingOverlay/runMappingOverlay.html'
            }
        }
})();
