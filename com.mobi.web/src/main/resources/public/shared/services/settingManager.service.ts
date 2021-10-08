/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2021 iNovex Information Systems, Inc.
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

import { has } from 'lodash';
import { PreferenceConstants } from '../../settings/classes/preferenceConstants.class';

settingManagerService.$inject = ['$http', '$q', 'REST_PREFIX', 'prefixes', 'utilService', 'httpService'];

/**
 * @ngdoc service
 * @name shared.service:settingManagerService
 * @requires $http
 * @requires $q
 * @requires shared.service:utilService
 * @requires shared.service:httpService
 *
 * @description
 * `settingManagerService` is a service that provides access to the Mobi Settings REST endpoints and variables
 * to hold information about the different types of settings.
 */
function settingManagerService($http, $q, REST_PREFIX, prefixes, utilService, httpService) {
    const self = this,
        util = utilService,
        prefix = `${REST_PREFIX}settings`,
        prefSettingType = `${prefixes.setting}Preference`,
        appSettingType = `${prefixes.setting}ApplicationSetting`;

    self.defaultNamespace = '';

    /**
     * @ngdoc method
     * @name initialize
     * @methodOf shared.service:ontologyStateService
     *
     * @description
     * Initializes the `catalogId` variable.
     */
    self.initialize = function() {
        return this.getDefaultNamespace()
            .then(data => {
                self.defaultNamespace = data;
            }, error => Promise.reject(error));
    };

    self.getDefaultNamespace = function() {
        return this.getApplicationSettingByType('http://mobi.com/ontologies/namespace#DefaultOntologyNamespaceApplicationSetting').then(response => {
            const applicationSetting = response.data;
            if (applicationSetting.length > 1) {
                util.createErrorToast('Too many values present for application setting');
            } else if (applicationSetting.length === 1) {
                const defaultNamespace = applicationSetting[0];
                if (has(defaultNamespace, PreferenceConstants.HAS_DATA_VALUE)) {
                    return util.getPropertyValue(defaultNamespace, PreferenceConstants.HAS_DATA_VALUE);
                }
                return applicationSetting;
            } else {
                util.createErrorToast('No values found for application setting. For some reason, endpoint did not return error.');
            }
        }, () => {
            return this.getApplicationSettingDefinitions('http://mobi.com/ontologies/namespace#NamespaceApplicationSettingGroup').then(response => {
                const newArray = response.data.filter(function (el) {
                    return el['@id'] === 'http://mobi.com/ontologies/namespace#DefaultOntologyNamespaceApplicationSettingPropertyShape';
                });
                if (newArray.length !== 1) {
                    util.createErrorToast(`Number of matching property shapes must be one, not ${newArray.length}`);
                    return;
                }
                const defaultNamespacePropertyShape = newArray[0];
                if (has(defaultNamespacePropertyShape, `${prefixes.shacl}defaultValue`)) {
                    return util.getPropertyValue(defaultNamespacePropertyShape, `${prefixes.shacl}defaultValue`);
                } else {
                    util.createErrorToast('No default value found for default namespace');
                }
            }, () => {
                util.createErrorToast('Could not retrieve setting definitions');
            });
        });
    };

    /**
     * @ngdoc method
     * @name getUserPreferences
     * @methodOf shared.service:settingManagerService
     *
     * @description
     * Retrieve all user preferences for active user
     *
     * @param {string} [id=''] The identifier for this request
     * @return {Promise} A promise that either resolves with the response of the GET settings endpoint or is
     * rejected with an error message
     */
    self.getUserPreferences = function(id = '') {
        return self.getSettings(prefSettingType, id);
    };

    /**
     * @ngdoc method
     * @name getApplicationSettings
     * @methodOf shared.service:settingManagerService
     *
     * @description
     * Retrieve all application settings in the system
     *
     * @param {string} [id=''] The identifier for this request
     * @return {Promise} A promise that either resolves with the response of the GET settings endpoint or is
     * rejected with an error message
     */
    self.getApplicationSettings = function(id = '') {
        return self.getSettings(appSettingType, id);
    };

    /**
     * @ngdoc method
     * @name getSettings
     * @methodOf shared.service:settingManagerService
     *
     * @description
     * Makes a call to GET /mobirest/settings to get a JSON object of all settings and
     * referenced entities of the passed in setting type. The return object will have a
     * key for each setting subType that has been previously created and values that are
     * a json-ld representation of the instance of Setting and referenced entities that
     * they have previously created for that type.
     * 
     * @param {string} type The setting type to get settings for
     * @param {string} [id=''] The identifier for this request
     * @return {Promise} A promise that either resolves with the response of the endpoint or is rejected with an
     * error message
     */
    self.getSettings = function(type, id = '') {
        const config = {
            params: {
                type
            }
        };
        const promise = id ? httpService.get(prefix, config, id) : $http.get(prefix, config);
        return promise.then($q.when, util.rejectError);
    };

    /**
     * @ngdoc method
     * @name getApplicationSettingByType
     * @methodOf shared.service:settingManagerService
     *
     * @description
     * Get the specific application setting in the repo for the given application setting type.
     *
     * @param {string} applicationSettingType The specific type of application setting to retrieve
     * @param {string} [id=''] The identifier for this request
     * @return {Promise} A promise that either resolves with the response of the endpoint or is rejected with an
     * error message
     */
    self.getApplicationSettingByType = function(applicationSettingType, id = '') {
        return self.getSettingByType(appSettingType, applicationSettingType, id);
    };

    /**
     * @ngdoc method
     * @name getUserPreferenceByType
     * @methodOf shared.service:settingManagerService
     *
     * @description
     * Get the specific application setting in the repo for the given user preference type.
     *
     * @param {string} preferenceType The specific type of user preference to retrieve
     * @param {string} [id=''] The identifier for this request
     * @return {Promise} A promise that either resolves with the response of the endpoint or is rejected with an
     * error message
     */
    self.getUserPreferenceByType = function(preferenceType, id = '') {
        return self.getSettingByType(prefSettingType, preferenceType, id);
    };

    /**
     * @ngdoc method
     * @name getSettingByType
     * @methodOf shared.service:settingManagerService
     *
     * @description
     * Makes a call to GET /mobirest/settings/types/{settingSubType} to get a JSON array consisting of the json-ld 
     * representation of the current value of the setting for the given setting subType and setting type as well as
     * all referenced entities.
     *
     * @param {string} type The setting type to retrieve a setting for
     * @param {string} settingSubType The specific setting subType to retrieve
     * @param {string} [id=''] The identifier for this request
     * @return {Promise} A promise that either resolves with the response of the endpoint or is rejected with an
     * error message
     */
    self.getSettingByType = function(type, settingSubType, id = '') {
        const config = {
            params: {
                type
            }
        };
        const promise = id ? httpService.get(`${prefix}/types/${encodeURIComponent(settingSubType)}`, config, id) : $http.get(`${prefix}/types/${encodeURIComponent(settingSubType)}`, config);
        return promise.then($q.when, util.rejectError);
    };

    /**
     * @ngdoc method
     * @name updateUserPreference
     * @methodOf shared.service:settingManagerService
     *
     * @description
     * Updates the existing user preference identified by the preferenceId with the passed in user preference.
     *
     * @param {string} preferenceId The id of the user preference that will be updated 
     * @param {string} preferenceType The type of user preference being updated
     * @param {Object} userPreference The JSON-LD containing the new user preference values and referenced entities
     * @param {string} [id=''] The identifier for this request
     * @return {Promise} A promise that either resolves with the response of the endpoint or is rejected with an
     * error message
     */
    self.updateUserPreference = function(preferenceId, preferenceType, userPreference, id = '') {
        return self.updateSetting(prefSettingType, preferenceId, preferenceType, userPreference, id);
    };

    /**
     * @ngdoc method
     * @name updateApplicationSetting
     * @methodOf shared.service:settingManagerService
     *
     * @description
     * Updates the existing application setting identified by the applicationSettingId with the passed in
     * applicationSetting.
     *
     * @param {string} applicationSettingId The id of the application setting that will be updated 
     * @param {string} applicationSettingType The type of application setting being updated
     * @param {Object} applicationSetting The JSON-LD containing the new application setting values and referenced entities
     * @param {string} [id=''] The identifier for this request
     * @return {Promise} A promise that either resolves with the response of the endpoint or is rejected with an
     * error message
     */
    self.updateApplicationSetting = function(applicationSettingId, applicationSettingType, applicationSetting, id = '') {
        return self.updateSetting(appSettingType, applicationSettingId, applicationSettingType, applicationSetting, id);
    };

    /**
     * @ngdoc method
     * @name updateSetting
     * @methodOf shared.service:settingManagerService
     *
     * @description
     * Calls the PUT /mobirest/settings/{settingId} endpoint and updates the Setting with the passed in settingId
     * using the JSON-LD provided in the passed in object.
     *
     * @param {string} type The setting type of the setting to be updated
     * @param {string} settingId The id of the setting that will be updated 
     * @param {string} subType The specific subType of setting being updated
     * @param {Object} setting The JSON-LD containing the new setting values and referenced entities
     * @param {string} [id=''] The identifier for this request
     * @return {Promise} A promise that either resolves with the response of the endpoint or is rejected with an
     * error message
     */
    self.updateSetting = function(type, settingId, subType, setting, id = '') {
        const config = {
            params: {
                'subType': subType,
                'type': type
            }
        };
        const promise = id ? httpService.put(`${prefix}/${encodeURIComponent(settingId)}`, setting, config, id) 
            : $http.put(`${prefix}/${encodeURIComponent(settingId)}`, setting, config);
        return promise.then($q.when, util.rejectError);
    };

    /**
     * @ngdoc method
     * @name createUserPreference
     * @methodOf shared.service:settingManagerService
     *
     * @description
     * Creates a new user preference in the system using the passed in user preference.
     *
     * @param {string} preferenceType The type of user preference being created
     * @param {Object} userPreference The JSON-LD containing the new user preference values and referenced entities
     * @param {string} [id=''] The identifier for this request
     * @return {Promise} A promise that either resolves with the response of the endpoint or is rejected with an
     * error message
     */
    self.createUserPreference = function(preferenceType, userPreference, id = '') {
        return self.createSetting(prefSettingType, preferenceType, userPreference, id)
    };

    /**
     * @ngdoc method
     * @name createApplicationSetting
     * @methodOf shared.service:settingManagerService
     *
     * @description
     * Creates a new application setting in the system using the passed in application setting.
     *
     * @param {string} applicationSettingType The type of application setting being created
     * @param {Object} userPreference The JSON-LD containing the new application setting values and referenced entities
     * @param {string} [id=''] The identifier for this request
     * @return {Promise} A promise that either resolves with the response of the endpoint or is rejected with an
     * error message
     */
    self.createApplicationSetting = function(applicationSettingType, applicationSetting, id = '') {
        return self.createSetting(appSettingType, applicationSettingType, applicationSetting, id);
    };

    /**
     * @ngdoc method
     * @name createSetting
     * @methodOf shared.service:settingManagerService
     *
     * @description
     * Calls the POST /mobirest/settings endpoint and creates an instance of setting as well as it's referenced entities for of the type defined by the passed in subType using the JSON-LD provided in the passed in object.
     *
     * @param {string} type The setting type being updated
     * @param {string} subType The specific subType of setting being updated
     * @param {Object} setting The JSON-LD containing the new setting values and referenced entities
     * @param {string} [id=''] The identifier for this request
     * @return {Promise} A promise that either resolves with the response of the endpoint or is rejected with an
     * error message
     */
    self.createSetting = function(type, subType, setting, id = '') {
        const config = {
            params: {
                'subType': subType,
                'type': type
            }
        };
        const promise = id ? httpService.post(prefix, setting, config, id) 
            : $http.post(prefix, setting, config);
        return promise.then($q.when, util.rejectError);
    };

    /**
     * @ngdoc method
     * @name getSettingGroups
     * @methodOf shared.service:settingManagerService
     *
     * @description
     * Makes a call to GET /mobirest/settings/groups to get the JSON-LD representation of each
     * Setting Group currently defined in the repo that correspond to the passed in setting type.
     *
     * @param {string} [id=''] The identifier for this request
     * @return {Promise} A promise that either resolves with the response of the endpoint or is rejected with an
     * error message
     */
    self.getSettingGroups = function(type, id = '') {
        const config = {
            params: {
                'type': type
            }
        };
        const promise = id ? httpService.get(`${prefix}/groups`, config, id) : $http.get(`${prefix}/groups`, config);
        return promise.then($q.when, util.rejectError);
    };

    /**
     * @ngdoc method
     * @name getPreferenceGroups
     * @methodOf shared.service:settingManagerService
     *
     * @description
     * Retrieve all preference groups that exist in the system.
     *
     * @param {string} [id=''] The identifier for this request
     * @return {Promise} A promise that either resolves with the response of the endpoint or is rejected with an
     * error message
     */
    self.getPreferenceGroups = function(id = '') {
        return self.getSettingGroups(prefSettingType, id);
    };

    /**
     * @ngdoc method
     * @name getApplicationSettingGroups
     * @methodOf shared.service:settingManagerService
     *
     * @description
     * Retrieve all application setting groups that exist in the system.
     *
     * @param {string} [id=''] The identifier for this request
     * @return {Promise} A promise that either resolves with the response of the endpoint or is rejected with an
     * error message
     */
    self.getApplicationSettingGroups = function(id = '') {
        return self.getSettingGroups(appSettingType, id);
    };

    /**
     * @ngdoc method
     * @name getPreferenceDefinitions
     * @methodOf shared.service:settingManagerService
     *
     * @description
     * Retrieve all preference definitions that are part of the passed in preference group.
     * 
     * @param {string} preferenceGroup The preference group to retrieve preference definitions for
     * @param {string} [id=''] The identifier for this request
     * @return {Promise} A promise that either resolves with the response of the endpoint or is rejected with an
     * error message
     */
    self.getPreferenceDefinitions = function(preferenceGroup, id = '') {
        return self.getSettingDefinitions(preferenceGroup, prefSettingType, id);
    };

    /**
     * @ngdoc method
     * @name getApplicationSettingDefinitions
     * @methodOf shared.service:settingManagerService
     *
     * @description
     * Retrieve all application setting definitions that are part of the passed in application setting group.
     * 
     * @param {string} applicationSettingGroup The application setting group to retrieve application setting definitions for
     * @param {string} [id=''] The identifier for this request
     * @return {Promise} A promise that either resolves with the response of the endpoint or is rejected with an
     * error message
     */
    self.getApplicationSettingDefinitions = function(applicationSettingGroup, id = '') {
        return self.getSettingDefinitions(applicationSettingGroup, appSettingType, id);
    };

    /**
     * @ngdoc method
     * @name getSettingDefinitions
     * @methodOf shared.service:settingManagerService
     *
     * @description
     * Makes a call to GET /mobirest/settings/groups/{settingGroup}/definitions to get the JSON-LD representation
     * of each setting subType defined in the repo that is declared as being part of the passed in Setting Group.
     *
     * @param {string} settingGroup The setting group to retrieve setting definitions for
     * @param {string} type The type of setting to get definitions for
     * @param {string} [id=''] The identifier for this request
     * @return {Promise} A promise that either resolves with the response of the endpoint or is rejected with an
     * error message
     */
    self.getSettingDefinitions = function(settingGroup, type, id = '') {
        const config = {
            params: {
                type
            }
        };
        const promise = id ? httpService.get(`${prefix}/groups/${encodeURIComponent(settingGroup)}/definitions`, config, id)
            : $http.get(`${prefix}/groups/${encodeURIComponent(settingGroup)}/definitions`, config);
        return promise.then($q.when, util.rejectError);
    };
}

export default settingManagerService;