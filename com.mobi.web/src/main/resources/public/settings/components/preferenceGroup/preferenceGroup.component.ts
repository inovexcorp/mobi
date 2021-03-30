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
import { forEach, filter } from 'lodash';

import { Input, Component, OnChanges, Inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { PreferenceUtils } from '../../classes/preferenceUtils.class'
import { Preference } from '../../interfaces/preference.interface';
import { SimplePreference } from '../../classes/simplePreference.class';
import { ComplexPreference } from '../../classes/complexPreference.class';

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

    constructor(@Inject('preferenceManagerService') private pm, private ref: ChangeDetectorRef) {}

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
                            } else {
                                preference = new ComplexPreference(preferenceJson, shapeDefinitions);
                            }

                            preference.values = filter(userPreferences[preferenceType], preference.formFieldProperties[0]).sort(this.userPrefComparator(preference));

                            if (!preference.values.length) {
                                preference.addBlankValue();
                            }

                            // Find Node that corresponds to the top level instance of nodeshape of the given user preference 
                            preference.topLevelPreferenceNodeshapeInstance = filter(userPreferences[preferenceType], entity => {
                                return entity['@type'].includes('http://mobi.com/ontologies/preference#Preference');
                            });

                            if (preference.topLevelPreferenceNodeshapeInstance.length) {
                                preference.topLevelPreferenceNodeshapeInstanceId = preference.topLevelPreferenceNodeshapeInstance[0]['@id']; 
                            }
                            this.preferences[preferenceType] = preference;
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

    userPrefComparator(preference: Preference) {
        return function(a, b) {
            if (a[preference.formFieldProperties[0]][0]['@value'] < b[preference.formFieldProperties[0]][0]['@value']) {
                return -1;
            } else if (a[preference.formFieldProperties[0]][0]['@value'] > b[preference.formFieldProperties[0]][0]['@value']) {
                return 1;
            } else {
                return 0;
            }
        }
    }
}