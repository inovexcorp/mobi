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
            var util = utilService;

            self.states = [];

            self.getStates = function(stateConfig) {
                var params = $httpParamSerializer(stateConfig);
                return $http.get(prefix + '?' + params)
                    .then(response => _.get(response, 'data', []), util.rejectError);
            }

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
                    .then(response => self.states.push({id: response.data, model: [stateJson]}), util.rejectError);
            }

            self.getState = function(stateId) {
                return $http.get(prefix + '/' + encodeURIComponent(stateId))
                    .then(response => _.get(response, 'data', {}), util.rejectError);
            }

            self.updateState = function(stateId, stateJson) {
                return $http.put(prefix + '/' + encodeURIComponent(stateId), angular.toJson(stateJson))
                    .then(() => _.forEach(self.states, state => {
                        if (_.get(state, 'id', '') === stateId) {
                            _.set(state, 'model', [stateJson]);
                            return false;
                        }
                    }), util.rejectError);
            }

            self.deleteState = function(stateId) {
                return $http.delete(prefix + '/' + encodeURIComponent(stateId))
                    .then(() => _.remove(self.states, {id: stateId}), util.rejectError);
            }

            self.initialize = function() {
                self.getStates()
                    .then(states => self.states = states, () => util.createErrorToast('Problem getting states'));
            }

            self.createOntologyState = function(recordId, branchId, commitId) {
                return self.createState(makeOntologyState(recordId, branchId, commitId), 'ontology-editor');
            }

            self.getOntologyStateByRecordId = function(recordId) {
                return _.find(self.states, {
                    model: [{
                        [prefixes.ontologyState + 'record']: [{'@id': recordId}]
                    }]
                });
            }

            self.updateOntologyState = function(recordId, branchId, commitId) {
                var ontologyState = self.getOntologyStateByRecordId(recordId);
                var stateId = _.get(ontologyState, 'id', '');
                var model = _.get(ontologyState, 'model', '');
                model[0][prefixes.ontologyState + 'branches'][0][branchId] = commitId;
                return self.updateState(stateId, model);
            }

            self.deleteOntologyState = function(recordId) {
                var stateId = _.get(self.getOntologyStateByRecordId(recordId), 'id', '');
                return self.deleteState(stateId);
            }

            function makeOntologyState(recordId, branchId, commitId) {
                return {
                    '@id': 'http://mobi.com/states/ontology-editor/' + uuid.v4(),
                    [prefixes.ontologyState + 'record']: [{'@id': recordId}],
                    [prefixes.ontologyState + 'branches']: [{[branchId]: commitId}],
                    [prefixes.ontologyState + 'branch']: [{'@id': branchId}],
                    [prefixes.ontologyState + 'commit']: [{'@id': commitId}]
                }
            }
        }
})();
