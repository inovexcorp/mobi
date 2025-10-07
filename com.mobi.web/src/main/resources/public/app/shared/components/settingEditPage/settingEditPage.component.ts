/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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
import { OnInit, Component, Input } from '@angular/core';
import { isEqual } from 'lodash';

import { RDFS } from '../../../prefixes';
import { SettingManagerService } from '../../services/settingManager.service';
import { ToastService } from '../../services/toast.service';
import { getPropertyValue } from '../../utility';
import { JSONLDObject } from '../../models/JSONLDObject.interface';

// The type of setting to get definitions for
interface TabType {
    type: string;
    heading: string;
    active: boolean;
}

/**
 * @class SettingEditPageComponent
 *
 * A component that creates a Bootstrap `row` with both a sidebar containing Setting Groups configured in the
 * application and another section displaying the various Setting forms contained within that Setting group.
 */
@Component({
    selector: 'setting-edit-page',
    templateUrl: './settingEditPage.component.html',
    styleUrls: ['./settingEditPage.component.scss']
})
export class SettingEditPageComponent implements OnInit {
    @Input() settingType;
    tabs: TabType[] = [];
    
    constructor(private sm: SettingManagerService, private toast: ToastService) {}
    
    ngOnInit(): void {
        this.setSettingTabs();
    }

    addTab(settingGroup: JSONLDObject): void {
        if (!settingGroup[`${RDFS}label`]) {
            this.toast.createErrorToast('Setting Group not configured with label.');
            return;
        }
        this.tabs.push({
            type: settingGroup['@id'],
            heading: getPropertyValue(settingGroup, `${RDFS}label`),
            active: false
        });
    }

    selectTab(selectedTab: TabType): void {
        this.tabs.forEach(tab => {
            if (tab.active && !isEqual(tab, selectedTab)) {
                tab.active = false;
            }
        });
        selectedTab.active = true;
    }

    setSettingTabs(): void {
        this.sm.getSettingGroups(this.settingType.iri)
            .subscribe(response => {
                this.tabs = [];
                response.forEach(settingGroup => {
                    this.addTab(settingGroup);
                });
                if (this.tabs.length) {
                    this.tabs[0].active = true;
                }
            }, (errorMessage) => this.toast.createErrorToast(errorMessage));
    }
}
