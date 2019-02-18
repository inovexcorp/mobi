/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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
         * @name mapperTabset
         *
         * @description
         * The `mapperTabset` module only provides the `mapperTabset` directive
         * which creates the main {@link tabset.directive:tabset tabset} for the mapping tool.
         */
        .module('mapperTabset', [])
        /**
         * @ngdoc directive
         * @name mapperTabset.directive:mapperTabset
         * @scope
         * @restrict E
         * @requires  mapperState.service:mapperStateService
         *
         * @description
         * `mapperTabset` is a directive which creates a {@link tabset.directive:tabset tabset} with different
         * pages depending on the current {@link mapperState.service:mapperStateService#step step} of the mapping
         * process. The three pages are {@link mappingSelectPage.directive:mappingSelectPage mappingSelectPage},
         * {@link fileUploadPage.directive:fileUploadPage fileUploadPage}, and the
         * {@link editMappingPage.directive:editMappingPage editMappingPage}. The directive is replaced by the
         * contents of its template.
         */
        .directive('mapperTabset', mapperTabset);

        mapperTabset.$inject = ['mapperStateService'];

        function mapperTabset(mapperStateService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'mapper/directives/mapperTabset/mapperTabset.directive.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    dvm.state = mapperStateService;
                }
            }
        }
})();
