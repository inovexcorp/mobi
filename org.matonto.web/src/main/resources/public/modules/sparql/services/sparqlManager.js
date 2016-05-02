(function() {
    'use strict';

    angular
        .module('sparqlManager', [])
        .service('sparqlService', sparqlService);

        sparqlService.$inject = ['$rootScope', '$http'];

        function sparqlService($rootScope, $http) {
            var prefix = '/matontorest/query';
            var self = this;

            self.prefixes = [];
            self.queryString = '';
            self.response = {};

            self.errorMessage = '';
            self.infoMessage = 'Please submit a query to see results here.';

            function getMessage(response, defaultMessage) {
                return _.get(response, 'statusText', defaultMessage);
            }

            self.queryRdf = function() {
                $rootScope.showSpinner = true;

                self.response = {};
                self.errorMessage = '';
                self.infoMessage = '';

                var prefixes = self.prefixes.length ? 'PREFIX ' + _.join(self.prefixes, ' PREFIX ') : '';
                var config = {
                    params: {
                        query: prefixes + self.queryString
                    }
                }

                return $http.get(prefix, config)
                    .then(function(response) {
                        if(_.get(response, 'status') === 200) {
                            self.response = response.data;
                        } else {
                            self.infoMessage = getMessage(response, 'There was a problem getting the results.');
                        }
                    }, function(response) {
                        self.errorMessage = getMessage(response, 'A server error has occurred. Please try again later.');
                    })
                    .then(function() {
                        $rootScope.showSpinner = false;
                    });
            }
        }
})();