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

                            // // preference.RequiredPropertyShape = this.preferenceDefinitions[preference.RequiredPropertyShapeId];
                            // if (requiredPropertyShape['http://www.w3.org/ns/shacl#node']) {
                            //     const attachedNode:unknown = this.preferenceDefinitions[requiredPropertyShape['http://www.w3.org/ns/shacl#node'][0]['@id']];
                            //     preference['targetClass'] = attachedNode['http://www.w3.org/ns/shacl#targetClass'][0]['@id'];
                            //     // preference.TargetClass = attachedNode['http://www.w3.org/ns/shacl#targetClass'][0]['@id'];
                            //     const finalObjects = attachedNode['http://www.w3.org/ns/shacl#property'].map(finalProperty => {
                            //         return this.preferenceDefinitions[finalProperty['@id']];
                            //     });
                            //     preference['formFields'] = finalObjects;
                            // } else {
                            //     preference['formFields'] = [requiredPropertyShape];
                            //     // preference.setFormFields([requiredFormFields]);
                            // }
                            // const formFields = [];
                            // forEach(preference['formFields'], formField => {
                            //     formFields.push(formField['http://www.w3.org/ns/shacl#path'][0]['@id']);
                            // });
                            // preference['formFieldStrings'] = formFields;
                            // I'll be able to remove the above code
                            // preference['values'] = filter(this.userPreferences[preferenceType], formFields[0]); // This will return only those subjects that have one of the "end property shape fields". Should I check that it has all fields?

                            /////////////////////////////////////
                            preference.addBlankForm();

                            // this.addBlankForm(preference);
                            
                            /////////////////////////////////////


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

                        // // I think this is basically just for complex preferences
                        // forEach(this.preferences, (preference:Preference) => {
                        //     const requiredPropertyShape = this.preferenceDefinitions[preference['http://www.w3.org/ns/shacl#property'][0]['@id']];
                        //     // const requiredPropertyShape = this.preferenceDefinitions[preference.mainPropertyShapeId]
                        //     if (requiredPropertyShape['http://www.w3.org/ns/shacl#node']) {
                        //         const attachedNode:unknown = this.preferenceDefinitions[requiredPropertyShape['http://www.w3.org/ns/shacl#node'][0]['@id']];
                        //         preference['targetClass'] = attachedNode['http://www.w3.org/ns/shacl#targetClass'][0]['@id'];
                        //         const finalObjects = attachedNode['http://www.w3.org/ns/shacl#property'].map(finalProperty => {
                        //             return this.preferenceDefinitions[finalProperty['@id']];
                        //         });
                        //         preference['formFields'] = finalObjects;
                        //     } else {
                        //         preference['formFields'] = [requiredPropertyShape];
                        //         // preference.setFormFields([requiredFormFields]);
                        //     }
                        // });


                        // forEach(this.preferences, (prefDef:Preference, prefDefType) => {
                        //     const formFields = [];
                        //     forEach(prefDef['formFields'], formField => {
                        //         formFields.push(formField['http://www.w3.org/ns/shacl#path'][0]['@id']);
                        //     });
                        //     prefDef['formFieldStrings'] = formFields;
                        //     // I'll be able to remove the above code
                        //     prefDef['values'] = filter(this.userPreferences[prefDefType], formFields[0]); // This will return only those subjects that have one of the "end property shape fields". Should I check that it has all fields?

                        //     /////////////////////////////////////
                        //     this.addBlankForm(prefDef, formFields);
                            
                        //     /////////////////////////////////////


                        //     const userPrefOfType = filter(this.userPreferences[prefDefType], result => {
                        //         return result['@type'].includes('http://mobi.com/ontologies/preference#Preference');
                        //     });

                        //     if (userPrefOfType.length) {
                        //         prefDef['hasId'] = userPrefOfType[0]['@id']; 
                        //         prefDef['preferenceRdf'] = filter(this.userPreferences[prefDefType], result => {
                        //             return result['@id'] === prefDef['hasId'];
                        //         });
                        //     }
                        // });
                        this.ref.markForCheck();
                    }, error => this.errorMessage = error);
            }, error => this.errorMessage = error);
    }

    updateUserPreference(data): void {
        const preference: Preference = data.preference;
        preference.stripBlankValues();
        if (preference.exists()) {
            // let requestBody = [];

            // if simple preference

            // if (!preference.targetClass) {
            //     // const m = [];
            //     // preference.values.map(val => {
            //     //     m.push(val['http://mobi.com/ontologies/preference#hasDataValue'][0]);
            //     // });
            //     // preference.values[0]['http://mobi.com/ontologies/preference#hasDataValue'] = m;
            //     requestBody = preference.values;
            // } else {
            //     preference.values.map(val => {
            //         if (!Object.prototype.hasOwnProperty.call(val, '@id')) {
            //             this.convertToJsonLd(val, [preference['targetClass']]);
            //         }
            //         this.addObjectValueToObject(val['@id'], preference.preferenceRdf[0]); // This might break stuff!!!
            //     });
            //     requestBody.push(...preference.preferenceRdf, ...preference.values);
            // }

            this.pm.updateUserPreference(preference.TopLevelPreferenceNodeshapeInstanceId, preference.type(), preference.asJsonLD())
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
            const userPreference = this.buildUserPreferenceJson(preference, preference.type());
            this.pm.createUserPreference(preference.type(), userPreference)
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

    isTopLevelNodeShape(shape):boolean {
        return Object.prototype.hasOwnProperty.call(shape, 'http://mobi.com/ontologies/preference#inGroup');
    }

    // addBlankForm(pref: Preference) {
    //     if (!this.blankFormExists(pref)) {
    //         if (pref instanceof SimplePreference) {
    //             this.addValueToSimplePreference(pref, '');
    //         } else {
    //             this.addBlankFormToComplexPreference(pref);
    //         }
    //     }
    // }

    // blankFormExists(pref: Preference): boolean {
    //     if (pref instanceof ComplexPreference) {
    //         for (let i = 0; i < pref.Values.length; i++) {
    //             let populatedFieldExists = false;
    //             pref.FormFieldStrings.forEach(field => {
    //                 if (pref.Values[i][field][0]['@value']) {
    //                     populatedFieldExists = true;
    //                 }
    //             });
    //             if (!populatedFieldExists) {
    //                 return true;
    //             }
    //         }
    //         return false;
    //     } else {
    //         if (!pref.Values.length) {
    //             return false;
    //         }
    //         let blankValExists = false;
    //         pref.Values[0]['http://mobi.com/ontologies/preference#hasDataValue'].forEach(val => {
    //             if (!val['@value']) {
    //                 blankValExists = true;
    //             }
    //         });
    //         return blankValExists;
    //     }
    // }

    // stripBlankValues(pref: Preference) {
    //     if (pref instanceof ComplexPreference) {
    //         for (let i = pref.Values.length - 1; i >= 0; i--) {
    //             let populatedFieldExists = false;
    //             pref.FormFieldStrings.forEach(field => {
    //                 if (pref.Values[i][field][0]['@value']) {
    //                     populatedFieldExists = true;
    //                 }
    //             });
    //             if (!populatedFieldExists) {
    //                 this.removeObjectValueFromObject(pref.Values[i]['@id'], pref['preferenceRdf'][0]); // NEED TO CHANGE TO WORK WITH INTERFACE
    //                 pref.Values.splice(i, 1);
    //             }
    //         }
    //     } else {
    //         if (!pref.Values.length) {
    //             return;
    //         }
    //         for (let i = pref.Values[0]['http://mobi.com/ontologies/preference#hasDataValue'].length - 1; i >= 0; i--) {
    //             if (!pref.Values[0]['http://mobi.com/ontologies/preference#hasDataValue'][i]['@value']) {
    //                 pref.Values[0]['http://mobi.com/ontologies/preference#hasDataValue'].splice(i, 1);
    //             }
    //         }
    //     }
    // }

    // addValueToSimplePreference(pref, val) {
    //     if (pref.Values.length) {
    //         pref.Values[0]['http://mobi.com/ontologies/preference#hasDataValue'].push({'@value': val});
    //     } else {
    //         pref.Values = [
    //             {
    //                 'http://mobi.com/ontologies/preference#hasDataValue': [{'@value': val}]
    //             }
    //         ];
    //     }
    // }

    // addBlankFormToComplexPreference(pref:Preference) {
    //     const valueObject = {};
    //     pref.FormFieldStrings.map(field => {
    //         const innerObj = {'@value': ''};
    //         valueObject[field] = [innerObj];
    //     });
    //     pref.Values.push(valueObject);
    // }

    addObjectValueToObject(newObjValId, obj) {
        if (!obj['http://mobi.com/ontologies/preference#hasObjectValue']) {
            obj['http://mobi.com/ontologies/preference#hasObjectValue'] = [];
        }
        obj['http://mobi.com/ontologies/preference#hasObjectValue'].push({
            '@id': newObjValId
        });
    }

    // removeObjectValueFromObject(objValIdToRemove, obj) {
    //     remove(obj['http://mobi.com/ontologies/preference#hasObjectValue'], { '@id': objValIdToRemove });
    // }

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