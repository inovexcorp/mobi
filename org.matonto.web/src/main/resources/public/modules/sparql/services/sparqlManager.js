(function() {
    'use strict';

    angular
        .module('sparql', [])
        .service('sparqlService', sparqlService);

        sparqlService.$inject = [];

        function sparqlService() {
            var prefix = '/matontorest/query';

            // dummy data
            this.response = {
                 "head": { "vars": [ "book" , "title" ]
                 } ,
                 "results": {
                   "bindings": [
                     {
                       "book": { "type": "uri" , "value": "http://example.org/book/book6" } ,
                       "title": { "type": "literal" , "value": "Harry Potter and the Half-Blood Prince" }
                     } ,
                     {
                       "book": { "type": "uri" , "value": "http://example.org/book/book7" } ,
                       "title": { "type": "literal" , "value": "Harry Potter and the Deathly Hallows" }
                     } ,
                     {
                       "book": { "type": "uri" , "value": "http://example.org/book/book5" } ,
                       "title": { "type": "literal" , "value": "Harry Potter and the Order of the Phoenix" }
                     } ,
                     {
                       "book": { "type": "uri" , "value": "http://example.org/book/book4" } ,
                       "title": { "type": "literal" , "value": "Harry Potter and the Goblet of Fire" }
                     } ,
                     {
                       "book": { "type": "uri" , "value": "http://example.org/book/book2" } ,
                       "title": { "type": "literal" , "value": "Harry Potter and the Chamber of Secrets" }
                     } ,
                     {
                       "book": { "type": "uri" , "value": "http://example.org/book/book3" } ,
                       "title": { "type": "literal" , "value": "Harry Potter and the Prisoner Of Azkaban" }
                     } ,
                     {
                       "book": { "type": "uri" , "value": "http://example.org/book/book1" } ,
                       "title": { "type": "literal" , "value": "Harry Potter and the Philosopher's Stone" }
                     }
                   ]
                 }
            };

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