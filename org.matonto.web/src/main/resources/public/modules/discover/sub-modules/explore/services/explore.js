/*-
 * #%L
 * org.matonto.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
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
         * @name explore
         *
         * @description
         * The `explore` module only provides the `exploreService` service which provides access
         * to the MatOnto explorable-datasets REST endpoints.
         */
        .module('explore', [])
        /**
         * @ngdoc service
         * @name explore.service:exploreService
         * @requires $http
         * @requires $q
         * @requires util.service:utilService
         * @requires discoverState.service:discoverStateService
         *
         * @description
         * `exploreService` is a service that provides access to the MatOnto explorable-datasets REST
         * endpoints.
         */
        .service('exploreService', exploreService);
    
    exploreService.$inject = ['$http', '$q', 'utilService', 'discoverStateService'];
    
    function exploreService($http, $q, utilService, discoverStateService) {
        var self = this;
        var prefix = '/matontorest/explorable-datasets/';
        var util = utilService;
        var ds = discoverStateService;
        
        /**
         * @ngdoc method
         * @name getClassDetails
         * @methodOf explore.service:exploreService
         *
         * @description
         * Calls the GET /matontorest/explorable-datasets/{recordId}/class-details endpoint and returns the
         * array of class details.
         *
         * @returns {Promise} A promise that resolves to an array of the class details for the identified dataset record.
         */
        self.getClassDetails = function(recordId) {
            return $http.get(prefix + encodeURIComponent(recordId) + '/class-details')
                .then(response => response.data, util.rejectError);
        }
        
        /**
         * @ngdoc method
         * @name getClassInstanceDetails
         * @methodOf explore.service:exploreService
         *
         * @description
         * Calls the GET /matontorest/explorable-datasets/{recordId}/classes/{classId}/instance-details endpoint and returns the
         * array of instance details.
         *
         * @param {string} recordId The id of the Record
         * @param {string} classId The id of the Class
         * @param {Object} params The params for the REST call
         * @param {number} params.offset The offset for the query
         * @param {number} params.limit The limit for the query
         * @param {boolean} noSpinner Whether or not the spinner should be shown
         * @returns {Promise} A promise that resolves to an array of the instance details for the identified class of the
         * identified dataset record.
         */
        self.getClassInstanceDetails = function(recordId, classId, params, noSpinner = false) {
            var config = {params};
            if (noSpinner) {
                config.timeout = undefined;
            }
            return $http.get(prefix + encodeURIComponent(recordId) + '/classes/' + encodeURIComponent(classId) + '/instance-details', config)
                .then(response => response, util.rejectError);
        }
        
        /**
         * @ngdoc method
         * @name getClassPropertyDetails
         * @methodOf explore.service:exploreService
         *
         * @description
         * Calls the GET /matontorest/explorable-datasets/{recordId}/classes/{classId}/property-details endpoint and returns the
         * array of class property details.
         *
         * @param {string} recordId The id of the Record
         * @param {string} classId The id of the Class
         * @returns {Promise} A promise that resolves to an array of the class property details for the identified class of the
         * identified dataset record.
         */
        self.getClassPropertyDetails = function(recordId, classId) {
            return $http.get(prefix + encodeURIComponent(recordId) + '/classes/' + encodeURIComponent(classId) + '/property-details')
                .then(response => response.data, util.rejectError);
        }
        
        /**
         * @ngdoc method
         * @name createInstance
         * @methodOf explore.service:exploreService
         *
         * @description
         * Calls the POST /matontorest/explorable-datasets/{recordId}/classes/{classId}/instances endpoint
         * and returns the instance IRI.
         *
         * @param {string} recordId The id of the Record
         * @param {Object} json The JSON-LD of the instance being created
         * @returns {Promise} A promise that resolves to the instance IRI.
         */
        self.createInstance = function(recordId, json) {
            return $http.post(prefix + encodeURIComponent(recordId) + '/instances', json)
                .then(response => response.data, util.rejectError);
        }
        
        /**
         * @ngdoc method
         * @name getInstance
         * @methodOf explore.service:exploreService
         *
         * @description
         * Calls the GET /matontorest/explorable-datasets/{recordId}/classes/{classId}/instances/{instanceId} endpoint
         * and returns the instance.
         *
         * @param {string} recordId The id of the Record
         * @param {string} instanceId The id of the instance
         * @returns {Promise} A promise that resolves to an instance object defined as the identified class in the
         * identified dataset record.
         */
        self.getInstance = function(recordId, instanceId) {
            return $http.get(prefix + encodeURIComponent(recordId) + '/instances/' + encodeURIComponent(instanceId))
                .then(response => response.data, util.rejectError);
        }
        
        /**
         * @ngdoc method
         * @name updateInstance
         * @methodOf explore.service:exploreService
         *
         * @description
         * Calls the PUT /matontorest/explorable-datasets/{recordId}/classes/{classId}/instances/{instanceId} endpoint
         * and identifies if the instance was updated.
         *
         * @param {string} recordId The id of the Record
         * @param {string} instanceId The id of the instance
         * @param {Object} json The JSON-LD object of the new instance
         * @returns {Promise} A promise that indicates if the instance was updated successfully.
         */
        self.updateInstance = function(recordId, instanceId, json) {
            return $http.put(prefix + encodeURIComponent(recordId) + '/instances/' + encodeURIComponent(instanceId), angular.toJson(json))
                .then(response => $q.when(), util.rejectError);
        }
        
        /**
         * @ngdoc method
         * @name createPagedResultsObject
         * @methodOf explore.service:exploreService
         *
         * @description
         * Creates an object which contains all of the paginated details from the provided response in the expected format.
         *
         * @param {Object} response The response of an $http call which should contain paginated details in the header.
         * @returns {Object} An object which contains all of the paginated details in the expected format.
         */
        self.createPagedResultsObject = function(response) {
            var object = {};
            _.set(object, 'data', response.data);
            var headers = response.headers();
            _.set(object, 'total', _.get(headers, 'x-total-count', 0));
            if (_.has(headers, 'link')) {
                var links = util.parseLinks(_.get(headers, 'link', {}));
                _.set(object, 'links.next', _.get(links, 'next', ''));
                _.set(object, 'links.prev', _.get(links, 'prev', ''));
            }
            return object;
        }
    }
})();