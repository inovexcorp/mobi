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
         * The `search` module only provides the `searchService` service which provides utility
         * methods for the creating and submitting search queries.
         */
        .module('search', [])
        /**
         * @ngdoc service
         * @name search.service:searchService
         * @requires discoverState.service:discoverStateService
         * @requires httpService.service:httpService
         * @requires sparqlManager.service:sparqlManager
         * @requires prefixes.service:prefixes
         * @requires ontologyManager.service:ontologyManagerService
         * @requires util.service:utilService
         *
         * @description
         * `searchService` is a service that provides methods to create search query strings
         * and submit them to the {@link sparqlManager.service:sparqlManagerService SPARQL query endpoints}.
         */
        .service('searchService', searchService);

    searchService.$inject = ['$q', 'discoverStateService', 'httpService', 'sparqlManagerService', 'sparqljs', 'prefixes', 'datasetManagerService', 'ontologyManagerService', 'utilService'];

    function searchService($q, discoverStateService, httpService, sparqlManagerService, sparqljs, prefixes, datasetManagerService, ontologyManagerService, utilService) {
        var self = this;
        var ds = discoverStateService;
        var sm = sparqlManagerService;
        var dm = datasetManagerService;
        var om = ontologyManagerService;
        var util = utilService;

        var simplePattern = createPattern('?Subject', '?Predicate', '?o');

        /**
         * @ngdoc method
         * @name getPropertiesForDataset
         * @methodOf search.service:searchService
         *
         * @description
         * Gets all of the data properties for all ontologies associated with the identified dataset.
         *
         * @param {string} datasetRecordIRI The IRI of the DatasetRecord to restrict the query to
         * @return {Promise} A Promise that resolves with the list of data properties or rejects with an error message.
         */
        self.getPropertiesForDataset = function(datasetRecordIRI) {
            var dataset = {};
            var datasetArray = _.find(dm.datasetRecords, arr => {
                if (_.some(arr, {'@id': datasetRecordIRI})) {
                    dataset = _.find(arr, {'@id': datasetRecordIRI});
                    return true;
                }
            });
            var ontologyArray = _.reject(datasetArray, item => _.has(item, '@type'));
            return $q.all(_.map(ontologyArray, identifier => {
                var recordId = util.getPropertyId(identifier, prefixes.dataset + 'linksToRecord');
                var branchId = util.getPropertyId(identifier, prefixes.dataset + 'linksToBranch');
                var commitId = util.getPropertyId(identifier, prefixes.dataset + 'linksToCommit');
                return om.getDataProperties(recordId, branchId, commitId);
            })).then(response => _.flatten(response));
        }
        /**
         * @ngdoc method
         * @name submitSearch
         * @methodOf search.service:searchService
         *
         * @description
         * Runs a SPARQL query made using the provided keywords, types, and boolean operators against the
         * repository and returns the SPARQL spec JSON results.
         *
         * @param {string} datasetRecordIRI The IRI of the DatasetRecord to restrict the query to
         * @param {Object} queryConfig A configuration object for the query string
         * @param {string[]} queryConfig.keywords An array of keywords to search for
         * @param {boolean} queryConfig.isOrKeywords Whether or not the keyword search results should be combined with OR or not
         * @param {string[]} queryConfig.types An array of types to search for
         * @param {boolean} queryConfig.isOrTypes Whether or not the type search results should be combined with OR or not
         * @return {Promise} A Promise that resolves with the query results or rejects with an error message.
         */
        self.submitSearch = function(datasetRecordIRI, queryConfig) {
            httpService.cancel(ds.search.targetedId);
            return sm.query(self.createQueryString(queryConfig), datasetRecordIRI, ds.search.targetedId);
        }
        /**
         * @ngdoc method
         * @name createQueryString
         * @methodOf search.service:searchService
         *
         * @description
         * Creates a SPARQL query that selects all subjects, predicates, and objects that match
         * multiple keywords searches and/or multiple type declarations combined either using
         * boolean operator AND or OR.
         *
         * @param {Object} queryConfig A configuration object for the query string
         * @param {string[]} [queryConfig.keywords=[]] An array of keywords to search for
         * @param {boolean} [queryConfig.isOrKeywords=false] Whether or not the keyword search results should be combined with OR or not
         * @param {string[]} [queryConfig.types=[]] An array of types to search for
         * @param {boolean} [queryConfig.isOrTypes=false] Whether or not the type search results should be combined with OR or not
         * @param {Object[]} queryConfig.filters An array of property filters to apply to the query
         * @return {string} A SPARQL query string
         */
        self.createQueryString = function(queryConfig) {
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
                            separator: '<br>'
                        },
                        variable: '?Objects'
                    }
                ],
                group: [{ expression: '?Subject' }, { expression: '?Predicate' }],
                distinct: true,
                where: []
            };
            if (_.get(queryConfig, 'keywords', []).length) {
                if (_.get(queryConfig, 'isOrKeywords', false)) {
                    var obj = {type: 'union', patterns: _.map(queryConfig.keywords, createKeywordQuery)};
                    query.where.push(obj);
                } else {
                    query.where = _.map(queryConfig.keywords, createKeywordQuery);
                }
            }
            if (_.get(queryConfig, 'types', []).length) {
                if (_.get(queryConfig, 'isOrTypes', false)) {
                    var obj = {type: 'union', patterns: _.map(queryConfig.types, createTypeQuery)};
                    query.where.push(obj);
                } else {
                    query.where = _.concat(query.where, _.map(queryConfig.types, createTypeQuery));
                }
            }
            if (_.get(queryConfig, 'filters', []).length) {
                var obj = {type: 'union', patterns: queryConfig.filters};
                query.where.push(obj);
            }
            if (!query.where.length) {
                query.where.push(angular.copy(simplePattern));
            }
            var generator = new sparqljs.Generator();
            return generator.stringify(query);
        }
        /**
         * @ngdoc method
         * @name createExistenceQuery
         * @methodOf search.service:searchService
         *
         * @description
         * Creates a part of a SPARQL query that selects all subjects, predicates, and objects
         * for entities that have the provided predicate.
         *
         * @param {string} predicate The predicate's existence which is being searched for
         * @return {Object} A part of a SPARQL query object
         */
        self.createExistenceQuery = function(predicate) {
            var existencePattern = createPattern('?Subject', predicate, '?o');
            return {
                type: 'group',
                patterns: [existencePattern, angular.copy(simplePattern)]
            };
        }
        /**
         * @ngdoc method
         * @name createContainsQuery
         * @methodOf search.service:searchService
         *
         * @description
         * Creates a part of a SPARQL query that selects all subjects, predicates, and objects
         * for entities that have the provided predicate and contains the provided keyword.
         *
         * @param {string} predicate The predicate's existence which is being searched for
         * @param {string} keyword The keyword to filter results by
         * @return {Object} A part of a SPARQL query object
         */
        self.createContainsQuery = function(predicate, keyword) {
            var containsPattern = createPattern('?Subject', predicate, '?o');
            return {
                type: 'group',
                patterns: [containsPattern, createKeywordFilter(keyword)]
            };
        }
        /**
         * @ngdoc method
         * @name createExactQuery
         * @methodOf search.service:searchService
         *
         * @description
         * Creates a part of a SPARQL query that selects all subjects, predicates, and objects
         * for entities that have the provided predicate and exactly matches the provided keyword.
         *
         * @param {string} predicate The predicate's existence which is being searched for
         * @param {string} keyword The keyword to filter results by
         * @param {string} range The range of the keyword
         * @return {Object} A part of a SPARQL query object
         */
        self.createExactQuery = function(predicate, keyword, range) {
            var exactPattern = createPattern('?Subject', predicate, '"' + keyword + '"^^' + range);
            return {
                type: 'group',
                patterns: [exactPattern, angular.copy(simplePattern)]
            };
        }
        /**
         * @ngdoc method
         * @name createRegexQuery
         * @methodOf search.service:searchService
         *
         * @description
         * Creates a part of a SPARQL query that selects all subjects, predicates, and objects
         * for entities that have the provided predicate and matches the provided regex.
         *
         * @param {string} predicate The predicate's existence which is being searched for
         * @param {string} regex The regex to filter results by
         * @return {Object} A part of a SPARQL query object
         */
        self.createRegexQuery = function(predicate, regex) {
            var regexPattern = createPattern('?Subject', predicate, '?o');
            var regexFilter = createFilter({
                type: 'operation',
                operator: 'regex',
                args: ['?o', '\"' + regex.toString() + '\"']
            });
            return {
                type: 'group',
                patterns: [regexPattern, regexFilter]
            };
        }
        /**
         * @ngdoc method
         * @name createRangeQuery
         * @methodOf search.service:searchService
         *
         * @description
         * Creates a part of a SPARQL query that selects all subjects, predicates, and objects
         * for entities that have the provided predicate and are within the configured range.
         *
         * @param {string} predicate The predicate's existence which is being searched for
         * @param {Object} rangeConfig The range configuration
         * @param {string} rangeConfig.lessThan The value that the result must be less than
         * @param {string} rangeConfig.lessThanOrEqualTo The value that the result must be less than or equal to
         * @param {string} rangeConfig.greaterThan The value that the result must be greater than
         * @param {string} rangeConfig.greaterThanOrEqualTo The value that the result must be greater than or equal to
         * @return {Object} A part of a SPARQL query object
         */
        self.createRangeQuery = function(predicate, rangeConfig) {
            var rangePattern = createPattern('?Subject', predicate, '?o');
            var patterns = [rangePattern];
            if (_.has(rangeConfig, 'lessThan')) {
                patterns.push(createFilter('?o < ' + rangeConfig.lessThan));
            }
            if (_.has(rangeConfig, 'lessThanOrEqualTo')) {
                patterns.push(createFilter('?o <= ' + rangeConfig.lessThanOrEqualTo));
            }
            if (_.has(rangeConfig, 'greaterThan')) {
                patterns.push(createFilter('?o > ' + rangeConfig.greaterThan));
            }
            if (_.has(rangeConfig, 'greaterThanOrEqualTo')) {
                patterns.push(createFilter('?o >= ' + rangeConfig.greaterThanOrEqualTo));
            }
            return { type: 'group', patterns };
        }
        /**
         * @ngdoc method
         * @name createExactQuery
         * @methodOf search.service:searchService
         *
         * @description
         * Creates a part of a SPARQL query that selects all subjects, predicates, and objects
         * for entities that have the provided predicate and and exactly matches the provided boolean value.
         *
         * @param {string} predicate The predicate's existence which is being searched for
         * @param {boolean} value The value which is being searched for
         * @return {Object} A part of a SPARQL query object
         */
        self.createBooleanQuery = function(predicate, value) {
            var values = value ? [true, 1] : [false, 0];
            var booleanPattern = createPattern('?Subject', predicate, '?o');
            var booleanFilter = createFilter({
                type: 'operation',
                operator: 'in',
                args: ['?o', _.map(values, value => '"' + value + '"^^' + prefixes.xsd + 'boolean')]
            });
            return {
                type: 'group',
                patterns: [booleanPattern, angular.copy(simplePattern), booleanFilter]
            };
        }

        function createKeywordQuery(keyword) {
            return {
                type: 'group',
                patterns: [angular.copy(simplePattern), createKeywordFilter(keyword)]
            };
        }

        function createTypeQuery(item) {
            var typePattern = createPattern('?Subject', prefixes.rdf + 'type', item.classIRI);
            return {
                type: 'group',
                patterns: [typePattern, angular.copy(simplePattern)]
            };
        }

        function createKeywordFilter(keyword) {
            return createFilter({
                type: 'operation',
                operator: 'contains',
                args: [{
                    type: 'operation',
                    operator: 'lcase',
                    args: ['?o']
                }, {
                    type: 'operation',
                    operator: 'lcase',
                    args: ['\"' + keyword + '\"']
                }]
            });
        }

        function createPattern(subject, predicate, object) {
            return {
                type: 'bgp',
                triples: [{ subject, predicate, object }]
            };
        }

        function createFilter(expression) {
            return { type: 'filter', expression };
        }
    }
})();
