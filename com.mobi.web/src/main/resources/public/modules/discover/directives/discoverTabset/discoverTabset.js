/*-
 * #%L
 * com.mobi.web
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
         * @name discoverTabset
         *
         * @description
         * The `discoverTabset` module only provides the `discoverTabset` directive which creates
         * the discover tabset.
         */
        .module('discoverTabset', [])
        /**
         * @ngdoc directive
         * @name discoverTabset.directive:discoverTabset
         * @scope
         * @restrict E
         * @requires discoverState.service:discoverStateService
         *
         * @description
         * HTML contents in the discover tabset which contains the explore and query tabs.
         */
        .directive('discoverTabset', discoverTabset);
        
    discoverTabset.$inject = ['discoverStateService'];
        
    function discoverTabset(discoverStateService) {
        return {
            restrict: 'E',
            templateUrl: 'modules/discover/directives/discoverTabset/discoverTabset.html',
            replace: true,
            scope: {},
            controllerAs: 'dvm',
            controller: function() {
                var dvm = this;
                dvm.ds = discoverStateService;
            }
        }
    }
})();