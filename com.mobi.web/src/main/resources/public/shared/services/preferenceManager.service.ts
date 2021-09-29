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
preferenceManagerService.$inject = ['$http', '$q', 'REST_PREFIX', 'utilService', 'httpService', 'prefixes'];

/**
 * @ngdoc service
 * @name shared.service:preferenceManagerService
 * @requires $http
 * @requires $q
 * @requires shared.service:utilService
 * @requires shared.service:httpService
 *
 * @description
 * `preferenceManagerService` is a service that provides access to the Mobi Preference REST endpoints and variables
 * to hold information about the different types of preferences.
 */
function preferenceManagerService($http, $q, REST_PREFIX, utilService, httpService, prefixes) {
    const self = this,
        util = utilService,
        prefix = REST_PREFIX + 'settings',
        type = prefixes.setting  + 'Preference';

    /**
     * @ngdoc method
     * @name getUserPreferences
     * @methodOf shared.service:preferenceManagerService
     *
     * @description
     * Makes a call to GET /mobirest/preference to get a JSON object of all user preferences and referenced entities 
     * for the active user. The return object will have a key for each preference type a user has previously created and values
     * that are a json-ld representation of the instance of Preference and referenced entities that they have previously created
     * for that type.
     *
     * @param {string} [id=''] The identifier for this request
     * @return {Promise} A promise that either resolves with the response of the endpoint or is rejected with an
     * error message
     */
    self.getUserPreferences = function(id = '') {
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
     * @name updateUserPreference
     * @methodOf shared.service:preferenceManagerService
     *
     * @description
     * Calls the PUT /mobirest/preference/{preferenceId} endpoint and updates the User Preference with the passed in preferenceId
     * using the JSON-LD provided in the passed in object.
     *
     * @param {string} preferenceId The id of the user preference that will be updated 
     * @param {string} preferenceType The type of user preference being updated
     * @param {Object} userPreference The JSON-LD containing the new user preference values and referenced entities
     * @param {string} [id=''] The identifier for this request
     * @return {Promise} A promise that either resolves with the response of the endpoint or is rejected with an
     * error message
     */
    self.updateUserPreference = function(preferenceId, preferenceType, userPreference, id = '') {
        const config = {
            params: {
                'subType': preferenceType,
                type
            }
        };
        const promise = id ? httpService.put(prefix + '/' + encodeURIComponent(preferenceId), userPreference, config, id) 
            : $http.put(prefix + '/' + encodeURIComponent(preferenceId), userPreference, config);
        return promise.then($q.when, util.rejectError);
    };

    /**
     * @ngdoc method
     * @name createUserPreference
     * @methodOf shared.service:preferenceManagerService
     *
     * @description
     * Calls the POST /mobirest/preference endpoint and creates an instance of preference as well as it's referenced entities for
     * the active user of the type defined by the passed in preferenceType using the JSON-LD provided in the passed in object.
     *
     * @param {string} preferenceType The type of user preference being updated
     * @param {Object} userPreference The JSON-LD containing the new user preference values and referenced entities
     * @param {string} [id=''] The identifier for this request
     * @return {Promise} A promise that either resolves with the response of the endpoint or is rejected with an
     * error message
     */
    self.createUserPreference = function(preferenceType, userPreference, id = '') {
        const config = {
            params: {
                'subType': preferenceType,
                type
            }
        };
        const promise = id ? httpService.post(prefix, userPreference, config, id) 
            : $http.post(prefix, userPreference, config);
        return promise.then($q.when, util.rejectError);
    };

    /**
     * @ngdoc method
     * @name getPreferenceGroups
     * @methodOf shared.service:preferenceManagerService
     *
     * @description
     * Makes a call to GET /mobirest/preference/groups to get the JSON-LD representation of each
     * Preference Group currently defined in the repo.
     *
     * @param {string} [id=''] The identifier for this request
     * @return {Promise} A promise that either resolves with the response of the endpoint or is rejected with an
     * error message
     */
    self.getPreferenceGroups = function(id = '') {
        const config = {
            params: {
                type
            }
        };
        const promise = id ? httpService.get(prefix + '/groups', config, id) : $http.get(prefix + '/groups', config);
        return promise.then($q.when, util.rejectError);
    };

    /**
     * @ngdoc method
     * @name getPreferenceDefinitions
     * @methodOf shared.service:preferenceManagerService
     *
     * @description
     * Makes a call to GET /mobirest/preference/groups/{preferenceGroup}/definitions to get the JSON-LD representation of each
     * subclass of Preference defined in the repo that is declared as being part of the passed in Preference Group.
     *
     * @param {string} preferenceGroup The preference group to retrieve preference definitions for
     * @param {string} [id=''] The identifier for this request
     * @return {Promise} A promise that either resolves with the response of the endpoint or is rejected with an
     * error message
     */
    self.getPreferenceDefinitions = function(preferenceGroup, id = '') {
        const config = {
            params: {
                type
            }
        };
        const promise = id ? httpService.get(prefix + '/groups/' + encodeURIComponent(preferenceGroup) + '/definitions', config, id)
            : $http.get(prefix + '/groups/' + encodeURIComponent(preferenceGroup) + '/definitions', config);
        return promise.then($q.when, util.rejectError);
    };
}

export default preferenceManagerService;