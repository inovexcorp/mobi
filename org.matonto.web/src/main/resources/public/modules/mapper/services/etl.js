(function() {
    'use strict';

    angular
        .module('etl', [])
        .service('etlService', etlService);

        etlService.$inject = ['$http', '$q'];

        function etlService($http, $q) {
            var self = this,
                prefix = '/matontorest/etl/csv';

            /**
             * HTTP POST to csv/upload which uploads a delimited file to data/tmp/ directory.
             * @param file - The selected file from <input type="file" />
             * @return {promise} The response data with the name of the uploaded file
             */
            self.upload = function(file) {
                var fd = new FormData(),
                    config = {
                        transformRequest: angular.identity,
                        headers: {
                            'Content-Type': undefined
                        }
                    };

                fd.append('delimitedFile', file)

                return $http.post(prefix + '/upload', fd, config)
                    .then(function(response) {
                        return response.data;
                    });
            }

            /**
             * HTTP GET to csv/preview which returns rows to display in a table
             * @param {fileName} The name of the file to preview
             * @param {number} [rowEnd=10] The number of lines to show in the preview
             * @return {Object} A JavaScript object with headers and rows from the preview data
             */
            self.preview = function(fileName, rowEnd) {
                var config = {
                        params: {
                            'Row-Count': rowEnd ? rowEnd : 0
                        }
                    };
                return $http.get(prefix + '/preview/' + fileName, config)
                    .then(function(response) {
                        return {
                            headers: response.data[0],
                            rows: response.data.slice(1, response.data.length)
                        };
                    });
            }
        }
})();