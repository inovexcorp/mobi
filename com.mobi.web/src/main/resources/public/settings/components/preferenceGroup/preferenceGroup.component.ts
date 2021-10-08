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
import { Input, Component, OnChanges, Inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { forEach, has } from 'lodash';

import { PreferenceUtils } from '../../classes/preferenceUtils.class';
import { Preference } from '../../interfaces/preference.interface';
import { SimplePreference } from '../../classes/simplePreference.class';

/**
 * @ngdoc component
 * @name settings.component:preferenceGroup
 * @requires shared.service:settingManagerService
 * @requires shared.service.utilService
 * @requires shared.service.prefixes
 *
 * @description
 * `preferenceGroup` is a component that consisting of a series of {@link settings.component:preferenceForm preferenceForm}.
 */
@Component({
    selector: 'preference-group',
    templateUrl: './preferenceGroup.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PreferenceGroupComponent implements OnChanges {
    @Input() group;

    errorMessage = '';
    preferences = {};
    preferenceIRIs = [];

    constructor(@Inject('settingManagerService') private sm, @Inject('utilService') private util, @Inject('prefixes') private prefixes, private ref: ChangeDetectorRef) {}

    ngOnChanges(): void {
        this.retrievePreferences();
    }

    retrievePreferences(): void {
        this.sm.getUserPreferences()
            .then(response => {
                this.errorMessage = '';
                const userPreferences = response.data;
                this.sm.getPreferenceDefinitions(this.group)
                    .then(response => {
                        this.preferences = {};
                        const shapeDefinitions = {};
                        const preferencesJson = {};
                        forEach(response.data, shape => {
                            shapeDefinitions[shape['@id']] = shape;
                            if (this.isTopLevelNodeShape(shape)) {
                                preferencesJson[shape['@id']] = shape;
                            }
                        });
                        forEach(preferencesJson, (preferenceJson:any, preferenceType: string) => {
                            let preference: Preference;
                            if (PreferenceUtils.isSimplePreference(preferenceJson, shapeDefinitions)) {
                                preference = new SimplePreference(preferenceJson, shapeDefinitions, this.util, this.prefixes);
                                preference.populate(userPreferences[preferenceType]);
                                this.preferences[preferenceType] = preference;
                            } else {
                                this.util.createErrorToast('Complex Preferences are not yet supported.');
                            }
                        });
                        this.preferenceIRIs = Object.keys(this.preferences);
                        this.ref.markForCheck();
                    }, error => this.errorMessage = error);
            }, error => this.errorMessage = error);
    }

    updateUserPreference(preference: Preference): void {
        if (preference.exists()) {
            this.sm.updateUserPreference(preference.topLevelPreferenceNodeshapeInstanceId, preference.type, preference.asJsonLD())
                .then(() => {
                    this.errorMessage = '';
                    this.retrievePreferences();
                }, error => this.errorMessage = error);
        } else {
            this.sm.createUserPreference(preference.type, preference.asJsonLD())
                .then(() => {
                    this.errorMessage = '';
                    this.retrievePreferences();
                }, error => this.errorMessage = error);
        }
    }

    isTopLevelNodeShape(shape): boolean {
        return has(shape, this.prefixes.setting + 'inGroup');
    }
}