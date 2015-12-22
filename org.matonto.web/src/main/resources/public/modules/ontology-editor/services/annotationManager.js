(function() {
    'use strict';

    angular
        .module('annotationManager', [])
        .service('annotationManagerService', annotationManagerService)
        .filter('annotationManagerFilter', annotationManagerFilter);

        annotationManagerService.$inject = [];

        function annotationManagerService() {
            var self = this;

            self.remove = function(obj, key) {
                delete obj[key];
            }

            self.add = function(obj, key, value, select) {
                var item = [{'@value': value}];
                if(select === 'other') {
                    obj[key] = item;
                } else {
                    obj[select] = item;
                }
            }

            self.edit = function(obj, key, value) {
                obj[key] = value;
            }
        }

        function annotationManagerFilter() {
            return function(obj, annotations) {
                var prop,
                    results = [];
                for(prop in obj) {
                    if(annotations.indexOf(prop) !== -1) {
                        results.push(prop);
                    }
                }
                return results;
            }
        }
})();