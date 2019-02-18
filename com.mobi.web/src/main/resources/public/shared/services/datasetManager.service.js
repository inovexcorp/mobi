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
         * to the Mobi Dataset REST endpoints.
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
         * `datasetManagerService` is a service that provides access to the Mobi Dataset REST endpoints.
         */
        .service('datasetManagerService', datasetManagerService);

        datasetManagerService.$inject = ['$http', '$q', 'utilService', 'prefixes', 'discoverStateService', 'catalogManagerService', 'httpService', 'REST_PREFIX'];

        function datasetManagerService($http, $q, utilService, prefixes, discoverStateService, catalogManagerService, httpService, REST_PREFIX) {
            var self = this,
                util = utilService,
                ds = discoverStateService,
                cm = catalogManagerService,
                prefix = REST_PREFIX + 'datasets';

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
             * Calls the GET /mobirest/datasets endpoint to collect a list of the DatasetRecords in Mobi.
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
             * Calls the GET /mobirest/datasets/{datasetRecordIRI} endpoint to get the DatasetRecord associated
             * with the provided ID.
             *
             * @return {Promise} A promise that either resolves with the response of the endpoint or is rejected with an
             * error message
             */
            self.getDatasetRecord = function(datasetRecordIRI) {
                return $http.get(prefix + '/' + encodeURIComponent(datasetRecordIRI))
                    .then(response => response.data, $q.reject);
            }

            /**
             * @ngdoc method
             * @name createDatasetRecord
             * @methodOf datasetManager.service:datasetManagerService
             *
             * @description
             * Calls POST /mobirest/datasets endpoint with the passed metadata and creates a new DatasetRecord and
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
                _.forEach(_.get(recordConfig, 'keywords', []), word => fd.append('keywords', word));
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
             * Calls the DELETE /mobirest/datasets/{datasetRecordId} endpoint and removes the identified DatasetRecord
             * and its associated Dataset and named graphs from Mobi. By default, only removes named graphs that are not
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
             * Calls the DELETE /mobirest/datasets/{datasetRecordId}/data endpoint and removes the named graphs of the
             * Dataset associated with the identified DatasetRecord from Mobi. By default, only removes named graphs that
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
                return cm.updateRecord(datasetRecordIRI, catalogIRI, jsonld)
                    .then(() => {
                        removeDataset(datasetRecordIRI);
                        self.datasetRecords.push(jsonld);
                    }, $q.reject);
            }

            /**
             * @ngdoc method
             * @name clearDatasetRecord
             * @methodOf datasetManager.service:datasetManagerService
             *
             * @description
             * Calls the POST /mobirest/datasets/{datasetRecordId}/data endpoint and uploads the data contained in the
             * provided file to the Dataset associated with the identified DatasetRecord from Mobi. Returns a Promise
             * indicating the success of the request.
             *
             * @param {string} datasetRecordIRI The IRI of the DatasetRecord whose Dataset will receive the data
             * @param {File} file The RDF File object to upload
             * @param {string} id The identifier for this request
             * @return {Promise} A Promise that resolves if the upload was successful; rejects with an error message otherwise
             */
            self.uploadData = function(datasetRecordIRI, file, id = '') {
                var fd = new FormData(),
                    config = {
                        transformRequest: angular.identity,
                        headers: {
                            'Content-Type': undefined
                        }
                    };
                fd.append('file', file);
                var url = prefix + '/' + encodeURIComponent(datasetRecordIRI) + '/data';
                var promise = id ? httpService.post(url, fd, config, id) : $http.post(url, fd, config);
                return promise.then(() => $q.when(), util.rejectError);
            }

            /**
             * @ngdoc method
             * @name initialize
             * @methodOf datasetManager.service:datasetManagerService
             *
             * @description
             * Populates the 'datasetRecords' with results from the 'getDatasetRecords' method. If that method results
             * in an error, an error toast will be displayed. Returns a promise.
             *
             * @return {Promise} A Promise that indicates the function has completed.
             */
            self.initialize = function() {
                var paginatedConfig = {
                    sortOption: {
                        field: prefixes.dcterms + 'title'
                    }
                }
                return self.getDatasetRecords(paginatedConfig)
                    .then(response => {
                        self.datasetRecords = response.data;
                    }, util.createErrorToast);
            }

            /**
             * @ngdoc method
             * @name getOntologyIdentifiers
             * @methodOf datasetManager.service:datasetManagerService
             *
             * @description
             * Gets the list of ontology identifiers for the provided record in the provided JSON-LD array
             *
             * @param {Object[]} arr A JSON-LD array (typically contains a DatasetRecord and OntologyIdentifiers)
             * @param {Object} record A DatasetRecord JSON-LD object
             * @return {Object[]} A JSON-LD array of OntologyIdentifier blank nodes
             */
            self.getOntologyIdentifiers = function(arr, record = self.getRecordFromArray(arr)) {
                return _.map(_.get(record, `['${prefixes.dataset}ontology']`), obj => _.find(arr, {'@id': obj['@id']}));
            }

            /**
             * @ngdoc method
             * @name getRecordFromArray
             * @methodOf datasetManager.service:datasetManagerService
             *
             * @description
             * Retrieves the DatasetRecord from the provided JSON-LD array based on whether or not the object has
             * the correct type.
             *
             * @param {Object[]} arr A JSON-LD array (typically a result from the REST endpoint)
             * @return {Object} The JSON-LD object for a DatasetRecord; undefined otherwise
             */
            self.getRecordFromArray = function(arr) {
                return _.find(arr, obj => _.includes(obj['@type'], prefixes.dataset + 'DatasetRecord'));
            }

            /**
             * @ngdoc method
             * @name splitDatasetArray
             * @methodOf datasetManager.service:datasetManagerService
             *
             * @description
             * Splits the JSON-LD array into an object with a key for the DatasetRecord and a key for the
             * OntologyIdentifiers. The object structure looks like the following:
             * ```
             * {
             *     record: {},
             *     identifiers: []
             * }
             * ```
             *
             * @param {Object[]} arr A JSON-LD array (typically a result ofrom the REST endpoint)
             * @return {Object} An object with key `record` for the DatasetRecord and key `identifiers` for the
             * OntologyIdentifiers
             */
            self.splitDatasetArray = function(arr) {
                var record = self.getRecordFromArray(arr);
                return {
                    record,
                    identifiers: self.getOntologyIdentifiers(arr, record)
                };
            }

            function removeDataset(datasetRecordIRI) {
                _.remove(self.datasetRecords, array => _.find(array, {'@id': datasetRecordIRI}));
            }
        }
})();
