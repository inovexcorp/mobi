(function() {
    'use strict';

    angular
        .module('annotationManager', [])
        .service('annotationManagerService', annotationManagerService)
        .filter('annotationManagerFilter', annotationManagerFilter);

        annotationManagerService.$inject = ['$filter'];

        function annotationManagerService($filter) {
            var self = this;

            self.remove = function(obj, key) {
                delete obj[key];
            }

            self.add = function(obj) {
                var matonto = obj.matonto,
                    key = matonto.currentAnnotationKey,
                    value = matonto.currentAnnotationValue,
                    select = matonto.currentAnnotationSelect,
                    item = [{'@value': value}];

                if(select === 'other') {
                    obj[key] = item;
                } else {
                    obj[select] = item;
                }
            }

            self.edit = function(obj, key, value) {
                obj[key] = value;
            }

            self.searchList = function(annotations, query) {
                var i = 0,
                    arr = [];
                while(i < annotations.length) {
                    if(annotations[i].toLowerCase().indexOf(query.toLowerCase()) !== -1) {
                        arr.push({ '@id': annotations[i] });
                    }
                    i++;
                }
                return arr;
            }
        }

        function annotationManagerFilter() {
            return function(obj, annotations) {
                var i, prop,
                    results = [];
                for(prop in annotations) {
                    i = 0;
                    while(i < annotations[prop].length) {
                        if(obj[prop + annotations[prop][i]]) {
                            results.push(prop + annotations[prop][i]);
                        }
                        i++;
                    }
                }
                return results;
            }
        }
})();