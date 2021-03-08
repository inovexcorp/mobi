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
import preferenceManagerService from '../../../shared/services/preferenceManager.service';

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
        this.pm.getUserPreferences()
            .then(response => {
                this.errorMessage = '';
                this.util.createSuccessToast('User Preferences retrieved successfully');
                this.userPreferences = response.data;
                this.pm.getPreferenceDefinitions(this.group)
                    .then(response => {
                        this.errorMessage = '';
                        this.util.createSuccessToast('Preference Definition retrieved successfully');
                        forEach(response.data, result => {
                            this.preferenceDefinitions[result['@id']] = result; // Maybe this means I should return a json object instead of array
                            if (result['http://mobi.com/ontologies/preference#inGroup']) {
                                // verify that it has only one value for sh:property, otherwise show error toast
                                this.preferences[result['@id']] = result;
                                this.preferences[result['@id']].values = [];
                            }
                        });
                        forEach(this.preferences, (preference:unknown) => {
                            const requiredPropertyShape = this.preferenceDefinitions[preference['http://www.w3.org/ns/shacl#property'][0]['@id']];
                            if (requiredPropertyShape['http://www.w3.org/ns/shacl#node']) {
                                const attachedNode:unknown = this.preferenceDefinitions[requiredPropertyShape['http://www.w3.org/ns/shacl#node'][0]['@id']];
                                preference['targetClass'] = attachedNode['http://www.w3.org/ns/shacl#targetClass'][0]['@id'];
                                const finalObjects = attachedNode['http://www.w3.org/ns/shacl#property'].map(finalProperty => {
                                    return this.preferenceDefinitions[finalProperty['@id']];
                                });
                                preference['formFields'] = finalObjects;
                            } else {
                                preference['formFields'] = [requiredPropertyShape];
                            }
                        });
                        forEach(this.preferences, (prefDef:unknown, prefDefType) => {
                            const formFields = [];
                            forEach(prefDef['formFields'], formField => {
                                formFields.push(formField['http://www.w3.org/ns/shacl#path'][0]['@id']);
                            });
                            prefDef['formFieldStrings'] = formFields;
                            prefDef['values'] = filter(this.userPreferences[prefDefType], formFields[0]); // This will return only those subjects that have one of the "end property shape fields". Should I check that it has all fields?

                            /////////////////////////////////////
                            this.addBlankForm(prefDef, formFields);
                            
                            /////////////////////////////////////


                            const userPrefOfType = filter(this.userPreferences[prefDefType], result => {
                                return result['@type'].includes('http://mobi.com/ontologies/preference#Preference');
                            });

                            if (userPrefOfType.length) {
                                prefDef['hasId'] = userPrefOfType[0]['@id']; 
                                prefDef['preferenceRdf'] = filter(this.userPreferences[prefDefType], result => {
                                    return result['@id'] === prefDef['hasId'];
                                });
                            }
                        });
                        this.ref.markForCheck();
                    }, error => this.errorMessage = error);
            }, error => this.errorMessage = error);
    }

    updateUserPreference(data): void {
        const preference = data.preference;
        const type = data.type;
        this.stripBlankValues(preference, preference.formFieldStrings);
        if (preference['hasId']) {
            let requestBody = [];

            // if simple preference

            if (!preference.targetClass) {
                // const m = [];
                // preference.values.map(val => {
                //     m.push(val['http://mobi.com/ontologies/preference#hasDataValue'][0]);
                // });
                // preference.values[0]['http://mobi.com/ontologies/preference#hasDataValue'] = m;
                requestBody = preference.values;
            } else {
                preference.values.map(val => {
                    if (!Object.prototype.hasOwnProperty.call(val, '@id')) {
                        this.convertToJsonLd(val, [preference['targetClass']]);
                    }
                    this.addObjectValueToObject(val['@id'], preference.preferenceRdf[0]); // This might break stuff!!!
                });
                requestBody.push(...preference.preferenceRdf, ...preference.values);
            }

            this.pm.updateUserPreference(preference['hasId'], type, requestBody)
                .then(() => {
                    this.errorMessage = '';
                    this.util.createSuccessToast('User Preference updated successfully');
                    this.pm.getUserPreferences()  // INSTEAD OF THIS RETURN BODY FROM PUT ENDPOINT
                        .then(response => {
                            this.errorMessage = '';
                            this.util.createSuccessToast('User Preferences retrieved successfully');
                            this.userPreferences = response.data;
                        }, error => this.errorMessage = error);
                }, error => this.errorMessage = error);
        } else {
            const userPreference = this.buildUserPreferenceJson(preference, type);
            this.pm.createUserPreference(type, userPreference)
                .then(() => {
                    this.errorMessage = '';
                    this.util.createSuccessToast('User Preference created successfully');
                    this.pm.getUserPreferences()
                        .then(response => {
                            this.errorMessage = '';
                            this.util.createSuccessToast('User Preferences retrieved successfully');
                            this.userPreferences = response.data;
                        }, error => this.errorMessage = error);
                }, error => this.errorMessage = error);
        }
    }

    addBlankForm(pref, formFields) {
        if (!this.blankFormExists(pref, formFields)) {
            if (!pref['targetClass']) {
                this.addValueToSimplePreference(pref, '');
            } else {
                this.addBlankFormToComplexPreference(pref, formFields);
            }
        }
    }

    blankFormExists(pref, formFields) {
        if (pref['targetClass']) {
            for (let i = 0; i < pref['values'].length; i++) {
                let populatedFieldExists = false;
                formFields.forEach(field => {
                    if (pref['values'][i][field][0]['@value']) {
                        populatedFieldExists = true;
                    }
                });
                if (!populatedFieldExists) {
                    return true;
                }
            }
            return false;
        } else {
            if (!pref['values'].length) {
                return false;
            }
            let blankValExists = false;
            pref['values'][0]['http://mobi.com/ontologies/preference#hasDataValue'].forEach(val => {
                if (!val['@value']) {
                    blankValExists = true;
                }
            });
            return blankValExists;
        }
    }

    stripBlankValues(pref, formFields) {
        if (pref['targetClass']) {
            for (let i = pref['values'].length - 1; i >= 0; i--) {
                let populatedFieldExists = false;
                formFields.forEach(field => {
                    if (pref['values'][i][field][0]['@value']) {
                        populatedFieldExists = true;
                    }
                });
                if (!populatedFieldExists) {
                    this.removeObjectValueFromObject(pref['values'][i]['@id'], pref['preferenceRdf'][0]);
                    pref['values'].splice(i, 1);
                }
            }
        } else {
            if (!pref['values'].length) {
                return;
            }
            for (let i = pref['values'][0]['http://mobi.com/ontologies/preference#hasDataValue'].length - 1; i >= 0; i--) {
                if (!pref['values'][0]['http://mobi.com/ontologies/preference#hasDataValue'][i]['@value']) {
                    pref['values'][0]['http://mobi.com/ontologies/preference#hasDataValue'].splice(i, 1);
                }
            }
        }
    }

    addValueToSimplePreference(pref, val) {
        if (pref['values'].length) {
            pref['values'][0]['http://mobi.com/ontologies/preference#hasDataValue'].push({'@value': val});
        } else {
            pref['values'] = [
                {
                    'http://mobi.com/ontologies/preference#hasDataValue': [{'@value': val}]
                }
            ];
        }
    }

    addBlankFormToComplexPreference(pref, formFields) {
        const valueObject = {};
        formFields.map(field => {
            const innerObj = {'@value': ''};
            valueObject[field] = [innerObj];
        });
        pref['values'].push(valueObject);
    }

    addObjectValueToObject(newObjValId, obj) {
        if (!obj['http://mobi.com/ontologies/preference#hasObjectValue']) {
            obj['http://mobi.com/ontologies/preference#hasObjectValue'] = [];
        }
        obj['http://mobi.com/ontologies/preference#hasObjectValue'].push({
            '@id': newObjValId
        });
    }

    removeObjectValueFromObject(objValIdToRemove, obj) {
        remove(obj['http://mobi.com/ontologies/preference#hasObjectValue'], { '@id': objValIdToRemove });
    }

    convertToJsonLd(object, intendedTypes) {
        if (Object.prototype.hasOwnProperty.call(object, '@id') || Object.prototype.hasOwnProperty.call(object, '@type')) {
            console.log('Object has unexpected structure. It appears that the object already has an id or type');
        } else {
            object['@id'] = 'http://mobi.com/preference#' + uuid.v4(); // is it ok that we always give targetClass instance a prefix of preference?
            object['@type'] = ['http://www.w3.org/2002/07/owl#Thing'];
            intendedTypes.forEach(intendedType => object['@type'].push(intendedType));
        }
    }

    buildUserPreferenceJson(preference, type) {
        const userPreferenceJson = [];
        const newPreference = {
            '@id': 'http://mobi.com/preference#' + uuid.v4(),
            '@type': [
                type,
                'http://mobi.com/ontologies/preference#Preference',
                'http://www.w3.org/2002/07/owl#Thing'
            ]
        };
        if (preference.targetClass) {
            // newPreference['http://mobi.com/ontologies/preference#hasObjectValue'] = [
            //     {
            //         '@id': 'http://mobi.com/preference#' + uuid.v4()
            //     }
            // ];

            preference.values.map(val => {
                if (!Object.prototype.hasOwnProperty.call(val, '@id')) {
                    this.convertToJsonLd(val, [preference['targetClass']]);
                }
                this.addObjectValueToObject(val['@id'], newPreference);
            });
            userPreferenceJson.push(...preference.values);
            // NOT FINISHED YET!!!
        } else {
            // THIS NEEDS TO WORK FOR MULTIPLE DATA VALUES!!!! FIX!!
            const dataValues = angular.copy(preference.values[0]['http://mobi.com/ontologies/preference#hasDataValue'][0]);
            dataValues['@type'] = preference['formFields'][0]['http://www.w3.org/ns/shacl#datatype'][0]['@id'];
            newPreference['http://mobi.com/ontologies/preference#hasDataValue'] = [dataValues];
        }
        userPreferenceJson.push(newPreference);
        return userPreferenceJson;
    }
}