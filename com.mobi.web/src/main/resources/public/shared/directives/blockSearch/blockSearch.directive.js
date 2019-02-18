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

    function blockSearch() {
        return {
            restrict: 'E',
            replace: true,
            require: '^^block',
            scope: {
                bindModel: '=ngModel',
                keyupEvent: '&',
                clearEvent: '&'
            },
            templateUrl: 'shared/directives/blockSearch/blockSearch.directive.html'
        }
    }
    
    angular
        /**
         * @ngdoc overview
         * @name blockSearch
         *
         */
        .module('blockSearch', [])
        /**
         * @ngdoc directive
         * @name blockSearch.directive:blockSearch
         * @scope
         * @restrict E
         *
         */
        .directive('blockSearch', blockSearch);
})();
