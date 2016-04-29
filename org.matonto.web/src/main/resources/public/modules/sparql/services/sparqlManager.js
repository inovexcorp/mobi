(function() {
    'use strict';

    angular
        .module('sparql', [])
        .service('sparqlService', sparqlService);

        sparqlService.$inject = [];

        function sparqlService() {
            var prefix = '/matontorest/query';

            this.response = {};

            this.queryRdf = function(queryString) {
                var config = {
                    params: {
                        query: queryString
                    }
                }

                $http.get(prefix, config)
                    .then(function(response) {
                        if(_.get(response, 'statusCode', 0) === 200) {
                            this.response = response.data;
                        } else {
                            // TODO: no results
                        }
                    }, function(response) {
                        // TODO: error
                    });
            }
        }
})();