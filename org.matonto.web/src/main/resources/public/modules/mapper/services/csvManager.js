(function() {
    'use strict';

    angular
        .module('csvManager', [])
        .service('csvManagerService', csvManagerService);

        csvManagerService.$inject = ['$rootScope', '$http', '$q', '$window'];

        function csvManagerService($rootScope, $http, $q, $window) {
            var self = this,
                prefix = '/matontorest/csv';

            self.fileObj = undefined;
            self.filePreview = undefined;
            self.fileName = '';
            self.separator = ',';
            self.containsHeaders = true;

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
                    }, response => {
                        self.filePreview = undefined;
                        deferred.reject(_.get(response, 'statusText', ''));
                    }).then(() => {
                        $rootScope.showSpinner = false;
                    });

                return deferred.promise;
            }

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

            self.map = function(mappingName) {
                var queryString = '?format=jsonld&mappingName=' + mappingName + '&containsHeaders=' + self.containsHeaders + '&separator=' + self.separator;
                $window.location = prefix + '/' + encodeURIComponent(self.fileName) + '/map' + queryString;
            }

            self.reset = function() {
                self.fileObj = undefined;
                self.filePreview = undefined;
                self.fileName = '';
                self.separator = ',';
                self.containsHeaders = true;
            }
        }
})();