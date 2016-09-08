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
        .module('downloadMappingOverlay', [])
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
                    dvm.downloadFormat = 'jsonld';

                    dvm.cancel = function() {
                        dvm.state.displayDownloadMapping = false;
                    }
                    dvm.download = function() {
                        dvm.mm.downloadMapping(dvm.mm.mapping.name, dvm.downloadFormat);
                        dvm.state.displayDownloadMapping = false;
                    }
                },
                templateUrl: 'modules/mapper/new-directives/downloadMappingOverlay/downloadMappingOverlay.html'
            }
        }
})();
