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
         *
         * @description
         * `exploreService` is a service that provides access to the MatOnto explorable-datasets REST
         * endpoints.
         */
        .service('exploreService', exploreService);
    
    exploreService.$inject = ['$http', '$q'];
    
    function exploreService($http, $q) {
        var self = this;
        var prefix = '/matontorest/explorable-datasets/';
        
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
                .then(response => $q.when(response.data), response => $q.reject(response.statusText));
        }
    }
})();