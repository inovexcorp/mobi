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
                    .then(response => self.states.push({id: response.data, model: stateJson}), util.rejectError);
            }

            self.getState = function(stateId) {
                return $http.get(prefix + '/' + encodeURIComponent(stateId))
                    .then(response => _.get(response, 'data', {}), util.rejectError);
            }

            self.updateState = function(stateId, stateJson) {
                return $http.put(prefix + '/' + encodeURIComponent(stateId), angular.toJson(stateJson))
                    .then(() => _.forEach(self.states, state => {
                        if (_.get(state, 'id', '') === stateId) {
                            _.set(state, 'model', stateJson);
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
                var branch = _.find(model, {[prefixes.ontologyState + 'branch']: [{'@id': branchId}]});
                var record = _.find(model, {'@type': 'http://mobi.com/states/ontology-editor/state-record'});
                if (record === undefined) {
                    record = _.find(model, {'@type': ['http://mobi.com/states/ontology-editor/state-record']});
                }
                var branchIri = 'http://mobi.com/states/ontology-editor/branch-id/' + uuid.v4();

                record[prefixes.ontologyState + 'currentBranch'] = [{'@id': branchId}];
                if (branch) {
                    branch[prefixes.ontologyState + 'commit'] = [{'@id': commitId}];
                } else {
                    record[prefixes.ontologyState + 'branches'].push({'@id': branchIri});
                    model.push({
                        '@id': branchIri,
                        [prefixes.ontologyState + 'branch']: [{'@id': branchId}],
                        [prefixes.ontologyState + 'commit']: [{'@id': commitId}]
                    });
                }
                return self.updateState(stateId, model);
            }
            
            self.deleteOntologyBranch = function(recordId, branchId) {
                var ontologyState = self.getOntologyStateByRecordId(recordId);
                var record = _.find(ontologyState.model, {'@type': 'http://mobi.com/states/ontology-editor/state-record'});
                var branch = _.head(_.remove(ontologyState.model, {[prefixes.ontologyState + 'branch']: [{'@id': branchId}]}));
                _.remove(record[prefixes.ontologyState + 'branches'], {'@id': _.get(branch, '@id')});
                return self.updateState(ontologyState.id, ontologyState.model);

            }

            self.deleteOntologyState = function(recordId) {
                var stateId = _.get(self.getOntologyStateByRecordId(recordId), 'id', '');
                return self.deleteState(stateId);
            }

            function makeOntologyState(recordId, branchId, commitId) {
                var branchIri = 'http://mobi.com/states/ontology-editor/branch-id/' + uuid.v4();
                return [
                    {
                        '@id': 'http://mobi.com/states/ontology-editor/' + uuid.v4(),
                        '@type': 'http://mobi.com/states/ontology-editor/state-record',
                        [prefixes.ontologyState + 'record']: [{'@id': recordId}],
                        [prefixes.ontologyState + 'branches']: [{'@id': branchIri}],
                        [prefixes.ontologyState + 'currentBranch']: [{'@id': branchId}]
                    },
                    {
                        '@id': branchIri,
                        [prefixes.ontologyState + 'branch']: [{'@id': branchId}],
                        [prefixes.ontologyState + 'commit']: [{'@id': commitId}]
                    }
                ]
            }
        }
})();
