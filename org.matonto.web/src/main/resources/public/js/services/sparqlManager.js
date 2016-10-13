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
        /**
         * @ngdoc overview
         * @name sparqlManager
         * @requires ontologyManager
         * @requires prefixes
         *
         * @description
         * The `sparqlManager` module only provides the `sparqlManagerService` service which
         * provides access to the MatOnto SPARQL query REST endpoint and state variables for
         * the SPARQL Editor
         */
        .module('sparqlManager', [])
        /**
         * @ngdoc service
         * @name sparqlManager.service:sparqlManagerService
         * @requires $rootScope
         * @requires $http
         *
         * @description
         * `sparqlManagerService` is a service that provides access to the MatOnto SPARQL query
         * REST endpoint and various state variables for the SPARQL Editor.
         */
        .service('sparqlManagerService', sparqlManagerService);

        sparqlManagerService.$inject = ['$rootScope', '$http'];

        function sparqlManagerService($rootScope, $http) {
            var prefix = '/matontorest/sparql/page';
            var self = this;

            /**
             * @ngdoc property
             * @name prefixes
             * @propertyOf sparqlManager.service:sparqlManagerService
             * @type {string[]}
             *
             * @description
             * The list of selected prefixes for use in the
             * {@link sparqlEditor.directive:sparqlEditor SPARQL editor}.
             */
            self.prefixes = [];
            /**
             * @ngdoc property
             * @name queryString
             * @propertyOf sparqlManager.service:sparqlManagerService
             * @type {string}
             *
             * @description
             * The query string from the {@link sparqlEditor.directive:sparqlEditor SPARQL editor} to
             * be ran against the MatOnto repository.
             */
            self.queryString = '';
            /**
             * @ngdoc property
             * @name data
             * @propertyOf sparqlManager.service:sparqlManagerService
             * @type {Object}
             *
             * @description
             * The results from the running the {@link sparqlManager.service:sparqlManagerService#queryString}.
             */
            self.data = {};
            /**
             * @ngdoc property
             * @name errorMessage
             * @propertyOf sparqlManager.service:sparqlManagerService
             * @type {string}
             *
             * @description
             * An error message obtained from attempting to run a SPARQL query against the MatOnto repository.
             */
            self.errorMessage = '';
            /**
             * @ngdoc property
             * @name infoMessage
             * @propertyOf sparqlManager.service:sparqlManagerService
             * @type {string}
             *
             * @description
             * A generic information message to be used when there is no data.
             */
            self.infoMessage = 'Please submit a query to see results here.';
            /**
             * @ngdoc property
             * @name currentPage
             * @propertyOf sparqlManager.service:sparqlManagerService
             * @type {number}
             *
             * @description
             * The current page of {@link sparqlManager.service:sparqlManagerService#data results} to be
             * displayed in the {@link sparqlResultTable.directive:sparqlResultTable SPARQL result table}.
             */
            self.currentPage = 0;

            /**
             * @ngdoc method
             * @name reset
             * @methodOf sparqlManager.service:sparqlManagerService
             *
             * @description
             * Resets all state variables.
             */
            self.reset = function() {
                self.prefixes = [];
                self.queryString = '';
                self.data = {};
                self.errorMessage = '';
                self.infoMessage = '';
                self.currentPage = 0;
            }
            /**
             * @ngdoc method
             * @name queryRdf
             * @methodOf sparqlManager.service:sparqlManagerService
             *
             * @description
             * Calls the GET /sparql/page REST endpoint to conduct a SPARQL query using the current
             * {@link sparqlManager.service:sparqlManagerService#queryString query} and
             * {@link sparqlManager.service:sparqlManagerService#prefixes prefixes} and sets the results
             * to {@link sparqlManager.service:sparqlManagerService#data data}.
             */
            self.queryRdf = function() {
                self.currentPage = 0;
                self.data = {};
                self.errorMessage = '';
                self.infoMessage = '';

                var prefixes = self.prefixes.length ? 'PREFIX ' + _.join(self.prefixes, '\nPREFIX ') + '\n\n' : '';
                var config = {
                    params: {
                        query: prefixes + self.queryString,
                        limit: 100,
                        start: 0
                    }
                }

                $rootScope.showSpinner = true;
                $http.get(prefix, config)
                    .then(onSuccess, onError)
                    .then(() => {
                        $rootScope.showSpinner = false;
                    });
            }
            /**
             * @ngdoc method
             * @name getResults
             * @methodOf sparqlManager.service:sparqlManagerService
             *
             * @description
             * Uses the passed URL to get the next page of results from a SPARQL query. Expects a URL using the
             * GET /sparql/page REST endpoint and sets the results to
             * {@link sparqlManager.service:sparqlManagerService#data data}.
             */
            self.getResults = function(url) {
                $rootScope.showSpinner = true;
                $http.get(url)
                    .then(onSuccess, onError)
                    .then(() => {
                        $rootScope.showSpinner = false;
                    });
            }

            function getMessage(response, defaultMessage) {
                return _.get(response, 'statusText') || defaultMessage;
            }
            function onSuccess(response) {
                if (_.get(response, 'status') === 200) {
                    self.data = response.data;
                } else {
                    self.infoMessage = getMessage(response, 'There was a problem getting the results.');
                }
            }
            function onError(response) {
                self.errorMessage = getMessage(response, 'A server error has occurred. Please try again later.');
            }
        }
})();
