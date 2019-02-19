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

    function actionMenuItem() {
        return {
            require: '^^actionMenu',
            restrict: 'E',
            replace: true,
            scope: {
                displayText: '<',
                icon: '<'
            },
            templateUrl: 'shared/directives/actionMenuItem/actionMenuItem.directive.html'
        };
    }

    angular
        .module('shared')
        /**
         * @ngdoc directive
         * @name actionMenu.directive:actionMenu
         * @scope
         * @restrict E
         *
         * @description
         * `actionMenu` is a directive that creates a link element to be used within an
         * {@link shared.directive:actionMenu}. The directive expects text to be used for the link display along
         * with a Font Awesome class name for an icon display as well. The directive is replaced by the content of the
         * template.
         *
         * @param {string} displayText The text to be displayed for the action menu item
         * @param {string} icon A Font Awesome class name for an icon in the action menu item
         */
        .directive('actionMenuItem', actionMenuItem);
})();