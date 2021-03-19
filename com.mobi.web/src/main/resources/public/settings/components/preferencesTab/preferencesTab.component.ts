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

import { OnInit, Inject, Component } from '@angular/core';

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
@Component({
    selector: 'preferences-tab',
    templateUrl: './preferencesTab.component.html'
})

export class PreferencesTabComponent implements OnInit {

    errorMessage = '';
    tabs = [];
    preferenceGroups = [];
    settings = this.sm.getSettings();
    
    constructor(@Inject('preferenceManagerService') private pm, @Inject('settingsManagerService') private sm,
    @Inject('utilService') private util) {}
    
    ngOnInit(): void {
        this.setPreferenceTabs();
    }

    addTab(preferenceGroup: string): void {
        this.tabs.push({
            type: preferenceGroup,
            heading: this.util.getBeautifulIRI(preferenceGroup),
            active: false
        });
    }

    select(selectedTab): void {
        forEach(this.tabs, tab => {
            if (tab.active && !isEqual(tab, selectedTab)) {
                tab.active = false;
            }
        });
        selectedTab.active = true;
    }

    setPreferenceTabs(): void {
        this.pm.getPreferenceGroups()
        .then(response => {
            this.tabs = [];
            this.errorMessage = '';
            forEach(response.data, preferenceGroup => {
                this.addTab(preferenceGroup);
            });
        }, error => this.errorMessage = error);
    }

    save(): void {
        this.sm.setSettings(this.settings);
    }
}