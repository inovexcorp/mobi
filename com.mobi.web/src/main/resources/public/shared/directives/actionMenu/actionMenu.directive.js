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

    function actionMenu() {
        return {
            restrict: 'E',
            replace: true,
            transclude: true,
            scope: {},
            templateUrl: 'shared/directives/actionMenu/actionMenu.directive.html'
        };
    }

    angular
        /**
         * @ngdoc overview
         * @name actionMenu
         *
         * @description
         * The `actionMenu` module only provides the `actionMenu` directive which creates a div element with a
         * dropdown of actions.
         */
        .module('actionMenu', [])
        /**
         * @ngdoc directive
         * @name actionMenu.directive:actionMenu
         * @scope
         * @restrict E
         *
         * @description
         * `actionMenu` is a directive that creates a `uib-dropdown` div element that is meant to contain
         * {@link actionMenuItem.directive:actionMenuItem actionMenuItems} for performing various actions. Typically,
         * this directive should be used in a `.list-group-item`. The directive is replaced by the content of the
         * template.
         */
        .directive('actionMenu', actionMenu);
})();