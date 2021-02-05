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
import * as angular from 'angular';

import customPreferenceComponent from './components/customPreference/customPreference.component';
import groupTabComponent from './components/groupTab/groupTab.component';
import passwordTabComponent from './components/passwordTab/passwordTab.component';
import preferencesContainerComponent from './components/preferencesContainer/preferencesContainer.component';
import preferencesTabComponent from './components/preferencesTab/preferencesTab.component';
import profileTabComponent from './components/profileTab/profileTab.component';
import settingsPageComponent from './components/settingsPage/settingsPage.component';
import preferenceGroupComponent from './components/preferenceGroup/preferenceGroup.component';

/**
 * @ngdoc overview
 * @name settings
 *
 * @description
 * The `settings` module provides components that make up the Settings module in the Mobi application.
 */
angular.module('settings', [])
    .component('customPreference', customPreferenceComponent)
    .component('groupTab', groupTabComponent)
    .component('passwordTab', passwordTabComponent)
    .component('preferencesContainer', preferencesContainerComponent)
    .component('preferencesTab', preferencesTabComponent)
    .component('preferenceGroup', preferenceGroupComponent)
    .component('profileTab', profileTabComponent)
    .component('settingsPage', settingsPageComponent);
