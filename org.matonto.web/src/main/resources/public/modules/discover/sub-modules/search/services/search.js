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
         * @name search
         *
         * @description
         * The `search` module only provides the `exploreService` service which provides utility
         * methods for the creating and submitting search queries.
         */
        .module('search', [])
        /**
         * @ngdoc service
         * @name search.service:searchService
         * @requires discoverState.service:discoverStateService
         * @requires httpService.service:httpService
         * @requires sparqlManager.service:sparqlManager
         *
         * @description
         * `searchService` is a service that provides methods to create search query strings
         * and submit them to the {@link sparqlManager.service:sparqlManagerService SPARQL query endpoints}.
         */
        .service('searchService', searchService);

    searchService.$inject = ['discoverStateService', 'httpService', 'sparqlManagerService', 'sparqljs'];

    function searchService(discoverStateService, httpService, sparqlManagerService, sparqljs) {
        var self = this;
        var ds = discoverStateService;
        var sm = sparqlManagerService;

        var simplePattern = {
            type: 'bgp',
            triples: [
                {
                    subject: '?Subject',
                    predicate: '?Predicate',
                    object: '?o'
                }
            ]
        };

        /**
         * @ngdoc method
         * @name submitSearch
         * @methodOf search.service:searchService
         *
         * @description
         * Runs a SPARQL query made using the provided keywords and boolean operator against the
         * repository and returns the SPARQL spec JSON results.
         *
         * @param {string[]} keywords An array of keywords to search for
         * @param {boolean} [isOr=false] Whether or not the kwyrod search results should be combined with OR or not
         * @return {Promise} A Promise that resolves with the query results or rejects with an error message.
         */
        self.submitSearch = function(keywords, isOr = false) {
            httpService.cancel(ds.search.targetedId);
            return sm.query(self.createQueryString(keywords, isOr), '', ds.search.targetedId);
        }
        /**
         * @ngdoc method
         * @name createQueryString
         * @methodOf search.service:searchService
         *
         * @description
         * Creates a SPARQL query that selects all subjects, predicates, and objects that match
         * multiple keywords searches combined either using boolean operator AND or OR.
         *
         * @param {string[]} keywords An array of keywords to search for
         * @param {boolean} [isOr=false] Whether or not the kwyrod search results should be combined with OR or not
         * @return {string} A SPARQL query string
         */
        self.createQueryString = function(keywords, isOr = false) {
            var query = {
                type: 'query',
                prefixes: {},
                queryType: 'SELECT',
                variables: [
                    '?Subject',
                    '?Predicate',
                    {
                        expression: {
                            expression: '?o',
                            type: 'aggregate',
                            aggregation: 'group_concat',
                            distinct: true,
                            separator: ', '
                        },
                        variable: '?Values'
                    }
                ],
                group: [{ expression: '?Subject' }, { expression: '?Predicate' }],
                distinct: true,
                where: []
            };
            if (isOr) {
                var obj = {type: 'union', patterns: _.map(keywords, createKeywordQuery)};
                query.where.push(obj);
            } else {
                query.where = _.map(keywords, createKeywordQuery);
            }
            var generator = new sparqljs.Generator();
            return generator.stringify(query);
        }

        function createKeywordQuery(keyword) {
            return {
                type: 'group',
                patterns: [
                    angular.copy(simplePattern),
                    {
                        type: 'filter',
                        expression: {
                            type: 'operation',
                            operator: 'contains',
                            args: [
                                {
                                    type: 'operation',
                                    operator: 'lcase',
                                    args: ['?o']
                                },
                                {
                                    type: 'operation',
                                    operator: 'lcase',
                                    args: ['\"' + keyword + '\"']
                                }
                            ]
                        }
                    }
                ]
            };
        }
    }
})();