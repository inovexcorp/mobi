(function() {
    'use strict';

    angular
        .module('etl', [])
        .service('etlService', etlService);

        etlService.$inject = ['$http', '$q'];

        function etlService($http, $q) {
            var self = this;

            /**
             * HTTP POST to CSV.upload which uploads file to data/tmp/ directory.
             * @param {boolean} isValid - Validity of the form submission
             * @param inputStream - Data from <input type="file" />
             * @param {string} fileName - MatOnto name for local instance use
             * @return {promise} The response data
             */
            self.upload = function(isValid, inputStream, fileName) {
                if(isValid) {
                    var config = {
                            headers: {
                                'File-Name': fileName
                            },
                            data: inputStream
                        };

                    return $http.post('/etl/csv/upload', config)
                        .then(function(response) {
                            // TODO: handle error situation (using $q)
                            return response.data;
                        });
                }
            }

            /**
             * HTTP GET to CSV.preview which returns rows to display in table.
             * @param {fileName} The name of the file to preview
             * @param {number} [rowEnd=10] The number of lines to show in the preview
             * @return {Object} A JavaScript object with name, header, and rows from the preview data
             */
            self.preview = function(fileName, rowEnd) {
                var config = {
                    headers: {
                        'Row-Count': rowEnd
                    }
                }

                return $http.get('/etl/csv/preview/' + fileName, config)
                    .then(function(response) {
                            // TODO: handle error situation (using $q)
                            return {
                                name: fileName,
                                header: response.data[0],
                                rows: response.data.slice(1, response.data.length)
                            };
                        }
                    );
            }

            /**
             * Uploads and previews data (using upload and preview functions from above)
             * @param {boolean} isValid - Validity of the form submission
             * @param inputStream - Data from <input type="file" />
             * @param {string} fileName - MatOnto name for local instance use
             * @param {number} [rowEnd=10] - The number of lines to show in the preview
             */
            self.uploadThenPreview = function(isValid, inputStream, fileName, rowEnd) {
                return self.upload(isValid, inputStream, fileName)
                    .then(function(response) {
                        return self.preview(fileName, rowEnd);
                    });
            }
        }
})();