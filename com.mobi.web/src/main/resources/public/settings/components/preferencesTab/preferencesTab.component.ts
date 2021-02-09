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
import { forEach, isEqual } from 'lodash';

import './preferencesTab.component.scss';
import utilService from '../../../shared/services/util.service';

const template = require('./preferencesTab.component.html');

/**
 * @ngdoc component
 * @name settings.component:preferencesTab
 * @requires shared.service:settingsManagerService
 *
 * @description
 * `preferencesTab` is a component that creates a Bootstrap `row` with a {@link shared.component:block block} containing
 * a form allowing the current user to change their display preferences. The preferences are displayed using a
 * {@link settings.component:preferencesContainer preferencesContainer} and several
 * {@link settings.component:customPreference customPreference}.
 */
const preferencesTabComponent = {
    template,
    bindings: {},
    controllerAs: 'dvm',
    controller: preferencesTabComponentCtrl
};

preferencesTabComponentCtrl.$inject = ['utilService', 'preferenceManagerService', 'settingsManagerService'];

function preferencesTabComponentCtrl(utilService, preferenceManagerService, settingsManagerService) {
    var dvm = this;
    var pm = preferenceManagerService;
    var util = utilService;
    dvm.tabs = [];
    dvm.preferenceGroups = [];
    dvm.sm = settingsManagerService;
    dvm.settings = dvm.sm.getSettings();
    
    dvm.$onInit = function() {
        dvm.setPreferenceTabs();
    };

    dvm.addTab = function(preferenceGroup) {
        dvm.tabs.push({
            type: preferenceGroup,
            heading: util.getBeautifulIRI(preferenceGroup),
            active: false
        });
    }

    dvm.select = function(selectedTab) {
        forEach(dvm.tabs, tab => {
            if (tab.active && !isEqual(tab, selectedTab)) {
                tab.active = false;
            }
        });
        selectedTab.active = true;
    };

    dvm.setPreferenceTabs = function() {
        pm.getPreferenceGroups()
        .then(response => {
            dvm.tabs = [];
            dvm.errorMessage = '';
            util.createSuccessToast('Preference Groups retrieved successfully');
            forEach(response.data, preferenceGroup => {
                dvm.addTab(preferenceGroup);
            });
        }, error => dvm.errorMessage = error);
    };

    dvm.save = function() {
        dvm.sm.setSettings(dvm.settings);
    };
}

export default preferencesTabComponent;