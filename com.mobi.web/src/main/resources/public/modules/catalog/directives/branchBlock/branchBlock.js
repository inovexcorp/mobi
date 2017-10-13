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
         * @name branchBlock
         *
         * @description
         * The `branchBlock` module only provides the `branchBlock` directive which creates
         * a div with a {@link block.directive:block block} containing all information about the
         * currently opened branch in the current
         * {@link catalogState.service:catalogStateService#catalogs catalog}.
         */
        .module('branchBlock', [])
        /**
         * @ngdoc directive
         * @name branchBlock.directive:branchBlock
         * @scope
         * @restrict E
         * @requires catalogState.service:cataStateService
         * @requires catalogManager.service:catalogManagerService
         * @requires prefixes.service:prefixes
         * @requires utilService.service:utilService
         *
         * @description
         * `branchBlock` is a directive which creates a div with a {@link block.directive:block block}
         * containing all information about the currently opened branch in the current
         * {@link catalogState.service:catalogStateService#catalogs catalog}. This branch is retrieved from the
         * current catalog's opened path. Information displayed includes the
         * branch's title, issued and modified {@link entityDates.directive:entityDates dates},
         * {@link entityDescription.directive:entityDescription description}, and its head commit.
         * The directive is replaced by the contents of its template.
         */
        .directive('branchBlock', branchBlock);

    branchBlock.$inject = ['catalogStateService', 'catalogManagerService', 'prefixes', 'utilService'];

    function branchBlock(catalogStateService, catalogManagerService, prefixes, utilService) {
        return {
            restrict: 'E',
            replace: true,
            controllerAs: 'dvm',
            scope: {},
            controller: function() {
                var dvm = this;
                dvm.state = catalogStateService;
                dvm.cm = catalogManagerService;
                dvm.prefixes = prefixes;
                dvm.util = utilService;
                dvm.branch = dvm.state.getCurrentCatalog().openedPath[dvm.state.getCurrentCatalog().openedPath.length - 1];
                dvm.recordId = _.get(dvm.state.getCurrentCatalog().openedPath[dvm.state.getCurrentCatalog().openedPath.length - 2], '@id', '');
            },
            templateUrl: 'modules/catalog/directives/branchBlock/branchBlock.html'
        };
    }
})();
