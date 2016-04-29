(function() {
    'use strict';

    angular
        .module('sparql', [])
        .service('sparqlService', sparqlService);

        sparqlService.$inject = ['$http'];

        function sparqlService($http) {
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

            self.queryRdf = function(prefixList, queryString) {
                self.response = {};
                self.errorMessage = '';
                self.infoMessage = '';

                var prefixes = prefixList.length ? 'PREFIX ' + _.join(prefixList, ' PREFIX ') : '';
                var config = {
                    params: {
                        query: prefixes + queryString
                    }
                }

                $http.get(prefix, config)
                    .then(function(response) {
                        if(_.get(response, 'status') === 200) {
                            self.response = response.data;
                        } else {
                            self.infoMessage = getMessage(response, 'There was a problem getting the results.');
                        }
                    }, function(response) {
                        self.errorMessage = getMessage(response, 'A server error has occurred. Please try again later.');
                    });
            }
        }
})();