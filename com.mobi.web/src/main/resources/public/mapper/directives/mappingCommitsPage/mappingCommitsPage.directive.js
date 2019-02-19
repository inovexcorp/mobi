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
         * @name mappingCommitsPage
         *
         * @description
         * The `mappingCommitsPage` module only provides the `mappingCommitsPage` directive which creates
         * a Bootstrap `row` with {@link block.directive:block blocks} for editing the current
         * {@link shared.service:mapperStateService#mapping mapping}.
         */
        .module('mappingCommitsPage', [])
        /**
         * @ngdoc directive
         * @name mappingCommitsPage.directive:mappingCommitsPage
         * @scope
         * @restrict E
         * @requires shared.service:mapperStateService
         * @requires shared.service:utilService
         * @requires shared.service:prefixes
         *
         * @description
         * 
         */
        .directive('mappingCommitsPage', mappingCommitsPage);

        mappingCommitsPage.$inject = ['mapperStateService', 'utilService', 'prefixes'];

        function mappingCommitsPage(mapperStateService, utilService, prefixes) {
            return {
                restrict: 'E',
                replace: true,
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    dvm.prefixes = prefixes;
                    dvm.util = utilService;
                    dvm.state = mapperStateService;

                    if (!dvm.state.mapping.branch && !dvm.state.newMapping) {
                        dvm.state.setMasterBranch();
                    }
                },
                templateUrl: 'mapper/directives/mappingCommitsPage/mappingCommitsPage.directive.html'
            }
        }
})();