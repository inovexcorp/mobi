(function() {
    'use strict';

    angular
        .module('catalogManager', ['prefixes'])
        .service('catalogManagerService', catalogManagerService);

        catalogManagerService.$inject = ['$rootScope', '$http', '$q', 'prefixes'];

        function catalogManagerService($rootScope, $http, $q, prefixes) {
            var self = this,
                prefix = '/matontorest/catalog/';

            self.getResourceTypes = function() {
                return $http.get(prefix + 'resource-types')
                    .then(function(response) {
                        return $q.resolve(response.data);
                    });
            }

            self.getResources = function(limit, start, type, order) {
                $rootScope.showSpinner = true;
                var deferred = $q.defer(),
                    config = {
                        params: {
                            limit: limit,
                            start: start
                        }
                    };
                if (type) {
                    config.params.type = type;
                }
                $http.get(prefix + 'resources', config)
                    .then(function(response) {
                        deferred.resolve(response.data);
                        $rootScope.showSpinner = false;
                    }, function(error) {
                        deferred.reject(error.statusText);
                        $rootScope.showSpinner = false;
                    });
                return deferred.promise;
            }

            self.getResultsPage = function(url) {
                $rootScope.showSpinner = true;
                var deferred = $q.defer();
                $http.get(url)
                    .then(function(response) {
                        deferred.resolve(response.data);
                        $rootScope.showSpinner = false;
                    }, function(error) {
                        deferred.reject(error.statusText);
                        $rootScope.showSpinner = false;
                    });
                return deferred.promise;
            }

            self.getResource = function(resourceId) {
                $rootScope.showSpinner = true;
                var deferred = $q.defer();
                $http.get(prefix + 'resources/' + encodeURIComponent(resourceId))
                    .then(function(response) {
                        if (response.status === 204) {
                            deferred.reject('Resource does not exist');
                        } else {
                            deferred.resolve(response.data);                            
                        }
                        $rootScope.showSpinner = false;
                    }, function(error) {
                        deferred.reject(error.statusText);
                        $rootScope.showSpinner = false;
                    });
                return deferred.promise;
            }

            self.getType = function(type) {
                return type.replace(prefixes.catalog, '');
            }

            self.getDate = function(date) {
                var dateObj = new Date(0);
                if (_.has(date, 'year')) {
                    dateObj.setFullYear(date.year);
                }
                if (_.has(date, 'month')) {
                    dateObj.setMonth(date.month - 1);
                }
                if (_.has(date, 'day')) {
                    dateObj.setDate(date.day);
                }
                if (_.has(date, 'hour')) {
                    dateObj.setHours(date.hour);
                }
                if (_.has(date, 'minute')) {
                    dateObj.setMinutes(date.minute);
                }
                if (_.has(date, 'second')) {
                    dateObj.setSeconds(date.second);
                }
                return dateObj;
            }
        }
})();