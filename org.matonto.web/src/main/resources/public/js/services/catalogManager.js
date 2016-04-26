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

            self.getResources = function(limit, start, type) {
                $rootScope.showSpinner = true;
                var deferred = $q.defer(),
                    config = {
                        limit: limit,
                        start: start
                    };
                if (type) {
                    config.type = type;
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
                return new Date(date.year, date.month, date.day, date.hour, date.minute, date.second);
            }
        }
})();