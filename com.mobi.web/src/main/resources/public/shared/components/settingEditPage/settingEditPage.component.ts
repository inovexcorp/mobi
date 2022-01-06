/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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
import { OnInit, Inject, Component, Input } from '@angular/core';

import { forEach, isEqual } from 'lodash';

import './settingEditPage.component.scss';

// The type of setting to get definitions for
interface TabType {
    type: string;
    heading: string;
    active: boolean;
}

/**
 * @name settings.SettingEditPageComponent
 * @requires shared.service:settingManagerService
 * @requires shared.service.utilService
 * @requires shared.service.prefixes
 *
 * `settingEditPage` is a component that creates a Bootstrap `row` with a both a sidebar 
 * containing Setting Groups configured in the application as well as another section 
 * displaying the various Setting forms contained within that Setting group.
 */
@Component({
    selector: 'setting-edit-page',
    templateUrl: './settingEditPage.component.html'
})
export class SettingEditPageComponent implements OnInit {
    @Input() settingType;
    tabs: TabType[] = [];
    
    constructor(@Inject('settingManagerService') private sm, 
        @Inject('utilService') private util, @Inject('prefixes') private prefixes) {}
    
    ngOnInit(): void {
        this.setSettingTabs();
    }

    addTab(settingGroup: any): void {
        if (!settingGroup[this.prefixes.rdfs + 'label']) {
            this.util.createErrorToast('Setting Group not configured with label.')
            return;
        }
        this.tabs.push({
            type: settingGroup['@id'],
            heading: this.util.getPropertyValue(settingGroup, this.prefixes.rdfs + 'label'),
            active: false
        });
    }

    selectTab(selectedTab: TabType): void {
        forEach(this.tabs, tab => {
            if (tab.active && !isEqual(tab, selectedTab)) {
                tab.active = false;
            }
        });
        selectedTab.active = true;
    }

    setSettingTabs(): void {
        this.sm.getSettingGroups(this.settingType.iri)
            .then(response => {
                this.tabs = [];
                forEach(response.data, settingGroup => {
                    this.addTab(settingGroup);
                });
                if (this.tabs.length) {
                    this.tabs[0].active = true;
                }
            }, (errorMessage) => this.util.createErrorToast(errorMessage));
    }
}
