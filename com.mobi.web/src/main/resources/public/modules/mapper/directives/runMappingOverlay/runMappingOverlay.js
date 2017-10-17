/*-
 * #%L
 * com.mobi.web
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
         * @requires $filter
         * @requires mapperState.service:mapperStateService
         * @requires delimitedManager.service:delimitedManagerService
         * @requires datasetManager.service:datasetManagerService
         * @requires util.service:utilService
         * @requires prefixes.service:prefixes
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

        runMappingOverlay.$inject = ['$filter', 'mapperStateService', 'delimitedManagerService', 'datasetManagerService', 'utilService', 'prefixes'];

        function runMappingOverlay($filter, mapperStateService, delimitedManagerService, datasetManagerService, utilService, prefixes) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {},
                controller: function() {
                    var dvm = this;
                    dvm.state = mapperStateService;
                    dvm.dm = delimitedManagerService;
                    dvm.dam = datasetManagerService;
                    dvm.util = utilService;
                    dvm.fileName = $filter('camelCase')(dvm.state.mapping.record.title, 'class');
                    dvm.format = 'turtle';
                    dvm.errorMessage = '';
                    dvm.runMethod = 'download';
                    dvm.datasetRecords = [];

                    dvm.dam.getDatasetRecords().then(response => {
                        dvm.datasetRecords =_.map(response.data, arr => _.find(arr, obj => _.includes(obj['@type'], prefixes.dataset + 'DatasetRecord')));
                    }, onError);

                    dvm.run = function() {
                        if (dvm.state.editMapping) {
                            dvm.state.saveMapping().then(runMapping, onError);
                        } else {
                            runMapping(dvm.state.mapping.record.id);
                        }
                    }
                    dvm.cancel = function() {
                        dvm.state.displayRunMappingOverlay = false;
                    }

                    function onError(errorMessage) {
                        dvm.errorMessage = errorMessage;
                    }
                    function runMapping(id) {
                        dvm.state.mapping.record.id = id;
                        if (dvm.runMethod === 'download') {
                            dvm.dm.mapAndDownload(id, dvm.format, dvm.fileName);
                            reset();
                        } else {
                            dvm.dm.mapAndUpload(id, dvm.datasetRecordIRI).then(reset, onError);
                        }
                    }
                    function reset() {
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
