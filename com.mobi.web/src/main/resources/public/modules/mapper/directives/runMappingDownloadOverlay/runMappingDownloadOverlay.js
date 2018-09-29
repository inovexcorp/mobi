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
         * @name runMappingDownloadOverlay
         *
         * @description
         * The `runMappingDownloadOverlay` module only provides the `runMappingDownloadOverlay` directive which creates
         * an overlay with settings to download the results
         */
        .module('runMappingDownloadOverlay', [])
        /**
         * @ngdoc directive
         * @name runMappingDownloadOverlay.directive:runMappingDownloadOverlay
         * @scope
         * @restrict E
         * @requires $filter
         * @requires mapperState.service:mapperStateService
         * @requires delimitedManager.service:delimitedManagerService
         * @requires util.service:utilService
         *
         * @description
         * `runMappingDownloadOverlay` is a directive that creates an overlay containing a configuration settings
         * for the result of running the currently selected {@link mapperState.service:mapperStateService#mapping mapping}
         * against the uploaded {@link delimitedManager.service:delimitedManagerService#dataRows delimited data}.
         * This includes a {@link textInput.directive:textInput text input} for the file name of the downloaded
         * mapped data and a {@link mapperSerializationSelect.directive:mapperSerializationSelect mapperSerializationSelect}
         * for the RDF format of the mapped data. The directive is replaced by the contents of its template.
         */
        .directive('runMappingDownloadOverlay', runMappingDownloadOverlay);

        runMappingDownloadOverlay.$inject = ['$filter', 'mapperStateService', 'delimitedManagerService', 'utilService'];

        function runMappingDownloadOverlay($filter, mapperStateService, delimitedManagerService, utilService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {},
                controller: function() {
                    var dvm = this;
                    var state = mapperStateService;
                    var dm = delimitedManagerService;
                    dvm.util = utilService;
                    dvm.fileName = $filter('camelCase')(state.mapping.record.title, 'class');
                    dvm.format = 'turtle';
                    dvm.errorMessage = '';

                    dvm.run = function() {
                        if (state.editMapping && state.isMappingChanged()) {
                            state.saveMapping().then(runMapping, onError);
                        } else {
                            runMapping(state.mapping.record.id);
                        }
                    }
                    dvm.cancel = function() {
                        state.displayRunMappingDownloadOverlay = false;
                    }

                    function onError(errorMessage) {
                        dvm.errorMessage = errorMessage;
                    }
                    function runMapping(id) {
                        state.mapping.record.id = id;
                        dm.mapAndDownload(id, dvm.format, dvm.fileName);
                        reset();
                    }
                    function reset() {
                        state.step = state.selectMappingStep;
                        state.initialize();
                        state.resetEdit();
                        dm.reset();
                        state.displayRunMappingDownloadOverlay = false;
                    }
                },
                templateUrl: 'modules/mapper/directives/runMappingDownloadOverlay/runMappingDownloadOverlay.html'
            }
        }
})();
