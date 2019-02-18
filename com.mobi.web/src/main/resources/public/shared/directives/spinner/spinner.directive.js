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
(function() {
    'use strict';

    function spinner() {
        return {
            restrict: 'E',
            scope: {
                small: '<?'
            },
            template: '<div class="spinner"><div class="icon-wrapper"><i class="fa fa-spin fa-spinner" ng-class="{\'fa-4x\': !small}"></i></div></div>'
        };
    }

    angular
        /**
         * @ngdoc overview
         * @name spinner
         *
         * @description
         * The `spinner` module only provides the `spinner` directive which creates a spinning icon with
         * a transparent background that fills the containing element.
         */
        .module('spinner', [])
        /**
         * @ngdoc directive
         * @name spinner.directive:spinner
         * @restrict E
         *
         * @description
         * `spinner` is a directive that creates a spinning icon with a transparent background that fills
         * the containing the element. Spinner size is controller by the scope variable `small`.
         */
        .directive('spinner', spinner);
})();