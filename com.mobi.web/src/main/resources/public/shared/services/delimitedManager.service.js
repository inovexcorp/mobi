/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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

    delimitedManagerService.$inject = ['$http', '$httpParamSerializer', '$q', 'utilService', 'REST_PREFIX'];

    function delimitedManagerService($http, $httpParamSerializer, $q, utilService, REST_PREFIX) {
        var self = this,
            util = utilService,
            prefix = REST_PREFIX + 'delimited-files';

        /**
         * @ngdoc property
         * @name dataRows
         * @propertyOf shared.service:delimitedManagerService
         * @type {string[]}
         *
         * @description
         * `dataRows` holds an array of a preview of delimited data. Set by the
         * POST /mobirest/delimited-files endpoint
         */
        self.dataRows = undefined;
        /**
         * @ngdoc property
         * @name fileName
         * @propertyOf shared.service:delimitedManagerService
         * @type {string}
         *
         * @description
         * `fileName` holds a string with the name of the uploaded delimited file given
         * back from the POST /mobirest/delimited-files endpoint
         * endpoint calls.
         */
        self.fileName = '';
        /**
         * @ngdoc property
         * @name separator
         * @propertyOf shared.service:delimitedManagerService
         * @type {string}
         *
         * @description
         * `separator` holds a string with the character separating columns in the uploaded
         * delimited file if it is an SV file. It is used in the GET /mobirest/delimited-files/{fileName},
         * the POST /mobirest/delimited-files/{fileName}/map, and the
         * GET /mobirest/delimited-files/{fileName}/map
         * endpoints calls.
         */
        self.separator = ',';
        /**
         * @ngdoc property
         * @name containsHeaders
         * @propertyOf shared.service:delimitedManagerService
         * @type {boolean}
         *
         * @description
         * `separator` holds a boolean indicating whether the uploaded delimited file contains a
         * header row or not. It is used in the GET /mobirest/delimited-files/{fileName}, the POST
         * /mobirest/delimited-files/{fileName}/map-preview, and the
         * GET /mobirest/delimited-files/{fileName}/map
         * endpoints calls.
         */
        self.containsHeaders = true;
        /**
         * @ngdoc property
         * @name preview
         * @propertyOf shared.service:delimitedManagerService
         * @type {string/Object}
         *
         * @description
         * `preview` holds a string or Object containing a preview of mapped data to be used in the
         * {@link rdfPreview.directive:rdfPreview RDF Preview} directive.
         */
        self.preview = '';
        /**
         * @ngdoc property
         * @name serializeFormat
         * @propertyOf shared.service:delimitedManagerService
         * @type {string}
         *
         * @description
         * `serializeFormat` holds a string containing the format for the preview to be used in the
         * {@link rdfPreview.directive:rdfPreview RDF Preview} directive.
         */
        self.serializeFormat = 'turtle';

        /**
         * @ngdoc method
         * @name upload
         * @methodOf shared.service:delimitedManagerService
         *
         * @description
         * Makes a call to POST /mobirest/delimited-files to upload the passed File object to the repository.
         * Returns the resulting file name is a promise.
         *
         * @param {File} file a File object to upload (should be a SV or Excel file)
         * @return {Promise} A Promise that resolves to the name of the uploaded delimited file; rejects with an
         * error message otherwise
         */
        self.upload = function(file) {
            var fd = new FormData(),
                config = {
                    transformRequest: angular.identity,
                    headers: {
                        'Content-Type': undefined,
                        'Accept': 'text/plain'
                    }
                };
            fd.append('delimitedFile', file);
            return $http.post(prefix, fd, config)
                .then(response => response.data, util.rejectError);
        }

        /**
         * @ngdoc method
         * @name previewFile
         * @methodOf shared.service:delimitedManagerService
         *
         * @description
         * Makes a call to GET /mobirest/delimited-files/{fileName} to retrieve the passed in number of rows
         * of an uploaded delimited file. Uses {@link delimitedManager.delimitedManager#separator separator} and
         * {@link delimitedManager.delimitedManager#fileName fileName} to make the call. Depending on the value
         * of {@link delimitedManager.delimitedManager#containsHeaders containsHeaders}, either uses the first
         * returned row as headers or generates headers of the form "Column " + index. Sets the value
         * of {@link delimitedManager.delimitedManager#dataRows dataRows}. Returns a Promise indicating the
         * success of the REST call.
         *
         * @param {number} rowEnd the number of rows to retrieve from the uploaded delimited file
         * @return {Promise} A Promise that resolves if the call succeeded; rejects if the preview was empty
         * or the call did not succeed
         */
        self.previewFile = function(rowEnd) {
            var config = {
                    params: {
                        'rowCount': rowEnd ? rowEnd : 0,
                        'separator': self.separator
                    }
                };
            return $http.get(prefix + '/' + encodeURIComponent(self.fileName), config)
                .then(response => {
                    if (response.data.length === 0) {
                        self.dataRows = undefined;
                        return $q.reject("No rows were found");
                    } else {
                        self.dataRows = response.data;
                        return;
                    }
                }, error => {
                    self.dataRows = undefined;
                    return util.rejectError(error);
                });
        }

        /**
         * @ngdoc method
         * @name previewMap
         * @methodOf shared.service:delimitedManagerService
         *
         * @description
         * Makes a call to POST /mobirest/delimited-files/{fileName}/map-preview to retrieve the first 10 rows of
         * delimited data mapped into RDF data using the passed in JSON-LD mapping and returns the RDF
         * data in the passed in format. Uses {@link delimitedManager.delimitedManager#separator separator},
         * {@link delimitedManager.delimitedManager#containsHeaders containsHeaders}, and
         * {@link delimitedManager.delimitedManager#fileName fileName} to make the call. If the format is "jsonld,"
         * sends the request with an Accept header of "applciation/jsond". Otherwise, sends the request
         * with an Accept header of "text/plain". Returns a Promise with the result of the endpoint call.
         *
         * @param {object[]} jsonld the JSON-LD of a mapping
         * @param {string} format the RDF serialization format to return the mapped data in
         * @return {Promise} A Promise that resolves with the mapped data in the specified RDF format
         */
        self.previewMap = function(jsonld, format) {
            var fd = new FormData(),
                config = {
                    transformRequest: angular.identity,
                    params: {
                        'format': format,
                        'containsHeaders': self.containsHeaders,
                        'separator': self.separator
                    },
                    headers: {
                        'Content-Type': undefined,
                        'Accept': (format === 'jsonld') ? 'application/json' : 'text/plain'
                    }
                };
            fd.append('jsonld', angular.toJson(jsonld));
            return $http.post(prefix + '/' + encodeURIComponent(self.fileName) + '/map-preview', fd, config)
                .then(response => response.data, util.rejectError);
        }

        /**
         * @ngdoc method
         * @name mapAndDownload
         * @methodOf shared.service:delimitedManagerService
         *
         * @description
         * Calls the GET /mobirest/delimited-files/{fileName}/map endpoint using the `window.location` variable
         * which will start a file download of the complete mapped delimited data in the specified format
         * of an uploaded delimited file using a saved Mapping identified by the passed IRI. Uses
         * {@link delimitedManager.delimitedManager#separator separator},
         * {@link delimitedManager.delimitedManager#containsHeaders containsHeaders}, and
         * {@link delimitedManager.delimitedManager#fileName fileName} to create the URL.
         *
         * @param {string} mappingRecordIRI the IRI of a saved MappingRecord
         * @param {string} format the RDF format for the mapped data
         * @param {string} fileName the file name for the downloaded mapped data
         */
        self.mapAndDownload = function(mappingRecordIRI, format, fileName) {
            var params = {
                containsHeaders: self.containsHeaders,
                separator: self.separator,
                format,
                mappingRecordIRI
            };
            if (fileName) {
                params.fileName = fileName;
            }
            util.startDownload(prefix + '/' + encodeURIComponent(self.fileName) + '/map?' + $httpParamSerializer(params));
        }

        /**
         * @ngdoc method
         * @name mapAndUpload
         * @methodOf shared.service:delimitedManagerService
         *
         * @description
         * Calls the POST /mobirest/delimited-files/{fileName}/map to map the data of an uploaded delimited file
         * using a saved Mapping identified by the passed IRI into the Dataset associated with the DatasetRecord
         * identified by the passed IRI. Returns a Promise indicating the success of the request.
         *
         * @param {string} mappingIRI the IRI of a saved Mapping
         * @param {string} datasetRecordIRI the IRI of a DatasetRecord
         * @return {Promise} A Promise that resolves if the upload was successful; rejects with an error message otherwise
         */
        self.mapAndUpload = function(mappingRecordIRI, datasetRecordIRI) {
            var config = {
                    params: {
                        mappingRecordIRI,
                        datasetRecordIRI,
                        containsHeaders: self.containsHeaders,
                        separator: self.separator
                    }
                };
            return $http.post(prefix + '/' + encodeURIComponent(self.fileName) + '/map', null, config)
                .then(response => response.data, util.rejectError);
        }

        /**
         * @ngdoc method
         * @name mapAndCommit
         * @methodOf shared.service:delimitedManagerService
         *
         * @description
         * Calls the POST /mobirest/delimited-files/{fileName}/map-to-ontology to commit the data of an uploaded delimited file
         * using a saved Mapping identified by the passed IRI on the Ontology associated with the OntologyRecord
         * identified by the passed IRI. Returns a Promise with the whole HTTP response indicating the success of the request.
         *
         * @param {string} mappingIRI the IRI of a saved Mapping
         * @param {string} ontologyRecordIRI the IRI of a OntologyRecord
         * @param {string} branchIRI the IRI of record branch
         * @param {boolean} update True to update the ontology with new mapping results, false to add as new additions
         * @return {Promise} A Promise of the whole HTTP response that resolves if the upload was successful; rejects with an error message otherwise
         */
        self.mapAndCommit = function(mappingRecordIRI, ontologyRecordIRI, branchIRI, update = false) {
            var config = {
                params: {
                    mappingRecordIRI,
                    ontologyRecordIRI,
                    branchIRI,
                    update,
                    containsHeaders: self.containsHeaders,
                    separator: self.separator
                }
            };
            return $http.post(prefix + '/' + encodeURIComponent(self.fileName) + '/map-to-ontology', null, config)
                .then(_.identity, util.rejectError);
        }

        /**
         * @ngdoc method
         * @name getHeader
         * @methodOf shared.service:delimitedManagerService
         *
         * @description
         * Retrieves the header name of a column based on its index. If
         * {@link shared.service:delimitedManagerService#dataRows data rows} have been
         * set and {@link shared.service:delimitedManagerService#containsHeaders contain headers},
         * collects the header name from the first row. Otherwise, generates a name using the index.
         *
         * @param {number/string} index The index number of the column to retrieve the header name from
         * @return {string} A header name for the column at the specified index
         */
        self.getHeader = function(index) {
            return self.containsHeaders && self.dataRows ? _.get(self.dataRows[0], index, `Column ${index}`) : `Column ${index}`;
        }

        /**
         * @ngdoc method
         * @name reset
         * @methodOf shared.service:delimitedManagerService
         *
         * @description
         * Resets the values of {@link delimitedManager.delimitedManager#dataRows dataRows}
         * {@link delimitedManager.delimitedManager#preview preview},
         * {@link delimitedManager.delimitedManager#fileName fileName},
         * {@link delimitedManager.delimitedManager#separator separator}, and
         * {@link delimitedManager.delimitedManager#containsHeaders containsHeaders} back to their default
         * values.
         */
        self.reset = function() {
            self.dataRows = undefined;
            self.fileName = '';
            self.separator = ',';
            self.containsHeaders = true;
            self.preview = '';
        }
    }

    angular
        .module('shared')
        /**
         * @ngdoc service
         * @name shared.service:delimitedManagerService
         * @requires shared.service:utilService
         *
         * @description
         * `delimitedManagerService` is a service that provides access to the Mobi CSV REST
         * endpoints and various variables to hold data pertaining to the parameters
         * passed to the endpoints and the results of the endpoints.
         */
        .service('delimitedManagerService', delimitedManagerService);
})();
