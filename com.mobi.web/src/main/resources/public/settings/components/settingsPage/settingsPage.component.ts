/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2023 iNovex Information Systems, Inc.
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
import { Component, ViewChild } from '@angular/core';
import { MatTabChangeEvent } from '@angular/material/tabs';

import { SettingManagerService } from '../../../shared/services/settingManager.service';
import { PasswordTabComponent } from '../passwordTab/passwordTab.component';
import { ProfileTabComponent } from '../profileTab/profileTab.component';

import './settingsPage.component.scss';

/**
 * @class settings.SettingsPageComponent
 *
 * A component which creates a `mat-tab-group` with tabs for different settings pertaining to the
 * current user. The tabs are {@link settings.ProfileTabComponent profileTab},
 * {@link settings.PasswordTabComponent passwordTab}, and the {@link shared.SettingEditPageComponent settingEditPage}.
 */
@Component({
    selector: 'settings-page',
    templateUrl: './settingsPage.component.html'
})
export class SettingsPageComponent {
    @ViewChild(ProfileTabComponent) profileTab: ProfileTabComponent;
    @ViewChild(PasswordTabComponent) passwordTab: PasswordTabComponent;

    constructor(public sm: SettingManagerService) {}

    onTabChanged(event: MatTabChangeEvent): void {
        if (event.index === 0) {
            this.profileTab.reset();
        } else if (event.index === 2) {
            this.passwordTab.reset();
        }
    }
}
