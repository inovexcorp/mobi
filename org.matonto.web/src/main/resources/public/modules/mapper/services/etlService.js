(function() {
    'use strict';

    angular
        .module('etl', [])
        .service('etlService', etlService);

        etlService.$inject = ['$rootScope', '$http', '$q'];

        function etlService($rootScope, $http, $q) {
            var self = this,
                prefix = '/matontorest/csv';

            /**
             * HTTP POST to csv/upload which uploads a delimited file to data/tmp/ directory.
             * @param file - The selected file from <input type="file" />
             * @return {promise} The response data with the name of the uploaded file
             */
            self.upload = function(file) {
                var deferred = $q.defer();
                var fd = new FormData(),
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
             * HTTP GET to csv/preview which returns rows to display in a table
             * @param {fileName} The name of the file to preview
             * @param {number} [rowEnd=10] The number of lines to show in the preview
             * @return {Object} A JavaScript object with headers and rows from the preview data
             */
            self.previewFile = function(fileName, rowEnd, separator, containsHeaders) {
                var deferred = $q.defer();
                var config = {
                        params: {
                            'Row-Count': rowEnd ? rowEnd : 0,
                            'Separator': separator
                        }
                    };

                $http.get(prefix + '/' + encodeURIComponent(fileName), config)
                    .then(function(response) {
                        var filePreview = {};
                        filePreview.headers = containsHeaders ? response.data.rows[0] : [];
                        filePreview.rows = containsHeaders ? response.data.rows.slice(1, response.data.length) : response.data;
                        deferred.resolve(filePreview);
                    }, function(response) {
                        deferred.reject(response);
                    });
                return deferred.promise;
            }

            self.update = function(fileName, file) {
                var deferred = $q.defer();
                var fd = new FormData(),
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

            self.mapByFile = function(fileName, mappingFileName, containsHeaders) {
                var deferred = $q.defer();
                var fd = new FormData(),
                    config = {
                        transformRequest: angular.identity,
                        params: {
                            'Contains-Headers': containsHeaders
                        },
                        headers: {
                            'Content-Type': undefined
                        }
                    };
                fd.append('fileName', mappingFileName);

                $rootScope.showSpinner = true;
                $http.post(prefix + '/' + fileName + '/map', fd, config)
                    .then(function(response) {
                        $rootScope.showSpinner = false;
                        deferred.resolve(response.data);
                    }, function(response) {
                        $rootScope.showSpinner = false;
                        deferred.reject(response);
                    });
                return deferred.promise;
            }

            self.mapByString = function(fileName, jsonld, containsHeaders) {
                var deferred = $q.defer();
                var fd = new FormData(),
                    config = {
                        transformRequest: angular.identity,
                        params: {
                            'Contains-Headers': containsHeaders
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

            self.previewMap = function(fileName, jsonld, containsHeaders, format) {
                var deferred = $q.defer();
                var fd = new FormData(),
                    config = {
                        transformRequest: angular.identity,
                        params: {
                            'Preview': true,
                            'Format': format,
                            'Contains-Headers': containsHeaders
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