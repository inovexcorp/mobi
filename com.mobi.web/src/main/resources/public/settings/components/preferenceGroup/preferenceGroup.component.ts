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
import { forEach, filter, remove } from 'lodash';

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
                this.util.createSuccessToast('User Preferences retrieved successfully');
                this.userPreferences = response.data;
                this.pm.getPreferenceDefinitions(this.group)
                    .then(response => {
                        this.preferences = {};
                        this.preferenceDefinitions = {};
                        this.errorMessage = '';
                        const preferencesJson = {};
                        this.util.createSuccessToast('Preference Definition retrieved successfully');
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
                            preference.Values = filter(this.userPreferences[preferenceType], preference.FormFieldStrings[0]);

                            if (!preference.Values.length) {
                                preference.addBlankForm();
                            }

                            // Find Node that corresponds to the top level instance of nodeshape of the given user preference 
                            const topLevelPreferenceNodeshapeInstance = filter(this.userPreferences[preferenceType], result => {
                                return result['@type'].includes('http://mobi.com/ontologies/preference#Preference');
                            });

                            if (topLevelPreferenceNodeshapeInstance.length) {
                                // Change to preferenceInstanceResourceId
                                preference.TopLevelPreferenceNodeshapeInstanceId = topLevelPreferenceNodeshapeInstance[0]['@id']; 
                                // Change to topLevelPreferenceNodeshape
                                // This should be able to be removed since I believe we already got this value above. Will have to test before removing though.
                                preference.TopLevelPreferenceNodeshapeInstance = filter(this.userPreferences[preferenceType], result => {
                                    return result['@id'] === preference.TopLevelPreferenceNodeshapeInstanceId;
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
            this.pm.updateUserPreference(preference.TopLevelPreferenceNodeshapeInstanceId, preference.type, preference.asJsonLD())
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

    // addObjectValueToObject(newObjValId, obj) {
    //     if (!obj['http://mobi.com/ontologies/preference#hasObjectValue']) {
    //         obj['http://mobi.com/ontologies/preference#hasObjectValue'] = [];
    //     }
    //     obj['http://mobi.com/ontologies/preference#hasObjectValue'].push({
    //         '@id': newObjValId
    //     });
    // }

    // Basically just adds an id and types to an object, thus making it legal jsonLD
    // convertToJsonLd(object, intendedTypes) {
    //     if (Object.prototype.hasOwnProperty.call(object, '@id') || Object.prototype.hasOwnProperty.call(object, '@type')) {
    //         console.log('Object has unexpected structure. It appears that the object already has an id or type');
    //     } else {
    //         object['@id'] = 'http://mobi.com/preference#' + uuid.v4(); // is it ok that we always give targetClass instance a prefix of preference?
    //         object['@type'] = ['http://www.w3.org/2002/07/owl#Thing'];
    //         intendedTypes.forEach(intendedType => object['@type'].push(intendedType));
    //     }
    // }

    // buildUserPreferenceJson(preference, type) {
    //     const userPreferenceJson = [];
    //     const newPreference = {
    //         '@id': 'http://mobi.com/preference#' + uuid.v4(),
    //         '@type': [
    //             type,
    //             'http://mobi.com/ontologies/preference#Preference',
    //             'http://www.w3.org/2002/07/owl#Thing',
    //             'http://mobi.com/ontologies/preference#Setting'
    //         ]
    //     };
    //     if (preference.TargetClass) {
    //         preference.Values.map(val => {
    //             if (!PreferenceUtils.isJsonLd(val)) {
    //                 this.convertToJsonLd(val, [preference.TargetClass]);
    //             }
    //             this.addObjectValueToObject(val['@id'], newPreference);
    //         });
    //         userPreferenceJson.push(...preference.Values);
    //         // NOT FINISHED YET!!!
    //     } else {
    //         PreferenceUtils.convertToJsonLd(preference.Values, preference.type);
    //         const dataValues = angular.copy(preference.Values[0]['http://mobi.com/ontologies/preference#hasDataValue'][0]);
    //         dataValues['@type'] = preference.FormFields[0]['http://www.w3.org/ns/shacl#datatype'][0]['@id'];
    //         newPreference['http://mobi.com/ontologies/preference#hasDataValue'] = [dataValues];
    //     }
    //     userPreferenceJson.push(newPreference);
    //     return userPreferenceJson;
    // }
}