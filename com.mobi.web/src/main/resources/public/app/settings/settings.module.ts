/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2024 iNovex Information Systems, Inc.
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
import { NgModule } from '@angular/core';

import { SharedModule } from '../shared/shared.module';

import { GroupTabComponent } from './components/groupTab/groupTab.component';
import { PasswordTabComponent } from './components/passwordTab/passwordTab.component';
import { ProfileTabComponent } from './components/profileTab/profileTab.component';
import { SettingsPageComponent } from './components/settingsPage/settingsPage.component';

/**
 * @namespace settings
 *
 * The `settings` module provides components that make up the Settings module in the Mobi application.
 */
@NgModule({
    imports: [
        SharedModule
    ],
    declarations: [
        SettingsPageComponent,
        ProfileTabComponent,
        GroupTabComponent,
        PasswordTabComponent
    ],
    exports: [
    ]
})
export class SettingsModule {}
