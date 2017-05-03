/*-
 * #%L
 * org.matonto.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
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
         * @name exploreTabHeader
         *
         * @description
         * The `exploreTabHeader` module only provides the `exploreTabHeader` directive which creates
         * the explore tab.
         */
        .module('exploreTabHeader', [])
        /**
         * @ngdoc directive
         * @name sparqlResultTable.directive:exploreTabHeader
         * @scope
         * @restrict E
         *
         * @description
         * HTML contents in the explore tab.
         */
        .directive('exploreTabHeader', exploreTabHeader);

        function exploreTabHeader() {
            return {
                restrict: 'E',
                templateUrl: 'modules/discover/directives/explore/exploreTabHeader/exploreTabHeader.html',
                replace: true,
                scope: {}
            }
        }
})();