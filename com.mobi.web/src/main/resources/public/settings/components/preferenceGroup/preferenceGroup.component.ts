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
import { forEach, isEqual, filter } from 'lodash';

import utilService from '../../../shared/services/util.service';
import { UUID } from 'antlr4ts/misc/UUID';

const template = require('./preferenceGroup.component.html');

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
const preferenceGroupComponent = {
    template,
    bindings: {
        group: '<'
    },
    controllerAs: 'dvm',
    controller: preferenceGroupComponentCtrl
};

preferenceGroupComponentCtrl.$inject = ['utilService', 'preferenceManagerService', 'uuid'];

function preferenceGroupComponentCtrl(utilService, preferenceManagerService, uuid) {
    var dvm = this;
    var pm = preferenceManagerService;
    dvm.util = utilService;
    dvm.preferences = {};
    dvm.preferenceDefinitions = {};
    dvm.userPreferences = {};
    
    dvm.$onChanges = function() {
        pm.getUserPreferences()
            .then(response => {
                dvm.errorMessage = '';
                dvm.util.createSuccessToast('User Preferences retrieved successfully');
                dvm.userPreferences = response.data;
                pm.getPreferenceDefinitions(dvm.group)
                    .then(response => {
                        dvm.errorMessage = '';
                        dvm.util.createSuccessToast('Preference Definition retrieved successfully');
                        forEach(response.data, result => {
                            dvm.preferenceDefinitions[result['@id']] = result; // Maybe this means I should return a json object instead of array
                            if (result['http://mobi.com/ontologies/preference#inGroup']) {
                                // verify that it has only one value for sh:property, otherwise show error toast
                                dvm.preferences[result['@id']] = result;
                                dvm.preferences[result['@id']].values = [];
                            }
                        });
                        forEach(dvm.preferences, (preference, type) => {
                            var requiredPropertyShape = dvm.preferenceDefinitions[preference['http://www.w3.org/ns/shacl#property'][0]['@id']];
                            if (requiredPropertyShape['http://www.w3.org/ns/shacl#node']) {
                                var attachedNode = dvm.preferenceDefinitions[requiredPropertyShape['http://www.w3.org/ns/shacl#node'][0]['@id']];
                                preference['targetClass'] = attachedNode['http://www.w3.org/ns/shacl#targetClass'][0]['@id'];
                                var finalObjects = attachedNode['http://www.w3.org/ns/shacl#property'].map(finalProperty => {
                                    return dvm.preferenceDefinitions[finalProperty['@id']];
                                });
                                preference['formFields'] = finalObjects;
                            } else {
                                preference['formFields'] = [requiredPropertyShape];
                            }
                        });
                        forEach(dvm.preferences, (prefDef, prefDefType) => {
                            var formFields = [];
                            forEach(prefDef['formFields'], formField => {
                                formFields.push(formField['http://www.w3.org/ns/shacl#path'][0]['@id']);
                            });
                            prefDef['values'] = filter(dvm.userPreferences[prefDefType], formFields[0]); // This will return only those subjects that have one of the "end property shape fields". Should I check that it has all fields?
                            prefDef['hasId'] = filter(dvm.userPreferences[prefDefType], result => { 
                                return result['@type'].includes('http://mobi.com/ontologies/preference#Preference');
                            })[0]['@id'];
                        });
                    }, error => dvm.errorMessage = error);
            }, error => dvm.errorMessage = error);
    };
    
    dvm.updateUserPreference = function(type, preference) {
        if (preference['hasId']) {
            pm.updateUserPreference(preference['hasId'], type, dvm.userPreferences[type])
                .then(response => {
                    dvm.errorMessage = '';
                    dvm.util.createSuccessToast('User Preference updated successfully');
                    pm.getUserPreferences()
                        .then(response => {
                            dvm.errorMessage = '';
                            dvm.util.createSuccessToast('User Preferences retrieved successfully');
                            dvm.userPreferences = response.data;
                        }, error => dvm.errorMessage = error);
                }, error => dvm.errorMessage = error);
        } else {
            const userPreference = dvm.buildUserPreferenceJson(preference, type);
            pm.createUserPreference(type, userPreference)
                .then(response => {
                    dvm.errorMessage = '';
                    dvm.util.createSuccessToast('User Preference created successfully');
                    pm.getUserPreferences()
                        .then(response => {
                            dvm.errorMessage = '';
                            dvm.util.createSuccessToast('User Preferences retrieved successfully');
                            dvm.userPreferences = response.data;
                        }, error => dvm.errorMessage = error);
                }, error => dvm.errorMessage = error);
        }
    };

    dvm.buildUserPreferenceJson = function(preference, type) {
        let userPreferenceJson = [];
        let newPreference = {
            '@id': 'http://mobi.com/preference#' + uuid.v4(),
            '@type': [
                type,
                'http://mobi.com/ontologies/preference#Preference',
                'http://www.w3.org/2002/07/owl#Thing'
            ]
        };
        if (preference.targetClass) {
            newPreference['http://mobi.com/ontologies/preference#hasObjectValue'] = [
                {
                    '@id': 'http://mobi.com/preference#' + uuid.v4()
                }
            ];
            let objectValues = preference.values;
            // NOT FINISHED YET!!!
        } else {
            // THIS NEEDS TO WORK FOR MULTIPLE DATA VALUES!!!! FIX!!
            const dataValues = angular.copy(preference.values[0]['http://mobi.com/ontologies/preference#hasDataValue'][0]);
            dataValues['@type'] = preference['formFields'][0]['http://www.w3.org/ns/shacl#datatype'][0]['@id'];
            newPreference['http://mobi.com/ontologies/preference#hasDataValue'] = [dataValues];
        }
        userPreferenceJson.push(newPreference);
        return userPreferenceJson;
    };
}

export default preferenceGroupComponent;