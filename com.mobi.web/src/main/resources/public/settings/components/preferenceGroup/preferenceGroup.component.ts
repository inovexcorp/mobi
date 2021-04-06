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
import { forEach } from 'lodash';

import { Input, Component, OnChanges, Inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { PreferenceUtils } from '../../classes/preferenceUtils.class'
import { Preference } from '../../interfaces/preference.interface';
import { SimplePreference } from '../../classes/simplePreference.class';

@Component({
    selector: 'preference-group',
    templateUrl: './preferenceGroup.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})

/**
 * @ngdoc component
 * @name settings.component:preferenceGroup
 * @requires shared.service:preferenceManagerService
 *
 * @description
 * `preferenceGroup` is a component that consisting of a series of {@link settings.component:preferenceForm preferenceForm}.
 */
export class PreferenceGroupComponent implements OnChanges {
    @Input() group;

    errorMessage = '';
    preferences = {};

    constructor(@Inject('preferenceManagerService') private pm, @Inject('preferenceManagerService') private util, private ref: ChangeDetectorRef) {}

    ngOnChanges(): void {
        this.retrievePreferences();
    }

    retrievePreferences(): void {
        this.pm.getUserPreferences()
            .then(response => {
                this.errorMessage = '';
                const userPreferences = response.data;
                this.pm.getPreferenceDefinitions(this.group)
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
                                preference = new SimplePreference(preferenceJson, shapeDefinitions);
                                preference.populate(userPreferences[preferenceType]);
                                this.preferences[preferenceType] = preference;
                            } else {
                                preference = this.util.createErrorToast('Complex Preferences are not yet supported.');
                            }
                        });
                        this.ref.markForCheck();
                    }, error => this.errorMessage = error);
            }, error => this.errorMessage = error);
    }

    updateUserPreference(preference: Preference): void {
        if (preference.exists()) {
            this.pm.updateUserPreference(preference.topLevelPreferenceNodeshapeInstanceId, preference.type, preference.asJsonLD())
                .then(() => {
                    this.errorMessage = '';
                    this.retrievePreferences();
                }, error => this.errorMessage = error);
        } else {
            this.pm.createUserPreference(preference.type, preference.asJsonLD())
                .then(() => {
                    this.errorMessage = '';
                    this.retrievePreferences();
                }, error => this.errorMessage = error);
        }
    }

    isTopLevelNodeShape(shape): boolean {
        return Object.prototype.hasOwnProperty.call(shape, 'http://mobi.com/ontologies/preference#inGroup');
    }
}