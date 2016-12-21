/*-
 * #%L
 * org.matonto.web
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

    stateManagerService.$inject = ['$http', '$q', '$httpParamSerializer', 'uuid', 'prefixes'];

    function stateManagerService($http, $q, $httpParamSerializer, uuid, prefixes) {
        var self = this;
        var prefix = '/matontorest/states';
        var applicationId = 'ontology-editor';

        self.states = [];

        self.getStates = function(stateConfig) {
            var params = $httpParamSerializer(stateConfig);
            return $http.get(prefix + '?' + params)
                .then(response => $q.resolve(_.get(response, 'data', [])));
        }

        self.createState = function(stateJson, application) {
            var config = {};
            if (application) {
                config.params = {application};
            }
            return $http.post(prefix, angular.toJson(stateJson), config);
        }

        self.createOntologyState = function(recordId, branchId, commitId) {
            var ontologyState = {
                '@id': 'http://matonto.org/states/ontology-editor/' + uuid.v4(),
                [prefixes.ontologyState + 'record']: [{'@id': recordId}],
                [prefixes.ontologyState + 'branch']: [{'@id': branchId}],
                [prefixes.ontologyState + 'commit']: [{'@id': commitId}]
            }
            return self.createState(ontologyState, applicationId);
        }

        self.getState = function(stateId) {
            return $http.get(prefix + '/' + encodeURIComponent(stateId))
                .then(response => $q.resolve(_.get(response, 'data', {})));
        }

        self.updateState = function(stateId, stateJson) {
            return $http.post(prefix + '/' + encodeURIComponent(stateId), angular.toJson(stateJson));
        }

        self.deleteState = function(stateId) {
            return $http.delete(prefix + '/' + encodeURIComponent(stateId));
        }

        self.initialize = function() {
            self.getStates()
                .then(states => self.states = states, () => console.log('Problem getting states'));
        }
    }
})();