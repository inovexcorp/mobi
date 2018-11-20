/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
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
(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name stateManager
         *
         * @description
         * The `stateManager` module only provides the `stateManagerService` service which provides access to the Mobi
         * state REST endpoints and all of the current user's state.
         */
        .module('stateManager', [])
        /**
         * @ngdoc service
         * @name stateManager.service:stateManagerService
         * @requires util.service:utilService
         *
         * @description
         * `stateManagerService` is a service that provides access to the Mobi state REST endpoints and the `states`
         * variable which holds all the state for the currently logged in user.
         */
        .service('stateManagerService', stateManagerService);

        stateManagerService.$inject = ['$http', '$q', '$httpParamSerializer', 'utilService', 'REST_PREFIX'];

        function stateManagerService($http, $q, $httpParamSerializer, utilService, REST_PREFIX) {
            var self = this;
            var prefix = REST_PREFIX + 'states';
            var util = utilService;

            /**
             * @ngdoc property
             * @name states
             * @propertyOf stateManager.service:stateManagerService
             * @type {Object[]}
             *
             * @description
             * `states` holds the list of all states for the current user. Each object looks like this:
             * ```
             * {
             *     id: '',
             *     model: [...]
             * }
             * ```
             */
            self.states = [];

            /**
             * @ngdoc method
             * @name initialize
             * @methodOf stateManager.service:stateManagerService
             *
             * @description
             * Initializes the `states` variable using the `getStates` method. If the states cannot be retrieved,
             * creates an error toast.
             *
             * @returns {Promise} A promise that resolves whether the initialization was successful or not
             */
            self.initialize = function() {
                return self.getStates()
                    .then(states => self.states = states, () => util.createErrorToast('Problem getting states'));
            }
            /**
             * @ngdoc method
             * @name getStates
             * @methodOf stateManager.service:stateManagerService
             *
             * @description
             * Calls the GET /mobirest/states endpoint with the provided parameters and returns the array of state
             * objects.
             *
             * @param {Object} stateConfig The query parameters to add to the request
             * @returns {Promise} A promise that resolves to the array of state objects or rejects with an error message
             */
            self.getStates = function(stateConfig) {
                var params = $httpParamSerializer(stateConfig);
                return $http.get(prefix + '?' + params)
                    .then(response => _.get(response, 'data', []), util.rejectError);
            }
            /**
             * @ngdoc method
             * @name createState
             * @methodOf stateManager.service:stateManagerService
             *
             * @description
             * Calls the POST /mobirest/states endpoint with the provided state JSON-LD and a string identifying the
             * application that state will be for. If the state was created successfully, it is added to the `states`
             * array. Returns a Promise.
             *
             * @param {Object[]} stateJson A JSON-LD array of the state data.
             * @param {string} application A string identifying the application the state will belong to
             * @returns {Promise} A promise that resolves if the creation was successful or rejects with an error message
             */
            self.createState = function(stateJson, application) {
                var config = {
                    transformResponse: undefined,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                };
                if (application) {
                    config.params = {application};
                }
                return $http.post(prefix, angular.toJson(stateJson), config)
                    .then(response => self.states.push({id: response.data, model: stateJson}), util.rejectError);
            }
            /**
             * @ngdoc method
             * @name getState
             * @methodOf stateManager.service:stateManagerService
             *
             * @description
             * Calls the GET /mobirest/states/{stateId} endpoint with the provided state IRI string to retrieve a
             * state object. Returns a Promise with the state object.
             *
             * @param {string} stateId A string identifying the state to retrieve
             * @returns {Promise} A promise that resolves with the identified state object or rejects with an error
             *      message
             */
            self.getState = function(stateId) {
                return $http.get(prefix + '/' + encodeURIComponent(stateId))
                    .then(response => _.get(response, 'data', {}), util.rejectError);
            }
            /**
             * @ngdoc method
             * @name updateState
             * @methodOf stateManager.service:stateManagerService
             *
             * @description
             * Calls the PUT /mobirest/states/{stateId} endpoint and updates the identified state with the provided IRI
             * string with the provided JSON-LD array of new data. If the update was successful, updates the `states`
             * array with the new model data. Returns a Promise indicating the success.
             *
             * @param {string} stateId A string identifying the state to retrieve
             * @param {Object[]} stateJson A JSON-LD array of the new state data
             * @returns {Promise} A promise that resolves if the update was successful or rejects with an error message
             */
            self.updateState = function(stateId, stateJson) {
                return $http.put(prefix + '/' + encodeURIComponent(stateId), angular.toJson(stateJson))
                    .then(() => _.forEach(self.states, state => {
                        if (_.get(state, 'id', '') === stateId) {
                            _.set(state, 'model', stateJson);
                            return false;
                        }
                    }), util.rejectError);
            }
            /**
             * @ngdoc method
             * @name deleteState
             * @methodOf stateManager.service:stateManagerService
             *
             * @description
             * Calls the DELETE /mobirest/states/{stateId} endpoint to remove the identified state object with the
             * provided IRI from the application. If the deletion was successful, updates the `states` array. Returns a
             * Promise indicating the success.
             *
             * @param {string} stateId A string identifying the state to delete
             * @returns {Promise} A promise that resolves if the deletion was successful or rejects with an error message
             */
            self.deleteState = function(stateId) {
                return $http.delete(prefix + '/' + encodeURIComponent(stateId))
                    .then(() => _.remove(self.states, {id: stateId}), util.rejectError);
            }
        }
})();
