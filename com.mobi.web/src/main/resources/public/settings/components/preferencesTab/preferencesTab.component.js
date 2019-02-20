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
    /**
     * @ngdoc component
     * @name settings.component:preferencesTab
     * @requires shared.service:settingsManagerService
     *
     * @description
     * `preferencesTab` is a component that creates a Bootstrap `row` with a {@link shared.directive:block block} containing
     * a form allowing the current user to change their display preferences. The preferences are displayed using a
     * {@link settings.component:preferencesContainer preferencesContainer} and several
     * {@link settings.component:customPreference customPreference}.
     */
    const preferencesTabComponent = {
        templateUrl: 'settings/components/preferencesTab/preferencesTab.component.html',
        bindings: {},
        controllerAs: 'dvm',
        controller: preferencesTabComponentCtrl
    };

    preferencesTabComponentCtrl.$inject = ['settingsManagerService'];

    function preferencesTabComponentCtrl(settingsManagerService) {
        var dvm = this;
        dvm.sm = settingsManagerService;
        dvm.settings = dvm.sm.getSettings();

        dvm.save = function() {
            dvm.sm.setSettings(dvm.settings);
        }
    }

    angular.module('settings')
        .component('preferencesTab', preferencesTabComponent);
})();