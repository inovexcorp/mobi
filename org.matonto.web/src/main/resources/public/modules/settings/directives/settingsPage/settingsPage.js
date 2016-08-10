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
        /**
         * @ngdoc overview
         * @name settingsPage
         *
         * @description 
         * The `settingsPage` module only provides the `settingsPage` directive which creates 
         * a "page" containing a form for changing user settings.
         */
        .module('settingsPage', [])
        /**
         * @ngdoc directive
         * @name settingsPage.directive:settingsPage
         * @scope
         * @restrict E
         *
         * @description
         * `settingsPage` is a directive that creates a div with a form for changing the settings in 
         * {@link settingManager.service:settingsManagerService settingManagerService} using 
         * {@link customSetting.directive:customSetting customSetting} directives and a save button. 
         * The directive is replaced by the content of its template.
         */
        .directive('settingsPage', settingsPage);

        settingsPage.$inject = ['settingsManagerService'];

        function settingsPage(settingsManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {},
                controller: function() {
                    var dvm = this;
                    dvm.sm = settingsManagerService;
                    dvm.settings = dvm.sm.getSettings();

                    dvm.save = function() {
                        dvm.sm.setSettings(dvm.settings);
                    }
                },
                templateUrl: 'modules/settings/directives/settingsPage/settingsPage.html'
            }
        }
})();