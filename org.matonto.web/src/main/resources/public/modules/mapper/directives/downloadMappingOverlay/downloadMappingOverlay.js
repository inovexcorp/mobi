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
         * @name downloadMappingOverlay
         *
         * @description
         * The `downloadMappingOverlay` module only provides the `downloadMappingOverlay` directive which creates
         * an overlay with functionality to download the current
         * {@link mapperState.service:mapperStateService#mapping mapping}.
         */
        .module('downloadMappingOverlay', [])
        /**
         * @ngdoc directive
         * @name downloadMappingOverlay.directive:downloadMappingOverlay
         * @scope
         * @restrict E
         * @requires mappingManager.service:mappingManagerService
         * @requires mapperState.service:mapperStateService
         * @requires util.service:utilService
         *
         * @description
         * `downloadMappingOverlay` is a directive that creates an overlay with functionality to download
         * the current {@link mapperState.service:mapperStateService#mapping mapping} in a variety of
         * different formats using a {@link mapperSerializationSelect.directive:mapperSerializationSelect mapperSerializationSelect}.
         * The directive is replaced by the contents of its template.
         */
        .directive('downloadMappingOverlay', downloadMappingOverlay);

        downloadMappingOverlay.$inject = ['mappingManagerService', 'mapperStateService']

        function downloadMappingOverlay(mappingManagerService, mapperStateService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {},
                controller: function() {
                    var dvm = this;
                    dvm.state = mapperStateService;
                    dvm.mm = mappingManagerService;
                    dvm.downloadFormat = 'turtle';

                    dvm.cancel = function() {
                        dvm.state.displayDownloadMappingOverlay = false;
                    }
                    dvm.download = function() {
                        dvm.mm.downloadMapping(dvm.state.mapping.record.id, dvm.downloadFormat);
                        dvm.state.displayDownloadMappingOverlay = false;
                    }
                },
                templateUrl: 'modules/mapper/directives/downloadMappingOverlay/downloadMappingOverlay.html'
            }
        }
})();
