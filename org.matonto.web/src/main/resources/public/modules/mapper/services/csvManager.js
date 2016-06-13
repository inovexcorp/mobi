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
(function() {
    'use strict';

    angular
        .module('csvManager', [])
        .service('csvManagerService', csvManagerService);

        csvManagerService.$inject = ['$rootScope', '$http', '$q', '$window'];

        function csvManagerService($rootScope, $http, $q, $window) {
            var self = this,
                prefix = '/matontorest/csv';

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
                    .then(function(response) {
                        deferred.resolve(response.data);
                    }, function(response) {
                        deferred.reject(response);
                    }).then(function() {
                        $rootScope.showSpinner = false;                        
                    });

                return deferred.promise;
            }

            self.previewFile = function(fileName, rowEnd, separator, containsHeaders) {
                var deferred = $q.defer(),
                    config = {
                        params: {
                            'rowCount': rowEnd ? rowEnd : 0,
                            'separator': separator
                        }
                    };

                $rootScope.showSpinner = true;
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
                    }).then(function() {
                        $rootScope.showSpinner = false;
                    });
                return deferred.promise;
            }

            self.previewMap = function(fileName, jsonld, containsHeaders, format, separator) {
                var deferred = $q.defer(),
                    fd = new FormData(),
                    config = {
                        transformRequest: angular.identity,
                        params: {
                            'format': format,
                            'containsHeaders': containsHeaders,
                            'separator': separator
                        },
                        headers: {
                            'Content-Type': undefined,
                            'Accept': (format === 'jsonld') ? 'application/json' : 'text/plain'
                        }
                    };
                fd.append('jsonld', angular.toJson(jsonld));

                $http.post(prefix + '/' + encodeURIComponent(fileName) + '/map-preview', fd, config)
                    .then(function(response) {
                        deferred.resolve(response.data);
                    }, function(response) {
                        deferred.reject(response);
                    });
                return deferred.promise;
            }

            self.map = function(fileName, mappingName, containsHeaders, separator) {
                var queryString = '?format=jsonld&mappingName=' + mappingName + '&containsHeaders=' + containsHeaders + '&separator=' + separator;
                $window.location = prefix + '/' + encodeURIComponent(fileName) + '/map' + queryString;
            }
        }
})();