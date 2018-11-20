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
        .module('stateManager', [])
        .service('stateManagerService', stateManagerService);

        stateManagerService.$inject = ['$http', '$q', '$httpParamSerializer', 'uuid', 'prefixes', 'utilService', 'REST_PREFIX'];

        function stateManagerService($http, $q, $httpParamSerializer, uuid, prefixes, utilService, REST_PREFIX) {
            var self = this;
            var prefix = REST_PREFIX + 'states';
            var branchStateNamespace = 'http://mobi.com/states/ontology-editor/branch-id/';
            var commitStateNamespace = 'http://mobi.com/states/ontology-editor/commit-id/';
            var util = utilService;

            /**
             * @ngdoc property
             * @name states
             * @propertyOf stateManager.service:stateManagerService
             * @type {Object[]}
             *
             * @description
             * `states` holds the list of all sstates for the current user. Each object looks like this:
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
            /**
             * @ngdoc method
             * @name createOntologyState
             * @methodOf stateManager.service:stateManagerService
             *
             * @description
             * Creates a new state for the ontology editor for the user using the provided Record IRI, Commit IRI, and
             * optional Branch IRI. The state holds the last thing the user had checked out for that Record and keeps
             * track of the last commit a User was viewing on a Branch. Returns a Promise indicating the success.
             *
             * @param {string} recordId A string identifying the record to keep state for
             * @param {string} commitId A string identifying the commit the user was viewing when the state was made
             * @param {string} [branchId = ''] An optional string identifying the branch the user was last viewing
             * @returns {Promise} A promise that resolves if the creation was successful or rejects with an error message
             */
            self.createOntologyState = function(recordId, commitId, branchId = '') {
                return self.createState(makeOntologyState(recordId, commitId, branchId), 'ontology-editor');
            }
            /**
             * @ngdoc method
             * @name getOntologyStateByRecordId
             * @methodOf stateManager.service:stateManagerService
             *
             * @description
             * Retrieves an ontology editor state in the `states` array by the id of the Record it is about.
             *
             * @param {string} recordId A string identifying the Record of a state
             * @returns {Object} A state object from the `states` array
             */
            self.getOntologyStateByRecordId = function(recordId) {
                return _.find(self.states, {
                    model: [{
                        [prefixes.ontologyState + 'record']: [{'@id': recordId}]
                    }]
                });
            }
            /**
             * @ngdoc method
             * @name updateOntologyState
             * @methodOf stateManager.service:stateManagerService
             *
             * @description
             * Updates an ontology editor state for the identified Record using the provided Commit IRI and optional
             * Branch IRI and updates the current state. If the current state was originally a Commit state, the Commit
             * state is removed. If the current state was originally a Branch state, the Branch state stays. If a Branch
             * IRI is provided and there is already a Branch state for it, updates the Commit on the state to the
             * provided IRI. If no Branch IRI is provided, the current state is set to a Commit state of the provided
             * IRI. Updates the state in the backend and in the `states` array. Returns a Promise indicating the success.
             *
             * @param {string} recordId A string identifying the Record of a state
             * @param {string} commitId A string identifying the commit the user is now viewing
             * @param {string} [branchId = ''] An optional string identifying the branch the user is now viewing
             * @returns {Promise} A promise that resolves if the update was successful or rejects with an error message
             */
            self.updateOntologyState = function(recordId, commitId, branchId = '') {
                var ontologyState = angular.copy(self.getOntologyStateByRecordId(recordId));
                var stateId = _.get(ontologyState, 'id', '');
                var model = _.get(ontologyState, 'model', '');
                var recordState = _.find(model, {'@type': [prefixes.ontologyState + 'StateRecord']});
                var currentStateId = _.get(recordState, "['" + prefixes.ontologyState + 'currentState' + "'][0]['@id']");
                var currentState = _.find(model, {'@id': currentStateId});

                if (_.isEqual(_.get(currentState, '@type', []), [prefixes.ontologyState + 'StateCommit'])) {
                    _.remove(model, currentState);
                }

                if (branchId) {
                    var branchState = _.find(model, {[prefixes.ontologyState + 'branch']: [{'@id': branchId}]});
                    if (branchState) {
                        currentStateId = branchState['@id'];
                        branchState[prefixes.ontologyState + 'commit'] = [{'@id': commitId}];
                    } else {
                        currentStateId = branchStateNamespace + uuid.v4();
                        recordState[prefixes.ontologyState + 'branchStates'] = _.concat(_.get(recordState, "['" + prefixes.ontologyState + "branchStates']", []), [{'@id': currentStateId}]);
                        model.push({
                            '@id': currentStateId,
                            '@type': [prefixes.ontologyState + 'StateCommit', prefixes.ontologyState + 'StateBranch'],
                            [prefixes.ontologyState + 'branch']: [{'@id': branchId}],
                            [prefixes.ontologyState + 'commit']: [{'@id': commitId}]
                        });
                    }
                } else {
                    currentStateId = commitStateNamespace + uuid.v4();
                    model.push({
                        '@id': currentStateId,
                        '@type': [prefixes.ontologyState + 'StateCommit'],
                        [prefixes.ontologyState + 'commit']: [{'@id': commitId}]
                    });
                }
                recordState[prefixes.ontologyState + 'currentState'] = [{'@id': currentStateId}];
                return self.updateState(stateId, model);
            }
            /**
             * @ngdoc method
             * @name deleteOntologyBranch
             * @methodOf stateManager.service:stateManagerService
             *
             * @description
             * Updates an ontology editor state for the identified Record when the identified Branch is deleted. The
             * Branch state for the Branch is removed from the state array and the Record state object. Updates the
             * state in the backend and the `states` array. Returns a Promise indicating the success.
             *
             * @param {string} recordId A string identifying the Record of a state
             * @param {string} branchId A string identifying the branch that was removed
             * @returns {Promise} A promise that resolves if the update was successful or rejects with an error message
             */
            self.deleteOntologyBranch = function(recordId, branchId) {
                var ontologyState = angular.copy(self.getOntologyStateByRecordId(recordId));
                var record = _.find(ontologyState.model, {'@type': [prefixes.ontologyState + 'StateRecord']});
                var branchState = _.head(_.remove(ontologyState.model, {[prefixes.ontologyState + 'branch']: [{'@id': branchId}]}));
                _.remove(record[prefixes.ontologyState + 'branchStates'], {'@id': _.get(branchState, '@id')});
                if (!record[prefixes.ontologyState + 'branchStates'].length) {
                    delete record[prefixes.ontologyState + 'branchStates'];
                }
                return self.updateState(ontologyState.id, ontologyState.model);

            }
            /**
             * @ngdoc method
             * @name deleteOntologyState
             * @methodOf stateManager.service:stateManagerService
             *
             * @description
             * Deletes the ontology editor state for the identified Record in both the backend and the `states` array.
             * Returns a Promise indicating the success.
             *
             * @param {string} recordId A string identifying the Record of a state
             * @returns {Promise} A promise that resolves if the deletion was successful or rejects with an error message
             */
            self.deleteOntologyState = function(recordId) {
                var stateId = _.get(self.getOntologyStateByRecordId(recordId), 'id', '');
                return self.deleteState(stateId);
            }

            function makeOntologyState(recordId, commitId, branchId = '') {
                var stateIri;
                var recordState = {
                    '@id': 'http://mobi.com/states/ontology-editor/' + uuid.v4(),
                    '@type': [prefixes.ontologyState + 'StateRecord'],
                    [prefixes.ontologyState + 'record']: [{'@id': recordId}],
                };
                var commitState = {
                    '@type': [prefixes.ontologyState + 'StateCommit'],
                    [prefixes.ontologyState + 'commit']: [{'@id': commitId}]
                };
                if (branchId) {
                    stateIri = branchStateNamespace + uuid.v4();
                    recordState[prefixes.ontologyState + 'branchStates'] = [{'@id': stateIri}];
                    commitState['@id'] = stateIri;
                    commitState['@type'].push(prefixes.ontologyState + 'StateBranch');
                    commitState[prefixes.ontologyState + 'branch'] = [{'@id': branchId}];
                } else {
                    stateIri = commitStateNamespace + uuid.v4();
                    commitState['@id'] = stateIri;
                }
                recordState[prefixes.ontologyState + 'currentState'] = [{'@id': stateIri}];
                return [recordState, commitState];
            }
        }
})();
