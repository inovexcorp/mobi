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
         * @name analyticState
         *
         * @description
         * The `analyticState` module only provides the `analyticStateService` service which
         * contains various variables to hold the state of the analytic module along with some
         * utility functions for those variables.
         */
        .module('analyticState', [])
        /**
         * @ngdoc service
         * @name analyticState.service:analyticStateService
         * @requires $q
         * @requires datasetManager.service:datasetManagerService
         * @requires httpService.service:httpService
         * @requires ontologyManager.service:ontologyManagerService
         * @requires prefixes.service:prefixes
         * @requires sparqlManager.service:sparqlManagerService
         * @requires util.service:utilService
         *
         * @description
         * `analyticStateService` is a service which contains various variables to hold the
         * state of the analytic module along with some utility functions for those variables.
         */
        .service('analyticStateService', analyticStateService);
        
        analyticStateService.$inject = ['$q', 'datasetManagerService', 'httpService', 'ontologyManagerService', 'prefixes', 'sparqlManagerService', 'utilService'];
        
        function analyticStateService($q, datasetManagerService, httpService, ontologyManagerService, prefixes, sparqlManagerService, utilService) {
            var self = this;
            var subject = '?s';
            var sm = sparqlManagerService;
            var util = utilService;
            var om = ontologyManagerService;
            var dm = datasetManagerService;
            
            /**
             * @ngdoc property
             * @name landing
             * @propertyOf analyticState.service:analyticStateService
             * @type {boolean}
             *
             * @description
             * 'landing' is a boolean value indicating whether the landing page is shown.
             */
            self.landing = true;
            
            /**
             * @ngdoc property
             * @name editor
             * @propertyOf analyticState.service:analyticStateService
             * @type {boolean}
             *
             * @description
             * 'editor' is a boolean value indicating whether the editor page is shown.
             */
            self.editor = false;
            
            /**
             * @ngdoc property
             * @name datasets
             * @propertyOf analyticState.service:analyticStateService
             * @type {Object[]}
             *
             * @description
             * 'datasets' is an array containing the selected datasets.
             */
            self.datasets = [];
            
            /**
             * @ngdoc property
             * @name classes
             * @propertyOf analyticState.service:analyticStateService
             * @type {Object[]}
             *
             * @description
             * 'classes' is an array containing the classes from ontologies associated
             * with the selected datasets.
             */
            self.classes = [];
            
            /**
             * @ngdoc property
             * @name defaultProperties
             * @propertyOf analyticState.service:analyticStateService
             * @type {Object[]}
             *
             * @description
             * 'defaultProperties' is an array containing the default properties that all
             * analytics can use.
             */
            self.defaultProperties = [{
                '@id': prefixes.dcterms + 'title'
            }, {
                '@id': prefixes.dcterms + 'description'
            }, {
                '@id': prefixes.rdfs + 'label'
            }, {
                '@id': prefixes.rdfs + 'comment'
            }];

            /**
             * @ngdoc property
             * @name properties
             * @propertyOf analyticState.service:analyticStateService
             * @type {Object[]}
             *
             * @description
             * 'properties' is an array containing the properties from ontologies associated
             * with the selected datasets.
             */
            self.properties = [];
            
            /**
             * @ngdoc property
             * @name selectedClass
             * @propertyOf analyticState.service:analyticStateService
             * @type {Object}
             *
             * @description
             * 'selectedClass' is an object containing the class that has been dragged out
             * to the analytic editor section.
             */
            self.selectedClass = undefined;
            
            /**
             * @ngdoc property
             * @name enabledProperties
             * @propertyOf analyticState.service:analyticStateService
             * @type {Object[]}
             *
             * @description
             * 'enabledProperties' is an array containing the properties from ontologies associated
             * with the selected datasets that have a domain of the selectedClass.
             */
            self.enabledProperties = [];
            
            /**
             * @ngdoc property
             * @name selectedProperties
             * @propertyOf analyticState.service:analyticStateService
             * @type {Object[]}
             *
             * @description
             * 'selectedProperties' is an array containing the properties that have been dragged
             * out to the editor section.from ontologies associated.
             */
            self.selectedProperties = [];
            
            /**
             * @ngdoc property
             * @name results
             * @propertyOf analyticState.service:analyticStateService
             * @type {Object}
             *
             * @description
             * 'results' is an object containing the results of the generated SPARQL query.
             * The structure of the object is:
             * ```
             * {
             *     bindings: [],
             *     data: []
             * }
             * ```
             */
            self.results = undefined;
            
            /**
             * @ngdoc property
             * @name variables
             * @propertyOf analyticState.service:analyticStateService
             * @type {Object}
             *
             * @description
             * 'variables' is an object which contains the key value pairs for matching up the SPARQL query
             * variable names and their display text.
             */
            self.variables = {};
            
            /**
             * @ngdoc property
             * @name spinnerId
             * @propertyOf analyticState.service:analyticStateService
             * @type {string}
             *
             * @description
             * 'spinnerId' is a string which identifies the targeted spinner for the SPARQL query.
             */
            self.spinnerId = 'analytic-spinner';
            
            /**
             * @ngdoc property
             * @name queryError
             * @propertyOf analyticState.service:analyticStateService
             * @type {string}
             *
             * @description
             * 'queryError' is a string which includes the error message if the query failed.
             */
            self.queryError = '';
            
            /**
             * @ngdoc property
             * @name currentPage
             * @propertyOf analyticState.service:analyticStateService
             * @type {number}
             *
             * @description
             * 'currentPage' is a number indicating which page is currently shown.
             */
            self.currentPage = 0;
            
            /**
             * @ngdoc property
             * @name totalSize
             * @propertyOf analyticState.service:analyticStateService
             * @type {number}
             *
             * @description
             * 'totalSize' is a number indicating the total size of the query results.
             */
            self.totalSize = 0;
            
            /**
             * @ngdoc property
             * @name limit
             * @propertyOf analyticState.service:analyticStateService
             * @type {number}
             *
             * @description
             * 'limit' is a number which limits how many query results are returned.
             */
            self.limit = 100;
            
            /**
             * @ngdoc property
             * @name links
             * @propertyOf analyticState.service:analyticStateService
             * @type {Object}
             *
             * @description
             * 'links' is an object which contains the links to the next and previous page of the results.
             */
            self.links = {};
            
            /**
             * @ngdoc property
             * @name query
             * @propertyOf analyticState.service:analyticStateService
             * @type {Object}
             *
             * @description
             * 'query' is an object which contains the JSON object which represents the query that will be
             * executed to create the analytic.
             */
            self.query = {};
            
            /**
             * @ngdoc property
             * @name record
             * @propertyOf analyticState.service:analyticStateService
             * @type {Object}
             *
             * @description
             * 'record' is an object containing the metadata for the analytic record to create. The structure
             * of the object is:
             * ```
             * {
             *     title: '',
             *     description: '',
             *     keywords: []
             * }
             * ```
             */
            self.record = {};
            
            /**
             * @ngdoc method
             * @name showEditor
             * @methodOf analyticState.service:analyticStateService
             *
             * @description
             * Sets the correct variables to show the editor page.
             */
            self.showEditor = function() {
                self.landing = false;
                self.editor = true;
            }
            
            /**
             * @ngdoc method
             * @name showLanding
             * @methodOf analyticState.service:analyticStateService
             *
             * @description
             * Sets the correct variables to show the langing page and resets the state.
             */
            self.showLanding = function() {
                self.datasets = [];
                self.classes = [];
                self.properties = [];
                self.selectedClass = undefined;
                self.enabledProperties = [];
                self.selectedProperties = [];
                self.results = undefined;
                self.variables = {};
                self.queryError = '';
                self.currentPage = 0;
                self.totalSize = 0;
                self.limit = 100;
                self.links = {};
                self.query = {};
                self.landing = true;
                self.editor = false;
            }
            
            /**
             * @ngdoc method
             * @name resetSelected
             * @methodOf analyticState.service:analyticStateService
             *
             * @description
             * Resets the selected variables to their original values.
             */
            self.resetSelected = function() {
                self.selectedClass = undefined;
                self.selectedProperties = [];
            }
            
            /**
             * @ngdoc method
             * @name selectClass
             * @methodOf analyticState.service:analyticStateService
             *
             * @description
             * Sets the selectedClass based on the provided data, removes that class from the list of available
             * classes, and resets the selectedProperties variable.
             *
             * @param {Object} data The data which corresponds to a class in the classes list.
             */
            self.selectClass = function(data) {
                self.results = undefined;
                self.queryError = '';
                if (self.selectedClass) {
                    self.classes.push(angular.copy(self.selectedClass));
                }
                self.selectedClass = _.remove(self.classes, data)[0];
                self.properties = _.concat(self.properties, angular.copy(self.selectedProperties));
                self.selectedProperties = [];
            }
            
            /**
             * @ngdoc method
             * @name selectProperty
             * @methodOf analyticState.service:analyticStateService
             *
             * @description
             * Adds the property based on the provided data to the selectedProperties array and gets the paged
             * results based on the selected entities.
             *
             * @param {Object} data The data which corresponds to a property in the properties list.
             */
            self.selectProperty = function(data) {
                self.selectedProperties.push(_.remove(self.properties, data)[0]);
                getPagedResults(self.createQueryString());
            }
            
            /**
             * @ngdoc method
             * @name removeProperty
             * @methodOf analyticState.service:analyticStateService
             *
             * @description
             * Removes the property based on the provided data from the selectedProperties array and gets the paged
             * results based on the selected entities.
             *
             * @param {Object} data The data which corresponds to a property in the properties list.
             */
            self.removeProperty = function(data) {
                self.properties.push(angular.copy(data));
                if (self.selectedProperties.length) {
                    getPagedResults(self.createQueryString());
                } else {
                    self.results = undefined;
                }
            }

            /**
             * @ngdoc method
             * @name isSaveable
             * @methodOf analyticState.service:analyticStateService
             *
             * @description
             * Checks to see if the analytic state is saveable.
             *
             * @returns {boolean} True if the state is saveable; otherwise, false.
             */
            self.isSaveable = function() {
                return self.selectedClass && self.selectedProperties.length;
            }

            /**
             * @ngdoc method
             * @name createQueryString
             * @methodOf analyticState.service:analyticStateService
             *
             * @description
             * Creates the query string based on the details of the state variables.
             *
             * @returns {string} The query string created from the state variables.
             */
            self.createQueryString = function() {
                self.variables = {};
                var query = {
                    type: 'query',
                    prefixes: {},
                    queryType: 'SELECT',
                    group: [{ expression: subject }],
                    distinct: true,
                    variables: [],
                    where: [createPattern(subject, prefixes.rdf + 'type', self.selectedClass.id)]
                };
                if (_.has(self.query, 'order')) {
                    query.order = angular.copy(self.query.order);
                }
                var variable;
                var index = 0;
                var patterns = [];
                _.forEach(self.selectedProperties, property => {
                    variable = 'var' + index++;
                    _.set(self.variables, variable + 's', property.title);
                    variable = '?' + variable;
                    query.variables.push(createVariableExpression(variable));
                    patterns.push(createPattern(subject, property.id, variable));
                });
                query.where.push({type: 'union', patterns});
                self.query = query;
                var generator = new sparqljs.Generator();
                return generator.stringify(query);
            }
            
            /**
             * @ngdoc method
             * @name getPage
             * @methodOf analyticState.service:analyticStateService
             *
             * @description
             * Gets the next or previous page of results and updates the paginated variables to reflect
             * that change.
             *
             * @param {string} direction The direction, either next or prev, of the page that you want to get.
             */
            self.getPage = function(direction) {
                var isNext = direction === 'next';
                var url = isNext ? self.links.next : self.links.prev;
                httpService.get(url, undefined, self.spinnerId)
                    .then(response => {
                        self.currentPage = isNext ? self.currentPage + 1 : self.currentPage - 1;
                        onPagedSuccess(response);
                    }, onPagedError);
            }
            
            /**
             * @ngdoc method
             * @name sortResults
             * @methodOf analyticState.service:analyticStateService
             *
             * @description
             * Adjusts the query to sort by a specific expression either ascending or descending.
             *
             * @param {string} expression The expression for the variable that you want to sort by (e.g. ?var0).
             * @param {boolean} [descending=false] The variable indicating whether or not you want the results in
             * descending order.
             */
            self.sortResults = function(expression, descending = false) {
                self.query.order = [{expression, descending}];
                var generator = new sparqljs.Generator();
                getPagedResults(generator.stringify(self.query));
            }
            
            /**
             * @ngdoc method
             * @name reorderColumns
             * @methodOf analyticState.service:analyticStateService
             *
             * @description
             * Reorders the columns associated with the table in the analytic state.
             *
             * @param {number} from The index of the thing you want to move.
             * @param {number} to The index of the place you want to move the thing to.
             */
            self.reorderColumns = function(from, to) {
                if (to !== from && _.get(self.results, 'bindings', []).length && self.selectedProperties.length && _.get(self.query, 'variables', []).length) {
                    move(self.selectedProperties, from, to);
                    move(self.results.bindings, from, to);
                    move(self.query.variables, from, to);
                }
            }
            
            /**
             * @ngdoc method
             * @name setClassesAndProperties
             * @methodOf analyticState.service:analyticStateService
             *
             * @description
             * Sets the classes and properties array based on selected dataset.
             *
             * @return {Promise} A promise that indicates the success of the function
             */
            self.setClassesAndProperties = function() {
                var allOntologies = _.flatten(_.map(self.datasets, dataset => dataset.ontologies));
                return $q.all(_.map(allOntologies, ontology => om.getOntology(ontology.recordId, ontology.branchId, ontology.commitId)))
                    .then(response => {
                        self.classes = _.map(om.getClasses(response), clazz => ({
                            id: clazz['@id'],
                            title: om.getEntityName(clazz)
                        }));
                        self.properties = _.map(_.concat(self.defaultProperties, om.getObjectProperties(response), om.getDataTypeProperties(response)), property => ({
                            id: property['@id'],
                            title: om.getEntityName(property),
                            classes: _.has(property, prefixes.rdfs + 'domain') ? _.map(_.get(property, prefixes.rdfs + 'domain'), '@id') : _.map(self.classes, 'id')
                        }));
                        return $q.resolve();
                    }, $q.reject);
            }
            
            /**
             * @ngdoc method
             * @name populateEditor
             * @methodOf analyticState.service:analyticStateService
             *
             * @description
             * Populates the correct state variables to prepare for editing the identified analyticRecord.
             *
             * @param {Object[]} analyticRecord The analytic's JSON-LD which contains an AnalyticRecord
             * and Configuration.
             * @return {Promise} A promise indicating the success of the state setup
             */
            self.populateEditor = function(analyticRecord) {
                var configuration = _.find(analyticRecord, obj => _.includes(_.get(obj, '@type', []), prefixes.analytic + 'Configuration'));
                var datasetRecordId = util.getPropertyId(configuration, prefixes.analytic + 'datasetRecord');
                var datasetRecord = {};
                var dataset = _.find(dm.datasetRecords, arr => {
                    datasetRecord = _.find(arr, '@type');
                    return _.get(record, '@id') === datasetRecordId;
                });
                var ontologies = self.getOntologies(dataset, datasetRecord);
                self.datasets = [{id: record['@id'], ontologies}];
                var classId = util.getPropertyId(configuration, prefixes.analytic + 'row');
                var propertyIds = _.map(_.get(configuration, prefixes.analytic + 'column', []), '@id');
                return self.setClassesAndProperties()
                    .then(() => {
                        self.selectedClass = _.remove(self.classes, {id: classId})[0];
                        _.forEach(propertyIds, propertyId => {
                            self.selectedProperties.push(_.remove(self.properties, {id: propertyId})[0]);
                        });
                        getPagedResults(self.createQueryString());
                        return $q.resolve();
                    }, $q.reject);
            }
            
            /**
             * @ngdoc method
             * @name getOntologies
             * @methodOf analyticState.service:analyticStateService
             *
             * @description
             * Gets a simplified ontologies list from the provided dataset.
             *
             * @param {Object[]} dataset The dataset's JSON-LD which contains a DatasetRecord and OntologyIdentifiers.
             * @param {Object} record The record within the dataset's JSON-LD to be excluded from the operation.
             * @return {Object[]} An Array of ontologies with recordId, branchId, and commitId properties
             */
            self.getOntologies = function(dataset, record) {
                return _.map(_.without(dataset, record), identifier => ({
                    recordId: util.getPropertyId(identifier, prefixes.dataset + 'linksToRecord'),
                    branchId: util.getPropertyId(identifier, prefixes.dataset + 'linksToBranch'),
                    commitId: util.getPropertyId(identifier, prefixes.dataset + 'linksToCommit')
                }));
            }
            
            function move(arr, from, to) {
                arr.splice(to, 0, _.pullAt(arr, from)[0]);
            }
            
            function createPattern(subject, predicate, object) {
                return {
                    type: 'bgp',
                    triples: [{ subject, predicate, object }]
                };
            }
            
            function createVariableExpression(variable) {
                return {
                    expression: {
                        expression: variable,
                        type: 'aggregate',
                        aggregation: 'group_concat',
                        distinct: true,
                        separator: '<br>'
                    },
                    variable: variable + 's'
                };
            }
            
            function getPagedResults(query) {
                httpService.cancel(self.spinnerId);
                self.currentPage = 0;
                var paramObj = {
                    datasetRecordIRI: self.datasets[0].id,
                    id: self.spinnerId,
                    page: self.currentPage,
                    limit: self.limit
                };
                sm.pagedQuery(query, paramObj)
                    .then(onPagedSuccess, onPagedError);
            }
            
            function onPagedSuccess(response) {
                self.queryError = '';
                self.results = response.data;
                var headers = response.headers();
                self.totalSize = _.get(headers, 'x-total-count', 0);
                var links = util.parseLinks(_.get(headers, 'link', ''));
                self.links.prev = _.get(links, 'prev', '');
                self.links.next = _.get(links, 'next', '');
            }
            
            function onPagedError(errorMessage) {
                self.results = undefined;
                self.queryError = errorMessage;
            }
        }
})();