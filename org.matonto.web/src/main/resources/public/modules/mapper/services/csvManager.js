(function() {
    'use strict';

    angular
        .module('csvManager', [])
        .service('csvManagerService', csvManagerService);

        csvManagerService.$inject = ['$rootScope', '$http', '$q'];

        function csvManagerService($rootScope, $http, $q) {
            var self = this,
                prefix = '/matontorest/csv';

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