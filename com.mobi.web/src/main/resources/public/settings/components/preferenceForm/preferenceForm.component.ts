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
import { forEach, isEqual, filter } from 'lodash';

import utilService from '../../../shared/services/util.service';

const template = require('./preferenceForm.component.html');

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
const preferenceFormComponent = {
    template,
    bindings: {
        fields: '<',
        values: '<'
    },
    controllerAs: 'dvm',
    controller: preferenceFormComponentCtrl
};

preferenceFormComponentCtrl.$inject = ['utilService', 'preferenceManagerService', 'settingsManagerService'];

function preferenceFormComponentCtrl(utilService, preferenceManagerService, settingsManagerService) {
    var dvm = this;
    var pm = preferenceManagerService;
    dvm.util = utilService;
    dvm.preferences = {};
    dvm.preferenceDefinitions = {};
    
    dvm.$onChanges = function() {
        
        pm.getPreferenceDefinitions(dvm.group)
            .then(response => {
                dvm.errorMessage = '';
                dvm.util.createSuccessToast('Preference Definition retrieved successfully');
                forEach(response.data, result => {
                    dvm.preferenceDefinitions[result['@id']] = result; // Maybe this means I should return a json object instead of array
                    if (result['http://mobi.com/ontologies/preference#inGroup']) {
                        // verify that it has only one value for sh:property, otherwise show error toast
                        dvm.preferences[result['@id']] = result;
                    }
                });
                forEach(dvm.preferences, (preference, type) => {
                    var requiredPropertyShape = dvm.preferenceDefinitions[preference['http://www.w3.org/ns/shacl#property'][0]['@id']];
                    if (requiredPropertyShape['http://www.w3.org/ns/shacl#node']) {
                        var attachedNode = dvm.preferenceDefinitions[requiredPropertyShape['http://www.w3.org/ns/shacl#node'][0]['@id']];
                        var finalObjects = attachedNode['http://www.w3.org/ns/shacl#property'].map(finalProperty => {
                            return dvm.preferenceDefinitions[finalProperty['@id']];
                        });
                        preference['formFields'] = finalObjects;
                    }
                });
                forEach(dvm.preferences, (prefDef, prefDefType) => {
                    var formFields = [];
                    forEach(prefDef['formFields'], formField => {
                        formFields.push(formField['http://www.w3.org/ns/shacl#path'][0]['@id']);
                    });
                    prefDef['values'] = filter(dvm.userPreferences[prefDefType], formFields[0]);
            }, error => dvm.errorMessage = error);
    };
}

export default preferenceFormComponent;