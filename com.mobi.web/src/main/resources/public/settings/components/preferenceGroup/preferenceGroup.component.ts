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
import { forEach, filter, remove, sortBy } from 'lodash';

import { Input, Component, OnChanges, Inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { v4 as uuid } from 'uuid';
import { PreferenceUtils } from '../../classes/preferenceUtils.class'
import preferenceManagerService from '../../../shared/services/preferenceManager.service';
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
 * @name settings.component:preferencesTab
 * @requires shared.service:settingsManagerService
 *
 * @description
 * `preferencesTab` is a component that creates a Bootstrap `row` with a {@link shared.component:block block} containing
 * a form allowing the current user to change their display preferences. The preferences are displayed using a
 * {@link settings.component:preferencesContainer preferencesContainer} and several
 * {@link settings.component:customPreference customPreference}.
 */
export class PreferenceGroupComponent implements OnChanges {

    @Input() group;
    errorMessage = '';
    preferences = {};
    preferenceDefinitions = {};
    userPreferences = {};

    constructor(@Inject('preferenceManagerService') private pm,
    @Inject('utilService') private util, private ref: ChangeDetectorRef) {}

    ngOnChanges(): void {
        this.retrievePreferences();
    }

    retrievePreferences() {
        this.pm.getUserPreferences()
            .then(response => {
                this.errorMessage = '';
                this.userPreferences = response.data;
                this.pm.getPreferenceDefinitions(this.group)
                    .then(response => {
                        this.preferences = {};
                        this.preferenceDefinitions = {};
                        this.errorMessage = '';
                        const preferencesJson = {};
                        forEach(response.data, shape => {
                            this.preferenceDefinitions[shape['@id']] = shape; // Maybe this means I should return a json object instead of array
                            if (this.isTopLevelNodeShape(shape)) {
                                // verify that it has only one value for sh:property, otherwise show error toast
                                // Create a new key in the combined object that holds all of the preference definitions+values
                                preferencesJson[shape['@id']] = shape;
                                // this.preferences[result['@id']] = new Preference(shape);
                                preferencesJson[shape['@id']].values = [];
                                // I shouldn't need to set values equal to empty array as that is done in the Preference class initialization
                            }
                        });
                        forEach(preferencesJson, (preferenceJson:any, preferenceType) => {
                            let preference: Preference;
                            if (PreferenceUtils.isSimplePreference(preferenceJson, this.preferenceDefinitions)) {
                                preference = new SimplePreference(preferenceJson, this.preferenceDefinitions);
                            } else {
                                preference = new ComplexPreference(preferenceJson, this.preferenceDefinitions);
                            }

                            // Can probably move into a preference.populate(userPreference)
                            preference.values = filter(this.userPreferences[preferenceType], preference.formFieldStrings[0]).sort((a, b) => {
                                if (a[preference.formFieldStrings[0]][0]['@value'] < b[preference.formFieldStrings[0]][0]['@value']) {
                                    return -1;
                                } else if (a[preference.formFieldStrings[0]][0]['@value'] > b[preference.formFieldStrings[0]][0]['@value']) {
                                    return 1;
                                } else {
                                    return 0;
                                }
                            });

                            if (!preference.values.length) {
                                preference.addBlankForm();
                            }

                            // Find Node that corresponds to the top level instance of nodeshape of the given user preference 
                            const topLevelPreferenceNodeshapeInstance = filter(this.userPreferences[preferenceType], result => {
                                return result['@type'].includes('http://mobi.com/ontologies/preference#Preference');
                            });

                            if (topLevelPreferenceNodeshapeInstance.length) {
                                // Change to preferenceInstanceResourceId
                                preference.topLevelPreferenceNodeshapeInstanceId = topLevelPreferenceNodeshapeInstance[0]['@id']; 
                                // Change to topLevelPreferenceNodeshape
                                // This should be able to be removed since I believe we already got this value above. Will have to test before removing though.
                                preference.topLevelPreferenceNodeshapeInstance = filter(this.userPreferences[preferenceType], result => {
                                    return result['@id'] === preference.topLevelPreferenceNodeshapeInstanceId;
                                });
                            }
                            this.preferences[preferenceType] = preference;
                        });
                        
                        this.ref.markForCheck();
                    }, error => this.errorMessage = error);
            }, error => this.errorMessage = error);
    }

    updateUserPreference(data): void {
        const preference: Preference = data.preference;
        if (preference.exists()) {
            this.pm.updateUserPreference(preference.topLevelPreferenceNodeshapeInstanceId, preference.type, preference.asJsonLD())
                .then(() => {
                    this.retrievePreferences();
                }, error => this.errorMessage = error);
        } else {
            this.pm.createUserPreference(preference.type, preference.asJsonLD())
                .then(() => {
                    this.retrievePreferences();
                }, error => this.errorMessage = error);
        }
    }

    isTopLevelNodeShape(shape):boolean {
        return Object.prototype.hasOwnProperty.call(shape, 'http://mobi.com/ontologies/preference#inGroup');
    }
}