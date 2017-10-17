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

    angular
        /**
         * @ngdoc overview
         * @name preferencesTab
         *
         * @description
         * The `preferencesTab` module only provides the `preferencesTab` directive which creates
         * a Bootstrap `row` with a form allowing the current user to their preferences.
         */
        .module('preferencesTab', [])
        /**
         * @ngdoc directive
         * @name preferencesTab.directive:preferencesTab
         * @scope
         * @restrict E
         * @requires settingsManager.service:settingsManagerService
         *
         * @description
         * `preferencesTab` is a directive that creates a Bootstrap `row` with a
         * {@link block.directive:block block} containing a form allowing the current user to
         * change their display preferences. The preferences are displayed using a
         * {@link preferencesContainer.directive:preferencesContainer preferencesContainer} and
         * several {@link customPreference.directive:customPreference customPreference}. The
         * directive is replaced by the content of its template.
         */
        .directive('preferencesTab', preferencesTab);

        preferencesTab.$inject = ['settingsManagerService'];

        function preferencesTab(settingsManagerService) {
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
                templateUrl: 'modules/settings/directives/preferencesTab/preferencesTab.html'
            }
        }
})();
