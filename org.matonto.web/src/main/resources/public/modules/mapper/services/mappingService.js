(function() {
    'use strict';

    angular
        .module('mapping', [])
        .service('mappingService', mappingService);

        mappingService.$inject = [];

        function mappingService() {
            var self = this;

            self.files = [];

            self.addFile = function(data) {
                self.files.push(data);
            }
        }
})();