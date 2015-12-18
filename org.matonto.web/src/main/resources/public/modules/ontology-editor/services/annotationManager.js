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

            self.inWhiteList = function(key, ontology) {
                return ontology.matonto.annotations.indexOf(key) !== -1;
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