(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name csvManager
         *
         * @description
         * The `csvManager` module only provides the `csvManagerService` service which
         * provides access to REST endpoints for delimited files in the backend.
         */
        .module('csvManager', [])
        /**
         * @ngdoc service
         * @name csvManager.csvManagerService
         * @requires $rootScope
         * @requires $http
         * @requires $q
         *
         * @description
         * `csvManagerService` provides methods to access the REST endpoints for delimited
         * files in the backend. This includes uploading delimited files, retrives rows from 
         * an uploaded file, updating an uploaded file, and mapping the data in an uploaded
         * file using either a JSON-LD string or an uploaded mappping.
         */
        .service('csvManagerService', csvManagerService);

        csvManagerService.$inject = ['$rootScope', '$http', '$q'];

        function csvManagerService($rootScope, $http, $q) {
            var self = this,
                prefix = '/matontorest/csv';

            /**
             * @ngdoc method
             * @name csvManager.csvManagerService#upload'
             * @methodOf csvManager.csvManagerService
             *
             * @description
             * HTTP POST to matontorest/csv which uploads a delimited file sent as form data
             * to the data/tmp/ directory.
             * 
             * @param {object} file The selected file from a {@link fileInput fileInput} directive
             * 
             * @returns {promise} The response data with the name of the uploaded file
             */
            self.upload = function(file) {
                var deferred = $q.defer(),
                    fd = new FormData(),
                    config = {
                        transformRequest: angular.identity,
                        headers: {
                            'Content-Type': undefined
                        }
                    };
                fd.append('delimitedFile', file);

                $rootScope.showSpinner = true;
                $http.post(prefix, fd, config)
                    .then(function(response) {
                        $rootScope.showSpinner = false;
                        deferred.resolve(response.data);
                    }, function(response) {
                        $rootScope.showSpinner = false;
                        deferred.reject(response);
                    });

                return deferred.promise;
            }

            /**
             * @ngdoc method
             * @name csvManager.csvManagerService#previewFile
             * @methodOf csvManager.csvManagerService
             *
             * @description
             * HTTP GET to matontorest/csv/{fileName} which returns rows from an uploaded 
             * delimited file as JSON arrays in a JSON object that looks like this:
             * ```
             * {
             *     headers: [],
             *     rows: []
             * }
             * ```
             * If a header row is expected, pulls the first row from the response as the 
             * header row. Otherwise, creates a numbered header row.
             * 
             * @param {string} fileName The name of the delimited file to preview
             * @param {number} [rowEnd=10] The number of lines to show in the preview
             * @param {string} separator The character to use when separating columns in rows
             * @param {boolean} containsHeaders Whether the delimited file contains a header row
             * 
             * @returns {Promise} The response data with a JavaScript object containing headers and 
             *                   rows from the response data
             */
            self.previewFile = function(fileName, rowEnd, separator, containsHeaders) {
                var deferred = $q.defer(),
                    config = {
                        params: {
                            'Row-Count': rowEnd ? rowEnd : 0,
                            'Separator': separator
                        }
                    };

                $http.get(prefix + '/' + encodeURIComponent(fileName), config)
                    .then(function(response) {
                        var filePreview = {};
                        if (containsHeaders) {
                            filePreview.headers = response.data[0];
                            filePreview.rows = _.drop(response.data, 1);
                        } else {
                            filePreview.headers = [];
                            _.times(response.data[0].length, function(index) {
                                filePreview.headers.push('Column ' + (index + 1));
                            });
                            filePreview.rows = response.data;
                        }
                        deferred.resolve(filePreview);
                    }, function(response) {
                        deferred.reject(response);
                    });
                return deferred.promise;
            }

            /**
             * @ngdoc method
             * @name csvManager.csvManagerService#update
             * @methodOf csvManager.csvManagerService
             *
             * @description
             * HTTP PUT to matontorest/csv/{fileName} which updates the content of an uploaded 
             * delimited file.
             * 
             * @param {string} fileName The name of the uploaded file to update
             * @param {object} file The selected file from a {@link fileInput fileInput} directive
             * 
             * @returns {Promise} The response data with the name of the uploaded file
             */
            self.update = function(fileName, file) {
                var deferred = $q.defer(),
                    fd = new FormData(),
                    config = {
                        transformRequest: angular.identity,
                        headers: {
                            'Content-Type': undefined
                        }
                    };

                fd.append('delimitedFile', file);

                $rootScope.showSpinner = true;
                $http.put(prefix + '/' + encodeURIComponent(fileName), fd, config)
                    .then(function(response) {
                        $rootScope.showSpinner = false;
                        deferred.resolve(response.data);
                    }, function(response) {
                        $rootScope.showSpinner = false;
                        deferred.reject(response);
                    });
                return deferred.promise;
            }

            /**
             * @ngdoc method
             * @name csvManager.csvManagerService#mapByUploaded
             * @methodOf csvManager.csvManagerService
             *
             * @description
             * HTTP POST to matontorest/csv/{fileName}/map which maps the data in an uploaded 
             * delimited file into RDF using an uploaded mapping.
             * 
             * @param {string} fileName The name of the uploaded delimited file to map
             * @param {string} mappingName The name of the uploaded mapping
             * @param {boolean} containsHeaders Whether the delimited file contains a header row
             * 
             * @returns {Promise} The response data with the mapped data in JSON-LD format
             */
            self.mapByUploaded = function(fileName, mappingName, containsHeaders, separator) {
                var deferred = $q.defer(),
                    fd = new FormData(),
                    config = {
                        transformRequest: angular.identity,
                        params: {
                            'Contains-Headers': containsHeaders,
                            'Separator': separator
                        },
                        headers: {
                            'Content-Type': undefined
                        }
                    };
                fd.append('mappingName', mappingName);

                $rootScope.showSpinner = true;
                $http.post(prefix + '/' + encodeURIComponent(fileName) + '/map', fd, config)
                    .then(function(response) {
                        $rootScope.showSpinner = false;
                        deferred.resolve(response.data);
                    }, function(response) {
                        $rootScope.showSpinner = false;
                        deferred.reject(response);
                    });
                return deferred.promise;
            }

            /**
             * @ngdoc method
             * @name csvManager.csvManagerService#mapByString
             * @methodOf csvManager.csvManagerService
             *
             * @description
             * HTTP POST to matontorest/csv/{fileName}/map which maps the data in an uploaded 
             * delimited file into RDF using a JSON-LD mapping.
             * 
             * @param {string} fileName The name of the uploaded file to map
             * @param {object} jsonld The mapping JSON-LD
             * @param {boolean} containsHeaders Whether the delimited file contains a header row
             * 
             * @returns {Promise} The response data with the mapped data in JSON-LD format
             */
            self.mapByString = function(fileName, jsonld, containsHeaders, separator) {
                var deferred = $q.defer(),
                    fd = new FormData(),
                    config = {
                        transformRequest: angular.identity,
                        params: {
                            'Contains-Headers': containsHeaders,
                            'Separator': separator
                        },
                        headers: {
                            'Content-Type': undefined
                        }
                    };
                fd.append('jsonld', angular.toJson(jsonld));

                $rootScope.showSpinner = true;
                $http.post(prefix + '/' + encodeURIComponent(fileName) + '/map', fd, config)
                    .then(function(response) {
                        $rootScope.showSpinner = false;
                        deferred.resolve(response.data);
                    }, function(response) {
                        $rootScope.showSpinner = false;
                        deferred.reject(response);
                    });
                return deferred.promise;
            }

            /**
             * @ngdoc method
             * @name csvManager.csvManagerService#previewMap
             * @methodOf csvManager.csvManagerService
             *
             * @description
             * HTTP POST to matontorest/csv/{fileName}/map which maps the first 10 rows of data in 
             * an uploaded delimited file into RDF using a JSON-LD mapping.
             * 
             * @param {string} fileName The name of the uploaded file to map
             * @param {object} jsonld The JSON-LD mapping
             * @param {boolean} containsHeaders Whether the delimited file contains a header row
             * @param {string} format The format to preview the mapped in. Only supports JSON-LD
             * Turtle, and RDF/XML.
             * 
             * @returns {Promise} The response data with the mapped data preview in the specified format
             */
            self.previewMap = function(fileName, jsonld, containsHeaders, format, separator) {
                var deferred = $q.defer(),
                    fd = new FormData(),
                    config = {
                        transformRequest: angular.identity,
                        params: {
                            'Preview': true,
                            'Format': format,
                            'Contains-Headers': containsHeaders,
                            'Separator': separator
                        },
                        headers: {
                            'Content-Type': undefined,
                            'Accept': (format === 'jsonld') ? 'application/json' : 'text/plain'
                        }
                    };
                fd.append('jsonld', angular.toJson(jsonld));

                $http.post(prefix + '/' + encodeURIComponent(fileName) + '/map', fd, config)
                    .then(function(response) {
                        deferred.resolve(response.data);
                    }, function(response) {
                        deferred.reject(response);
                    });
                return deferred.promise;
            }
        }
})();