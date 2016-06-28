(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name csvManager
         *
         * @description 
         * The `csvManager` module only provides the `csvManagerService` service which
         * provides access to the MatOnto CSV REST endpoints and variable to hold data 
         * pertaining to the results of these endpoints.
         */
        .module('csvManager', [])
        /**
         * @ngdoc service
         * @name csvManager.service:csvManagerService
         * @requires $rootScope
         * @requires $http
         * @requires $q
         * @requires $window
         *
         * @description 
         * `csvManagerService` is a service that provides access to the MatOnto CSV REST 
         * endpoints and various variables to hold data pertaining to the parameters 
         * passed to the endpoints and the results of the endpoints.
         */
        .service('csvManagerService', csvManagerService);

        csvManagerService.$inject = ['$rootScope', '$http', '$q', '$window'];

        function csvManagerService($rootScope, $http, $q, $window) {
            var self = this,
                prefix = '/matontorest/csv';

            /**
             * @ngdoc property
             * @name csvManager.csvManagerService#fileObj
             * @propertyOf csvManager.service:csvManagerService
             * @type {Object}
             * 
             * @description
             * `fileObj` holds the File object from a {@link file-input.directive:fileInput fileInput} 
             * directive.
             */
            self.fileObj = undefined;
            /**
             * @ngdoc property
             * @name csvManager.csvManagerService#filePreview
             * @propertyOf csvManager.service:csvManagerService
             * @type {Object}
             * 
             * @description
             * `filePreview` holds an object which has the headers and rows set from a call to 
             * GET /matontorest/csv/{fileName}. The structure of this object is:
             * ```
             * {
             *     headers: ['Column 1'],
             *     rows: [['Row 1'], ['Row 2']]
             * }
             * ```
             */
            self.filePreview = undefined;
            /**
             * @ngdoc property
             * @name csvManager.csvManagerService#fileName
             * @propertyOf csvManager.service:csvManagerService
             * @type {string}
             *
             * @description 
             * `fileName` holds a string with the name of the uploaded delimited file given 
             * back from the POST /matontorest/csv endpoint and is used in all other CSV 
             * endpoint calls.
             */
            self.fileName = '';
            /**
             * @ngdoc property
             * @name csvManager.csvManagerService#separator
             * @propertyOf csvManager.service:csvManagerService
             * @type {string}
             *
             * @description 
             * `separator` holds a string with the character separating columns in the uploaded 
             * delimited file if it is a CSV file. It is used in the GET /matontorest/csv/{fileName},
             * the POST /matontorest/csv/{fileName}/map, and the GET /matontorest/csv/{fileName}/map 
             * endpoints calls.
             */
            self.separator = ',';
            /**
             * @ngdoc property
             * @name csvManager.csvManagerService#containsHeaders
             * @propertyOf csvManager.service:csvManagerService
             * @type {boolean}
             *
             * @description 
             * `separator` holds a boolean indicating whether the uploaded delimited file contains a
             * header row or not. It is used in the GET /matontorest/csv/{fileName}, the POST 
             * /matontorest/csv/{fileName}/map-preview, and the GET /matontorest/csv/{fileName}/map 
             * endpoints calls.
             */
            self.containsHeaders = true;

            /**
             * @ngdoc method
             * @name csvManager.csvManagerService#upload
             * @methodOf csvManager.service:csvManagerService
             *
             * @description 
             * Makes a call to POST /matontorest/csv to upload the passed File object to the repository.
             * Returns the resulting file name is a promise.
             * 
             * @param {object} file a File object to upload (should be a CSV or Excel file)
             * @return {Promise} A Promise that resolves to the name of the uploaded delimited file.
             */
            self.upload = function(file) {
                var deferred = $q.defer(),
                    fd = new FormData(),
                    config = {
                        transformRequest: angular.identity,
                        headers: {
                            'Content-Type': undefined,
                            'Accept': 'text/plain'
                        }
                    };
                fd.append('delimitedFile', file);

                $rootScope.showSpinner = true;
                $http.post(prefix, fd, config)
                    .then(response => {
                        deferred.resolve(response.data);
                    }, response => {
                        deferred.reject(_.get(response, 'statusText', ''));
                    }).then(() => {
                        $rootScope.showSpinner = false;                        
                    });

                return deferred.promise;
            }

            /**
             * @ngdoc method
             * @name csvManager.csvManagerService#previewFile
             * @methodOf csvManager.service:csvManagerService
             *
             * @description 
             * Makes a call to GET /matontorest/csv/{fileName} to retrieve the passed in number of rows 
             * of an uploaded delimited file. Uses {@link csvManager.csvManager#separator separator} and 
             * {@link csvManager.csvManager#fileName fileName} to make the call. Depending on the value 
             * of {@link csvManager.csvManager#containsHeaders containsHeaders}, either uses the first 
             * returned row as headers or generates headers of the form "Column " + index. Sets the value 
             * of {@link csvManager.csvManager#filePreview filePreview}. Returns a Promise indicating the 
             * success of the REST call.
             * 
             * @param {number} rowEnd the number of rows to retrieve from the uploaded delimited file
             * @return {Promise} A Promise that resolves if the call succeeded and rejects if the preview 
             * was empty or the call did not succeed
             */
            self.previewFile = function(rowEnd) {
                var deferred = $q.defer(),
                    config = {
                        params: {
                            'rowCount': rowEnd ? rowEnd : 0,
                            'separator': self.separator
                        }
                    };

                $rootScope.showSpinner = true;
                $http.get(prefix + '/' + encodeURIComponent(self.fileName), config)
                    .then(response => {
                        if (response.data.length === 0) {
                            self.filePreview = undefined;
                            deferred.reject("No rows were found");
                        } else {
                            self.filePreview = {};
                            if (self.containsHeaders) {
                                self.filePreview.headers = response.data[0];
                                self.filePreview.rows = _.drop(response.data, 1);
                            } else {
                                self.filePreview.headers = [];
                                _.times(response.data[0].length, index => {
                                    self.filePreview.headers.push('Column ' + (index + 1));
                                });
                                self.filePreview.rows = response.data;
                            }
                            deferred.resolve();
                        }
                    }, response => {
                        self.filePreview = undefined;
                        deferred.reject(_.get(response, 'statusText', ''));
                    }).then(() => {
                        $rootScope.showSpinner = false;
                    });

                return deferred.promise;
            }

            /**
             * @ngdoc method
             * @name csvManager.csvManagerService#previewMap
             * @methodOf csvManager.service:csvManagerService
             *
             * @description 
             * Makes a call to POST /matontorest/csv/{fileName}/map-preview to retrieve the first 10 rows of 
             * delimited data mapped into RDF data using the passed in JSON-LD mapping and returns the RDF 
             * data in the passed in format. Uses {@link csvManager.csvManager#separator separator},
             * {@link csvManager.csvManager#containsHeaders containsHeaders}, and
             * {@link csvManager.csvManager#fileName fileName} to make the call. If the format is "jsonld," 
             * sends the request with an Accept header of "applciation/jsond". Otherwise, sends the request 
             * with an Accept header of "text/plain". Returns a Promise with the result of the endpoint call.
             * 
             * @param {object[]} jsonld the JSON-LD of a mapping
             * @param {string} format the RDF serialization format to return the mapped data in
             * @return {Promise} A Promise that resolves with the mapped data in the specified RDF format
             */
            self.previewMap = function(jsonld, format) {
                var deferred = $q.defer(),
                    fd = new FormData(),
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

                $http.post(prefix + '/' + encodeURIComponent(self.fileName) + '/map-preview', fd, config)
                    .then(response => {
                        deferred.resolve(response.data);
                    }, response => {
                        deferred.reject(_.get(response, 'statusText', ''));
                    });
                return deferred.promise;
            }

            /**
             * @ngdoc method
             * @name csvManager.service:csvManagerService#map
             * @methodOf csvManager.service:csvManagerService
             * 
             * @description 
             * Opens the current window to the location of GET /matontorest/csv/{fileName}/map which
             * will start a file download of the complete mapped delimited data  in JSON-LD format
             * of an uploaded delimited file using a saved mapping specified by the passed in mapping 
             * name. Uses {@link csvManager.csvManager#separator separator},
             * {@link csvManager.csvManager#containsHeaders containsHeaders}, and
             * {@link csvManager.csvManager#fileName fileName} to create the URL to set the window 
             * location to.
             * 
             * @param {string} mappingName the local name of a saved mapping
             */
            self.map = function(mappingName) {
                var queryString = '?format=jsonld&mappingName=' + mappingName + '&containsHeaders=' + self.containsHeaders + '&separator=' + self.separator;
                $window.location = prefix + '/' + encodeURIComponent(self.fileName) + '/map' + queryString;
            }

            /**
             * @ngdoc method
             * @name csvManager.service:csvManagerService#reset
             * @methodOf csvManager.service:csvManagerService
             * 
             * @description 
             * Resets the values of {@link csvManager.csvManager#fileObj fileObj}
             * {@link csvManager.csvManager#filePreview filePreview},
             * {@link csvManager.csvManager#fileName fileName},
             * {@link csvManager.csvManager#separator separator}, and
             * {@link csvManager.csvManager#containsHeaders containsHeaders} back to their default
             * values.
             */
            self.reset = function() {
                self.fileObj = undefined;
                self.filePreview = undefined;
                self.fileName = '';
                self.separator = ',';
                self.containsHeaders = true;
            }
        }
})();