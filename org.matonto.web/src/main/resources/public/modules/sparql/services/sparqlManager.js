(function() {
    'use strict';

    angular
        .module('sparqlManager', [])
        .service('sparqlManagerService', sparqlManagerService);

        sparqlManagerService.$inject = ['$rootScope', '$http'];

        function sparqlManagerService($rootScope, $http) {
            var prefix = '/matontorest/sparql/page';
            var self = this;

            self.prefixes = [];
            self.queryString = '';
            self.data = {};

            self.errorMessage = '';
            self.infoMessage = 'Please submit a query to see results here.';

            self.currentPage = 0;

            function getMessage(response, defaultMessage) {
                return _.get(response, 'statusText') || defaultMessage;
            }

            function onSuccess(response) {
                if(_.get(response, 'status') === 200) {
                    self.data = response.data;
                } else {
                    self.infoMessage = getMessage(response, 'There was a problem getting the results.');
                }
            }

            function onError(response) {
                self.errorMessage = getMessage(response, 'A server error has occurred. Please try again later.');
            }

            self.queryRdf = function() {
                $rootScope.showSpinner = true;

                self.currentPage = 0;
                self.data = {};
                self.errorMessage = '';
                self.infoMessage = '';

                var prefixes = self.prefixes.length ? 'PREFIX ' + _.join(self.prefixes, '\nPREFIX ') + '\n\n' : '';
                var config = {
                    params: {
                        query: prefixes + self.queryString,
                        limit: 100,
                        start: 0
                    }
                }

                return $http.get(prefix, config)
                    .then(onSuccess, onError)
                    .then(function() {
                        $rootScope.showSpinner = false;
                    });
            }

            self.getResults = function(url) {
                $rootScope.showSpinner = true;

                return $http.get(url)
                    .then(onSuccess, onError)
                    .then(function() {
                        $rootScope.showSpinner = false;
                    });
            }
        }
})();