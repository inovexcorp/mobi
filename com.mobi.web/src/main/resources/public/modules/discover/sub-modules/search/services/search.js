/*-
 * #%L
 * com.mobi.web
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
        var index = 0;
        var variables = {};

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
         * @param {Object} queryConfig.variables The object that will be set by this function to link the query variables with their labels
         * @return {string} A SPARQL query string
         */
        self.createQueryString = function(queryConfig) {
            index = 0;
            variables = {};
            var query = {
                type: 'query',
                prefixes: {},
                queryType: 'SELECT',
                group: [{ expression: '?Entity' }],
                distinct: true,
                where: []
            };
            if (_.get(queryConfig, 'keywords', []).length) {
                if (_.get(queryConfig, 'isOrKeywords', false)) {
                    var obj = {type: 'union', patterns: _.map(queryConfig.keywords, keyword => createKeywordQuery(keyword))};
                    query.where.push(obj);
                } else {
                    query.where = _.map(queryConfig.keywords, keyword => createKeywordQuery(keyword));
                }
            }
            if (_.get(queryConfig, 'types', []).length) {
                if (_.get(queryConfig, 'isOrTypes', false)) {
                    var obj = {type: 'union', patterns: _.map(queryConfig.types, type => createTypeQuery(type))};
                    query.where.push(obj);
                } else {
                    query.where = _.concat(query.where, _.map(queryConfig.types, type => createTypeQuery(type)));
                }
            }
            if (_.get(queryConfig, 'filters', []).length) {
                query.where = _.concat(query.where, _.map(queryConfig.filters, getQueryPart));
            }
            query.variables = _.concat(['?Entity'], _.map(_.keys(variables), createVariableExpression));
            queryConfig.variables = _.assign({Entity: 'Entity'}, variables);
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
         * @param {string} variable The variable name to use in the query
         * @param {string} label The label to identify this variable
         * @return {Object} A part of a SPARQL query object
         */
        self.createExistenceQuery = function(predicate, label) {
            var existencePattern = createPattern('?Entity', predicate, getNextVariable(label));
            return {
                type: 'group',
                patterns: [existencePattern]
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
         * @param {string} variable The variable name to use in the query
         * @param {string} label The label to identify this variable
         * @return {Object} A part of a SPARQL query object
         */
        self.createContainsQuery = function(predicate, keyword, label) {
            var variable = getNextVariable(label);
            var containsPattern = createPattern('?Entity', predicate, variable);
            return {
                type: 'group',
                patterns: [containsPattern, createKeywordFilter(keyword, variable)]
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
         * @param {string} variable The variable name to use in the query
         * @param {string} label The label to identify this variable
         * @return {Object} A part of a SPARQL query object
         */
        self.createExactQuery = function(predicate, keyword, range, label) {
            var variable = getNextVariable(label);
            var exactPattern = createPattern('?Entity', predicate, variable);
            var exactFilter = createFilter({
                type: 'operation',
                operator: '=',
                args: [variable, '"' + keyword + '"^^' + range]
            });
            return {
                type: 'group',
                patterns: [exactPattern, exactFilter]
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
         * @param {string} variable The variable name to use in the query
         * @param {string} label The label to identify this variable
         * @return {Object} A part of a SPARQL query object
         */
        self.createRegexQuery = function(predicate, regex, label) {
            var variable = getNextVariable(label);
            var regexPattern = createPattern('?Entity', predicate, variable);
            var regexFilter = createFilter({
                type: 'operation',
                operator: 'regex',
                args: [variable, '\"' + regex.toString() + '\"']
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
         * @param {Object} predRange The predicate's range
         * @param {Object} rangeConfig The range configuration
         * @param {string} rangeConfig.lessThan The value that the result must be less than
         * @param {string} rangeConfig.lessThanOrEqualTo The value that the result must be less than or equal to
         * @param {string} rangeConfig.greaterThan The value that the result must be greater than
         * @param {string} rangeConfig.greaterThanOrEqualTo The value that the result must be greater than or equal to
         * @param {string} variable The variable name to use in the query
         * @param {string} label The label to identify this variable
         * @return {Object} A part of a SPARQL query object
         */
        self.createRangeQuery = function(predicate, predRange, rangeConfig, label) {
            var variable = getNextVariable(label);
            var config = angular.copy(rangeConfig);
            var rangePattern = createPattern('?Entity', predicate, variable);
            var patterns = [rangePattern];
            if (util.getInputType(predRange) === 'datetime-local') {
                _.forOwn(config, (value, key) => {
                    config[key] = JSON.stringify(value) + '^^<' + prefixes.xsd + 'dateTime>';
                });
            }
            if (_.has(config, 'lessThan')) {
                patterns.push(createFilter(variable + ' < ' + config.lessThan));
            }
            if (_.has(config, 'lessThanOrEqualTo')) {
                patterns.push(createFilter(variable + ' <= ' + config.lessThanOrEqualTo));
            }
            if (_.has(config, 'greaterThan')) {
                patterns.push(createFilter(variable + ' > ' + config.greaterThan));
            }
            if (_.has(config, 'greaterThanOrEqualTo')) {
                patterns.push(createFilter(variable + ' >= ' + config.greaterThanOrEqualTo));
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
         * for entities that have the provided predicate and exactly matches the provided boolean value.
         *
         * @param {string} predicate The predicate's existence which is being searched for
         * @param {boolean} value The value which is being searched for
         * @param {string} label The label to identify this variable
         * @return {Object} A part of a SPARQL query object
         */
        self.createBooleanQuery = function(predicate, value, label) {
            var variable = getNextVariable(label);
            var values = value ? [true, 1] : [false, 0];
            var booleanPattern = createPattern('?Entity', predicate, variable);
            var booleanFilter = createFilter({
                type: 'operation',
                operator: 'in',
                args: [variable, _.map(values, value => '"' + value + '"^^' + prefixes.xsd + 'boolean')]
            });
            return {
                type: 'group',
                patterns: [booleanPattern, booleanFilter]
            };
        }

        function createKeywordQuery(keyword) {
            var variable = '?Keyword';
            variables.Keywords = 'Keywords';
            return {
                type: 'group',
                patterns: [createPattern('?Entity', '?p', variable), createKeywordFilter(keyword, variable)]
            };
        }

        function createTypeQuery(item) {
            var variable = '?Type';
            variables.Types = 'Types';
            var typePattern = createPattern('?Entity', prefixes.rdf + 'type', item.classIRI);
            return {
                type: 'group',
                patterns: [typePattern, createPattern('?Entity', prefixes.rdf + 'type', variable)]
            };
        }

        function createKeywordFilter(keyword, variable) {
            return createFilter({
                type: 'operation',
                operator: 'contains',
                args: [{
                    type: 'operation',
                    operator: 'lcase',
                    args: [variable]
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
        
        function createVariableExpression(variable) {
            var updated = '?' + variable.slice(0, -1);
            return {
                expression: {
                    expression: updated,
                    type: 'aggregate',
                    aggregation: 'group_concat',
                    distinct: true,
                    separator: '<br>'
                },
                variable: updated + 's'
            };
        }
        
        function createBindOperation(value, variable) {
            return {
                type: 'operation',
                operator: 'bind',
                args: [{
                    type: 'operation',
                    operator: 'as',
                    args: [value, variable]
                }]
            };
        }
        
        function getNextVariable(label) {
            var variable = 'var' + index++;
            _.set(variables, variable + 's', label);
            return '?' + variable;
        }

        function getQueryPart(filter) {
            switch(filter.type) {
                case 'Boolean':
                    return self.createBooleanQuery(filter.predicate, filter.boolean, filter.title);
                case 'Contains':
                    return self.createContainsQuery(filter.predicate, filter.value, filter.title);
                case 'Exact':
                    return self.createExactQuery(filter.predicate, filter.value, filter.range, filter.title);
                case 'Existence':
                    return self.createExistenceQuery(filter.predicate, filter.title);
                case 'Greater than':
                    return self.createRangeQuery(filter.predicate, filter.range, {greaterThan: filter.value}, filter.title);
                case 'Greater than or equal to':
                    return self.createRangeQuery(filter.predicate, filter.range, {greaterThanOrEqualTo: filter.value}, filter.title);
                case 'Less than':
                    return self.createRangeQuery(filter.predicate, filter.range, {lessThan: filter.value}, filter.title);
                case 'Less than or equal to':
                    return self.createRangeQuery(filter.predicate, filter.range, {lessThanOrEqualTo: filter.value}, filter.title);
                case 'Range':
                    return self.createRangeQuery(filter.predicate, filter.range, {
                        greaterThanOrEqualTo: filter.begin,
                        lessThanOrEqualTo: filter.end
                    }, filter.title);
                case 'Regex':
                    return self.createRegexQuery(filter.predicate, filter.regex, filter.title);
            }
        }
    }
})();
