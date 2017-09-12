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
         * @name catalogTabset
         *
         * @description
         * The `catalogTabset` module only provides the `catalogTabset` directive
         * which creates the main {@link tabset.directive:tabset tabset} for the catalog module.
         */
        .module('catalogTabset', [])
        /**
         * @ngdoc directive
         * @name catalogTabset.directive:catalogTabset
         * @scope
         * @restrict E
         * @requires  catalogState.service:catalogStateService
         *
         * @description
         * `catalogTabset` is a directive which creates a {@link tabset.directive:tabset tabset} with a tab for
         * each catalog in Mobi: the {@link localTab.directive:localTab local catalog} and the
         * {@link distributedTab.directive:distributedTab distributed catalog}. The directive is replaced by the
         * contents of its template.
         */
        .directive('catalogTabset', catalogTabset);

        catalogTabset.$inject = ['catalogStateService'];

        function catalogTabset(catalogStateService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/catalog/directives/catalogTabset/catalogTabset.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    dvm.state = catalogStateService;
                }
            }
        }
})();
