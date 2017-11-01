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
         * @name classBlock
         *
         * @description
         * The `classBlock` module only provides the `classBlock` directive which creates
         * the display for the class details associated with a selected dataset.
         */
        .module('classBlock', [])
        /**
         * @ngdoc directive
         * @name classBlock.directive:classBlock
         * @scope
         * @restrict E
         * @requires discoverState.service:discoverStateService
         *
         * @description
         * HTML contents in the class block which contains the class details associatd with
         * a selected dataset.
         */
        .directive('classBlock', classBlock);

        classBlock.$inject = ['discoverStateService'];

        function classBlock(discoverStateService) {
            return {
                restrict: 'E',
                templateUrl: 'modules/discover/sub-modules/explore/directives/classBlock/classBlock.html',
                replace: true,
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    this.ds = discoverStateService;
                }
            }
        }
})();