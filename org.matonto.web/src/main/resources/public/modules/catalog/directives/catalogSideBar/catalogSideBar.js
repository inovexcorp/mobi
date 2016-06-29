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
         * @name catalogSideBar
         *
         * @description
         * The `catalogSideBar` module only provides the `catalogSideBar` directive which
         * creates a left navigation of action buttons for the catalog.
         */
        .module('catalogSideBar', [])
        /**
         * @ngdoc directive
         * @name catalogSideBar.directive:catalogSideBar
         * @scope
         * @restrict E
         *
         * @description 
         * `catalogSideBar` is a directive that creates a "left-nav" div with buttons for catalog
         * actions. There are currently no actions for the catalog.
         */
        .directive('catalogSideBar', catalogSideBar);

        function catalogSideBar() {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                scope: {},
                templateUrl: 'modules/catalog/directives/catalogSideBar/catalogSideBar.html'
            }
        }
})();
