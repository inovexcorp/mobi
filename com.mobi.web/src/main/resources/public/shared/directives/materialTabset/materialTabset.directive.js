/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2018 iNovex Information Systems, Inc.
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
         * @name materialTabset
         *
         * @description
         * The `materialTabset` module provides the `materialTabset` directive which creates a container for
         * {@link materialTab.directive:materialTab tabs} and headers about the tabs.
         */
        .module('materialTabset', [])
        /**
         * @ngdoc directive
         * @name materialTabset.directive:materialTabset
         * @scope
         * @restrict E
         *
         * @description
         * `materialTabset` is a directive that creates a `div` containing
         * {@link materialTab.directive:materialTab tabs} and headers about the tabs displayed as `.nav-tabs`. The
         * tabs are transcluded into this directive and headers are generated for them. The directive is replaced
         * by the contents of its template.
         */
        .directive('materialTabset', materialTabset);

        materialTabset.$inject = ['$timeout'];

        function materialTabset($timeout) {
            return {
                restrict: 'E',
                replace: true,
                transclude: true,
                scope: {},
                templateUrl: 'shared/directives/materialTabset/materialTabset.directive.html',
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;

                    dvm.tabs = [];

                    dvm.addTab = function(tab) {
                        dvm.tabs.push(tab);
                    }
                    dvm.removeTab = function(tab) {
                        _.pull(dvm.tabs, tab);
                    }
                    dvm.select = function(selectedTab) {
                        _.forEach(dvm.tabs, tab => {
                            if (tab.active && !_.isEqual(tab, selectedTab)) {
                                tab.active = false;
                            }
                        });
                        $timeout(function() {
                            selectedTab.onClick();
                            selectedTab.active = true;
                        });
                    }
                }
            }
        }
})();
