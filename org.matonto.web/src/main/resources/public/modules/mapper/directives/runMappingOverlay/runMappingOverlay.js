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
         *
         * @description
         * The `runMappingOverlay` module only provides the `runMappingOverlay` directive which creates
         * an overlay with settings for the results of running a mapping.
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
         *
         * @description
         * `runMappingOverlay` is a directive that creates an overlay containing a configuration settings
         * for the result of running the currently selected {mapperState.service:mapperStateService#mapping mapping}
         * against the uploaded {@link delimitedManager.service:delimitedManagerService#dataRows delimited data}.
         * This includes a {@link textInput.directive:textInput text input} for the file name of the downloaded
         * mapped data and a {@link mapperSerializationSelect.directive:mapperSerializationSelect mapperSerializationSelect}
         * for the RDF format of the mapped data. The directive is replaced by the contents of its template.
         */
        .directive('runMappingOverlay', runMappingOverlay);

        runMappingOverlay.$inject = ['$filter', 'mapperStateService', 'mappingManagerService', 'delimitedManagerService', 'datasetManagerService', 'utilService'];

        function runMappingOverlay($filter, mapperStateService, mappingManagerService, delimitedManagerService, datasetManagerService, utilService) {
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
                    dvm.dam = datasetManagerService;
                    dvm.util = utilService;
                    dvm.fileName = ($filter('splitIRI')(dvm.state.mapping.id)).end;
                    dvm.format = 'turtle';
                    dvm.errorMessage = '';
                    dvm.runMethod = 'download';
                    dvm.datasetRecords = [];

                    dvm.dam.getDatasetRecords().then(response => dvm.datasetRecords = response.data, onError);

                    dvm.run = function() {
                        if (dvm.state.editMapping) {
                            if (_.includes(dvm.mm.mappingIds, dvm.state.mapping.id)) {
                                dvm.mm.updateMapping(dvm.state.mapping.id, dvm.state.mapping.jsonld).then(runMapping, onError);
                            } else {
                                dvm.mm.upload(dvm.state.mapping.jsonld, dvm.state.mapping.id).then(runMapping, onError);
                            }
                        } else {
                            runMapping();
                        }
                    }
                    dvm.cancel = function() {
                        dvm.state.displayRunMappingOverlay = false;
                    }

                    function onError(errorMessage) {
                        dvm.errorMessage = errorMessage;
                    }
                    function runMapping() {
                        if (dvm.runMethod === 'download') {
                            dvm.dm.mapAndDownload(dvm.state.mapping.id, dvm.format, dvm.fileName);
                            reset();
                        } else {
                            dvm.dm.mapAndUpload(dvm.state.mapping.id, dvm.datasetRecordIRI).then(reset, onError);
                        }
                    }
                    function reset() {
                        dvm.state.changedMapping = false;
                        dvm.state.step = dvm.state.selectMappingStep;
                        dvm.state.initialize();
                        dvm.state.resetEdit();
                        dvm.dm.reset();
                        dvm.state.displayRunMappingOverlay = false;
                    }
                },
                templateUrl: 'modules/mapper/directives/runMappingOverlay/runMappingOverlay.html'
            }
        }
})();
