(function() {
    'use strict';

    angular
        .module('mapping', [])
        .service('mappingService', mappingService);

        function mappingService() {
            var self = this;

            self.files = [];

            self.addFile = function(data) {
                self.files.push(data);
            }
        }
})();