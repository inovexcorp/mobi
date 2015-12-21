(function() {
    'use strict';

    angular
        .module('annotationManager', [])
        .service('annotationManagerService', annotationManagerService)
        .filter('annotationManagerFilter', annotationManagerFilter);

        annotationManagerService.$inject = [];

        function annotationManagerService() {
            var self = this;

            // removes the annotation
            self.remove = function(obj, key) {
                delete obj[key];
            }

            // adds the annotation that the user is editing
            self.add = function(obj, key, value, select) {
                if(select === 'other') {
                    obj[key] = value;
                } else {
                    obj[select] = value;
                }
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