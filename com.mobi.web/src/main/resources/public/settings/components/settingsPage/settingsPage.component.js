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
     * @name settings.component:settingsPage
     *
     * @description
     * `settingsPage` is a component which creates a {@link tabset.directive:tabset tabset} with
     * {@link tab.directive:tab tabs} for different settings pertaining to the current user. The tabs are
     * {@link settings.component:profileTab profileTab}, {@link settings.component:passwordTab passwordTab}, and the
     * {@link settings.component:preferencesTab preferencesTab}.
     */
    const settingsPageComponent = {
        templateUrl: 'settings/components/settingsPage/settingsPage.component.html',
        bindings: {},
        controllerAs: 'dvm',
        controller: settingsPageComponentCtrl
    };

    function settingsPageComponentCtrl() {
        var dvm = this;
        dvm.tabs = {
            profile: true,
            group: false,
            password: false,
            preferences: false
        };
    }

    angular.module('settings')
        .component('settingsPage', settingsPageComponent);
})();