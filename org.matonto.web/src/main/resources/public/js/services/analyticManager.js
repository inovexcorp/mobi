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
         * @name analyticManager
         *
         * @description
         * The `analyticManager` module only provides the `analyticManagerService` service which
         * provides access to the Mobi analytic REST endpoints
         */
        .module('analyticManager', [])
        /**
         * @ngdoc service
         * @name analyticManager.service:analyticManagerService
         * @requires $http
         * @requires $q
         * @requires util.service:utilService
         *
         * @description
         * `analyticManagerService` is a service that provides access to the Mobi analytic REST
         * endpoints.
         */
        .service('analyticManagerService', analyticManagerService);
        
        analyticManagerService.$inject = ['$http', '$q', 'utilService', 'REST_PREFIX'];
        
        function analyticManagerService($http, $q, utilService, REST_PREFIX) {
            var self = this;
            var prefix = REST_PREFIX + 'analytics';
            var util = utilService;
            
            /**
             * @ngdoc property
             * @name configurationTypes
             * @propertyOf analyticManager.service:analyticManagerService
             * @type {string[]}
             *
             * @description
             * `configurationTypes` contains a list of IRI strings of all types of configurations.
             * This list is populated by the `initialize` method.
             */
            self.configurationTypes = [];
            
            /**
             * @ngdoc method
             * @name initialize
             * @methodOf analyticManager.service:analyticManagerService
             *
             * @description
             * Initializes the `configurationTypes` of the analyticManagerService using the
             * `getConfigurationTypes` method. Rejects with an error toast.
             *
             * @returns {Promise} A promise that resolves if initialization was successful or is rejected
             * with an error message
             */
            self.initialize = function() {
                return self.getConfigurationTypes().then(types => self.configurationTypes = types, $q.reject);
            }
            
            /**
             * @ngdoc method
             * @name getConfigurationTypes
             * @methodOf analyticManager.service:analyticManagerService
             *
             * @description
             * Calls the GET /mobirest/catalogs/record-types endpoint and returns the
             * array of record type IRIs.
             *
             * @returns {Promise} A promise that resolves to an array of the IRIs for all
             * record types in the catalog
             */
            self.getConfigurationTypes = function() {
                return $http.get(prefix + '/configuration-types').then(response => response.data, util.rejectError);
            }
            
            /**
             * @ngdoc method
             * @name createAnalyticRecord
             * @methodOf analyticManager.service:analyticManagerService
             *
             * @description
             * Calls the POST /mobirest/analytics endpoint with the passed metadata and creates
             * a new AnalyticRecord and associated Configuration. Returns a Promise with the IRI of the
             * new AnalyticRecord if successful or rejects with an error message.
             *
             * @param {Object} analyticConfig A configuration object containing metadata for the new Record
             * @param {string} analyticConfig.title The required title of the new AnalyticRecord
             * @param {string} analyticConfig.description The optional description of the new AnalyticRecord
             * @param {string[]} analyticConfig.keywords The optional keywords to associate with the new AnalyticRecord
             * @param {string} analyticConfig.type The required configuration type IRI string from the `configurationTypes` array
             * @param {Object} analyticConfig.json The required JSON associated with the new Configuration
             * @return {Promise} A promise that resolves to the IRI of the new AnalyticRecord or is rejected with an error
             * message
             */
            self.createAnalytic = function(analyticConfig) {
                var fd = new FormData();
                var config = {
                    transformRequest: _.identity,
                    headers: {
                        'Content-Type': undefined
                    }
                };
                fd.append('title', analyticConfig.title);
                fd.append('type', analyticConfig.type);
                fd.append('json', analyticConfig.json);
                if (_.has(analyticConfig, 'description')) {
                    fd.append('description', analyticConfig.description);
                }
                if (_.get(analyticConfig, 'keywords', []).length > 0) {
                    fd.append('keywords', _.join(analyticConfig.keywords, ','));
                }
                return $http.post(prefix, fd, config).then(response => response.data, util.rejectError);
            }
        }
})();