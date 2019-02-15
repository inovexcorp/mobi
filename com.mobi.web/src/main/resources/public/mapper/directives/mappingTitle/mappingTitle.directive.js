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
         * @name mappingTitle
         *
         * @description
         * The `mappingTitle` module only provides the `mappingTitle` directive
         * which creates a div containing the name of the current
         * {@link mapperState.service:mapperStateService#mapping mapping}.
         */
        .module('mappingTitle', [])
        /**
         * @ngdoc directive
         * @name mappingTitle.directive:mappingTitle
         * @scope
         * @restrict E
         * @requires  mapperState.service:mapperStateService
         *
         * @description
         * `mappingTitle` is a directive which creates a div with the name of the current
         * {@link mapperState.service:mapperStateService#mapping mapping}.
         */
        .directive('mappingTitle', mappingTitle);

        mappingTitle.$inject = ['mapperStateService'];

        function mappingTitle(mapperStateService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {},
                controller: function() {
                    var dvm = this;
                    dvm.state = mapperStateService;
                },
                templateUrl: 'mapper/directives/mappingTitle/mappingTitle.directive.html'
            }
        }
})();
