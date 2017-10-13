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
(function () {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name localTab
         *
         * @description
         * The `localTab` module only provides the `localTab` directive which creates
         * a Bootstrap `row` with a search bar and different {@link block.directive:block blocks}
         * depending on what type of entity is current open.
         */
        .module('localTab', [])
        /**
         * @ngdoc directive
         * @name localTab.directive:localTab
         * @scope
         * @restrict E
         * @requires catalogState.service:catalogStateService
         * @requires catalogManager.service:catalogManagerService
         *
         * @description
         * `localTab` is a directive that creates a Bootstrap `row` div with one column containing
         * a {@link searchRow.directive:searchRow search row} for records and different
         * {@link block.directive:block block} directives depending on the length of the opened path
         * of the local catalog and the type of the opened entity. The three block directives are
         * {@link resultsBlock.directive:resultsBlock resultsBlock},
         * {@link recordBlock.directive:recordBlock recordBlock},
         * and {@link branchBlock.directive:branchBlock branchBlock}. The directive is replaced by
         * the contents of its template.
         */
        .directive('localTab', localTab);

    localTab.$inject = ['catalogStateService', 'catalogManagerService'];

    function localTab(catalogStateService, catalogManagerService) {
        return {
            restrict: 'E',
            replace: true,
            controllerAs: 'dvm',
            scope: {},
            controller: function() {
                var dvm = this;
                dvm.state = catalogStateService;
                dvm.cm = catalogManagerService;

                dvm.getOpenedEntity = function() {
                    return dvm.state.catalogs.local.openedPath[dvm.state.catalogs.local.openedPath.length - 1];
                }
            },
            templateUrl: 'modules/catalog/directives/localTab/localTab.html'
        };
    }
})();
