/*-
 * #%L
 * org.matonto.web
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

    angular
        .module('settingsSideBar', [])
        .directive('settingsSideBar', settingsSideBar);

        settingsSideBar.$inject = ['settingsStateService']

        function settingsSideBar(settingsStateService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                scope: {},
                controller: function() {
                    var dvm = this;
                    dvm.state = settingsStateService;

                    dvm.openUserInfo = function() {
                        dvm.state.reset();
                        dvm.state.showUserInfo = true;
                    }
                    dvm.openChangePassword = function() {
                        dvm.state.reset();
                        dvm.state.showChangePassword = true;
                    }
                    dvm.openSettings = function() {
                        dvm.state.reset();
                        dvm.state.showSettings = true;
                    }
                },
                templateUrl: 'modules/settings/directives/settingsSideBar/settingsSideBar.html'
            }
        }
})();
