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

    function materialTab() {
        return {
            restrict: 'E',
            require: '^^materialTabset',
            transclude: true,
            replace: true,
            scope: {
                active: '=?',
                hideTab: '<?',
                heading: '<',
                onClick: '&'
            },
            templateUrl: 'shared/directives/materialTab/materialTab.directive.html',
            link: function(scope, elem, attr, materialTabsetController) {
                materialTabsetController.addTab(scope);
                scope.$on('$destroy', function() {
                    materialTabsetController.removeTab(scope);
                });
            }
        }
    }

    angular
        /**
         * @ngdoc overview
         * @name materialTab
         *
         * @description
         * The `materialTab` module provides the `materialTab` directive which creates a tab for use within a
         * {@link materialTabset.directive:materialTabset}.
         */
        .module('materialTab', [])
        /**
         * @ngdoc directive
         * @name materialTab.directive:materialTab
         * @scope
         * @restrict E
         *
         * @description
         * `materialTab` is a directive that creates a `div` containing transluded content. It is meant to be used as
         * a child of the {@link materialTabset.directive:materialTabset} directive. The data provided on this
         * directive is used to populate behavior in the headers generated in the `materialTabset`. This includes
         * whether or not the tab is active, the heading text, whether the tab should be hidden, and the click behavior.
         * The directive is replaced by the contents of its template.
         */
        .directive('materialTab', materialTab);
})();
