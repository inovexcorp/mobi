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
/* global _ */

(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name datasetManager
         *
         * @description
         * The `datasetManager` module only provides the `datasetManagerService` service which provides access
         * to the MatOnto Dataset REST endpoints.
         */
        .module('datasetManager', [])
        /**
         * @ngdoc service
         * @name datasetManager.service:datasetManagerService
         * @requires $http
         * @requires $q
         * @requires util.service:utilService
         * @requires prefixes.service:prefixes
         * @requires discoverState.service:discoverStateService
         *
         * @description
         * `datasetManagerService` is a service that provides access to the MatOnto Dataset REST endpoints.
         */
        .service('datasetManagerService', datasetManagerService);

        datasetManagerService.$inject = ['$http', '$q', 'utilService', 'prefixes', 'discoverStateService', 'catalogManagerService'];

        function datasetManagerService($http, $q, utilService, prefixes, discoverStateService, catalogManagerService) {
            var self = this,
                util = utilService,
                ds = discoverStateService,
                cm = catalogManagerService,
                prefix = '/matontorest/datasets';

            /**
             * @ngdoc property
             * @name datasetRecords
             * @propertyOf datasetManager.service:datasetManagerService
             * @type {Object[]}
             * 
             * @description
             * 'datasetRecords' holds an array of dataset record objects which contain properties for the metadata
             * associated with that record.
             */
            self.datasetRecords = [];

            /**
             * @ngdoc method
             * @name getDatasetRecords
             * @methodOf datasetManager.service:datasetManagerService
             *
             * @description
             * Calls the GET /matontorest/datasets endpoint to collect a list of the DatasetRecords in MatOnto.
             * Can optionally be paged and sorted through the properties in the passed `paginatedConfig` object.
             * Returns a response with the list of DatasetRecords in the data and any extra pagination information
             * in the headers.
             *
             * @param {Object} paginatedConfig A configuration object for paginated requests
             * @param {number} paginatedConfig.pageIndex The index of the page of results to retrieve
             * @param {number} paginatedConfig.limit The number of results per page
             * @param {Object} paginatedConfig.sortOption An object representing a sort preference
             * @param {string} paginatedConfig.sortOption.field A property IRI to sort the DatasetRecords by
             * @param {string} paginatedConfig.sortOption.asc Whether the list should be sorted ascending or descending
             * @return {Promise} A promise that either resolves with the response of the endpoint or is rejected with an
             * error message
             */
            self.getDatasetRecords = function(paginatedConfig) {
                var config = {
                        params: util.paginatedConfigToParams(paginatedConfig)
                    };
                if (_.get(paginatedConfig, 'searchText')) {
                    config.params.searchText = paginatedConfig.searchText;
                }
                return $http.get(prefix, config)
                    .then($q.when, util.rejectError);
            }

            /**
             * @ngdoc method
             * @name getDatasetRecord
             * @methodOf datasetManager.service:datasetManagerService
             *
             * @description
             * Calls the GET /matontorest/datasets/{datasetRecordIRI} endpoint to get the DatasetRecord associated
             * with the provided ID.
             *
             * @return {Promise} A promise that either resolves with the response of the endpoint or is rejected with an
             * error message
             */
            self.getDatasetRecord = function(datasetRecordIRI) {
                return $http.get(prefix + '/' + encodeURIComponent(datasetRecordIRI))
                    .then(response => response.data, util.rejectError);
            }

            /**
             * @ngdoc method
             * @name createDatasetRecord
             * @methodOf datasetManager.service:datasetManagerService
             *
             * @description
             * Calls POST /matontorest/datasets endpoint with the passed metadata and creates a new DatasetRecord and
             * associated Dataset. Returns a Promise with the IRI of the new DatasetRecord if successful or rejects
             * with an error message.
             *
             * @param {Object} recordConfig A configuration object containing metadata for the new Record
             * @param {string} recordConfig.title The required title of the new DatasetRecord
             * @param {string} recordConfig.repository The required id of the repository to add the Dataset to
             * @param {string} recordConfig.datasetIRI The optional IRI for the new Dataset
             * @param {string} recordConfig.description The optional description of the new Record
             * @param {string[]} recordConfig.keywords The optional keywords to associate with the new Record.
             * @param {string[]} recordConfig.ontologies The optional OntologyRecord ids to associate with the new
             * Record.
             * @return {Promise} A Promise that resolves to the IRI of the new DatasetRecord or is rejected with an
             * error message
             */
            self.createDatasetRecord = function(recordConfig) {
                var fd = new FormData(),
                    config = {
                        transformRequest: angular.identity,
                        headers: {
                            'Content-Type': undefined
                        }
                    };
                fd.append('title', recordConfig.title);
                fd.append('repositoryId', recordConfig.repositoryId);
                if (_.has(recordConfig, 'datasetIRI')) {
                    fd.append('datasetIRI', recordConfig.datasetIRI);
                }
                if (_.has(recordConfig, 'description')) {
                    fd.append('description', recordConfig.description);
                }
                if (_.get(recordConfig, 'keywords', []).length > 0) {
                    fd.append('keywords', _.join(recordConfig.keywords, ','));
                }
                _.forEach(_.get(recordConfig, 'ontologies', []), id => fd.append('ontologies', id));
                return $http.post(prefix, fd, config)
                    .then(response => self.getDatasetRecord(response.data), $q.reject)
                    .then(response => {
                        self.datasetRecords.push(response);
                        self.datasetRecords = _.orderBy(self.datasetRecords, array => util.getDctermsValue(_.find(array, '@type'), 'title'));
                        return response['@id'];
                    }, util.rejectError);
            }

            /**
             * @ngdoc method
             * @name deleteDatasetRecord
             * @methodOf datasetManager.service:datasetManagerService
             *
             * @description
             * Calls the DELETE /matontorest/datasets/{datasetRecordId} endpoint and removes the identified DatasetRecord
             * and its associated Dataset and named graphs from MatOnto. By default, only removes named graphs that are not
             * used by other Datasets, but can be forced to delete them by passed in a boolean. Returns a Promise indicating
             * the success of the request.
             *
             * @param {string} datasetRecordIRI The IRI of the DatasetRecord to delete
             * @param {boolean=false} force Whether or not the delete should be forced
             * @return {Promise} A Promise that resolves if the delete was successful; rejects with an error message otherwise
             */
            self.deleteDatasetRecord = function(datasetRecordIRI, force = false) {
                var config = {params: {force}};
                return $http.delete(prefix + '/' + encodeURIComponent(datasetRecordIRI), config)
                    .then(() => {
                        ds.cleanUpOnDatasetDelete(datasetRecordIRI);
                        removeDataset(datasetRecordIRI);
                    }, util.rejectError);
            }

            /**
             * @ngdoc method
             * @name clearDatasetRecord
             * @methodOf datasetManager.service:datasetManagerService
             *
             * @description
             * Calls the DELETE /matontorest/datasets/{datasetRecordId}/data endpoint and removes the named graphs of the
             * Dataset associated with the identified DatasetRecord from MatOnto. By default, only removes named graphs that
             * are not used by other Datasets, but can be forced to delete them by passed in a boolean. Returns a Promise
             * indicating the success of the request.
             *
             * @param {string} datasetRecordIRI The IRI of the DatasetRecord whose Dataset named graphs should be deleted
             * @param {boolean=false} force Whether or not the delete should be forced
             * @return {Promise} A Promise that resolves if the delete was successful; rejects with an error message otherwise
             */
            self.clearDatasetRecord = function(datasetRecordIRI, force = false) {
                var config = {params: {force}};
                return $http.delete(prefix + '/' + encodeURIComponent(datasetRecordIRI) + '/data', config)
                    .then(() => {
                        ds.cleanUpOnDatasetClear(datasetRecordIRI);
                    }, util.rejectError);
            }
            
            /**
             * @ngdoc method
             * @name updateDatasetRecord
             * @methodOf datasetManager.service:datasetManagerService
             *
             * @description
             * Calls the updateRecord method of the CatalogManager to update the dataset record provided in the JSON-LD. 
             * If successful: it then updates the appropriate dataset record in datasetRecords. Returns a Promise
             * indicating the success of the request.
             * 
             * @param {string} datasetRecordIRI The IRI of the DatasetRecord whose Dataset named graphs should be updated.
             * @param {string} catalogIRI The IRI of the catalog to which the DatasetRecord belongs.
             * @param {Object[]} jsonld An array containing the JSON-LD DatasetRecord with it's associated Ontology information.
             * @return {Promise} A Promise that resolves if the update was successful; rejects with an error message otherwise
             */
            self.updateDatasetRecord = function(datasetRecordIRI, catalogIRI, jsonld) {
                return cm.updateRecord(datasetRecordIRI, catalogIRI, jsonld).then(() => {
                    removeDataset(datasetRecordIRI);
                    self.datasetRecords.push(jsonld);
                }, $q.reject);
            }

            /**
             * @ngdoc method
             * @name initialize
             * @methodOf datasetManager.service:datasetManagerService
             *
             * @description
             * Populates the 'datasetRecords' with results from the 'getDatasetRecords' method. If that method results in an error,
             * an error toast will be displayed.
             */
            self.initialize = function() {
                var paginatedConfig = {
                    sortOption: {
                        field: prefixes.dcterms + 'title'
                    }
                }
                self.getDatasetRecords(paginatedConfig)
                    .then(response => {
                        self.datasetRecords = response.data;
                    }, util.createErrorToast);
            }

            function removeDataset(datasetRecordIRI) {
                _.remove(self.datasetRecords, array => _.find(array, {'@id': datasetRecordIRI}));
            }
        }
})();
