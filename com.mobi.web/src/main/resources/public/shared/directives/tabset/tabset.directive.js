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

    tabset.$inject = ['$timeout'];

    function tabset($timeout) {
        return {
            restrict: 'E',
            replace: true,
            transclude: true,
            scope: {},
            templateUrl: 'shared/directives/tabset/tabset.directive.html',
            controllerAs: 'dvm',
            controller: function() {
                var dvm = this;

                dvm.tabs = [];

                dvm.addTab = function(tab) {
                    if (dvm.tabs.length && _.get(_.last(dvm.tabs), 'isLast')) {
                        dvm.tabs.splice(dvm.tabs.length - 1, 0, tab);
                    } else {
                        dvm.tabs.push(tab);
                    }
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

    angular
        .module('tabset', [])
        .directive('tabset', tabset);
})();
