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

import './preferencesTab.component.scss';


/**
 * @name settings.PreferencesTabComponent
 * @requires shared.service:preferenceManagerService
 *
 * `preferencesTab` is a component that creates a Bootstrap `row` with a both a sidebar containing Preference Groups configured in the application as well as another section displaying the various preference forms contained within that preference group.
 */
@Component({
    selector: 'preferences-tab',
    templateUrl: './preferencesTab.component.html'
})

export class PreferencesTabComponent implements OnInit {
    tabs = [];
    
    constructor(@Inject('preferenceManagerService') private pm, @Inject('utilService') private util) {}
    
    ngOnInit(): void {
        this.setPreferenceTabs();
    }

    addTab(preferenceGroup: any): void {
        if (!preferenceGroup['http://www.w3.org/2000/01/rdf-schema#label']) {
            this.util.createErrorToast('Preference Group not configured with label.')
            return;
        }
        this.tabs.push({
            type: preferenceGroup['@id'],
            heading: preferenceGroup['http://www.w3.org/2000/01/rdf-schema#label'][0]['@value'],
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
            forEach(response.data, preferenceGroup => {
                this.addTab(preferenceGroup);
            });
            if (this.tabs.length) {
                this.tabs[0].active = true;
            }
        }, (errorMessage) => this.util.createErrorToast(errorMessage));
    }
}