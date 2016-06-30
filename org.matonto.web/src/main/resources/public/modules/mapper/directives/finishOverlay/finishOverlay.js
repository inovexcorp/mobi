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
         * @name finishOverlay
         * @requires  mappingManager
         * @requires  mapperState
         * @requires  delimitedManager
         *
         * @description 
         * The `finishOverlay` module only provides the `finishOverlay` directive which creates
         * an overlay with button to finish the mapping process and optionally save the mapping 
         * locally.
         */
        .module('finishOverlay', ['mapperState', 'mappingManager', 'delimitedManager'])
        /**
         * @ngdoc directive
         * @name finishOverlay.directive:finishOverlay
         * @scope
         * @restrict E
         * @requires  mappingManager.service:mappingManagerService
         * @requires  mapperState.service:mapperStateService
         * @requires  delimitedManager.service:delimitedManagerService
         *
         * @description 
         * `finishOverlay` is a directive that creates an overlay with button to finish the mapping 
         * process and optionally save the mapping locally. The directive is replaced by the contents 
         * of its template.
         */
        .directive('finishOverlay', finishOverlay);

        finishOverlay.$inject = ['mapperStateService', 'mappingManagerService', 'delimitedManagerService'];

        function finishOverlay(mapperStateService, mappingManagerService, delimitedManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {},
                controller: function() {
                    var dvm = this;
                    dvm.state = mapperStateService;
                    dvm.mm = mappingManagerService;
                    dvm.cm = delimitedManagerService;

                    dvm.save = function() {
                        dvm.mm.downloadMapping(dvm.mm.mapping.name);
                        dvm.finish();
                    }
                    dvm.finish = function() {
                        dvm.state.initialize();
                        dvm.state.resetEdit();
                        dvm.mm.mapping = undefined;
                        dvm.mm.sourceOntologies = [];
                        dvm.cm.reset();
                    }
                },
                templateUrl: 'modules/mapper/directives/finishOverlay/finishOverlay.html'
            }
        }
})();
