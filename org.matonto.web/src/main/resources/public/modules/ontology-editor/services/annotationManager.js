(function() {
    'use strict';

    angular
        .module('annotationManager', ['splitIRI'])
        .service('annotationManagerService', annotationManagerService)
        .filter('showAnnotations', showAnnotations);

        annotationManagerService.$inject = ['$filter'];

        function annotationManagerService($filter) {
            var self = this,
                reg = /^([^:\/?#]+):\/\/([^\/?#]*)([^?#]*)\\?([^#]*)(?:[#\/:](.+))+/;

            self.getPattern = function() {
                return reg;
            }

            self.remove = function(obj, key, index) {
                obj[key].splice(index, 1);

                if(!obj[key].length) {
                    delete obj[key];
                }
            }

            self.add = function(obj, annotations) {
                var prop, temp, stripped,
                    found = false,
                    matonto = obj.matonto,
                    key = matonto.currentAnnotationKey,
                    value = matonto.currentAnnotationValue,
                    select = matonto.currentAnnotationSelect,
                    item = {'@value': value};

                if(select === 'other') {
                    temp = key;
                } else {
                    temp = select.namespace + select.localName;
                }

                if(obj.hasOwnProperty(temp)) {
                    obj[temp].push(item);
                } else {
                    obj[temp] = [item];
                }

                if(annotations.indexOf(temp) === -1) {
                    annotations.push({ namespace: select.namespace, localName: select.localName });
                }
            }

            self.edit = function(obj, key, value, index) {
                obj[key][index]['@value'] = value;
            }
        }

        showAnnotations.$inject = ['$filter'];

        function showAnnotations($filter) {
            return function(obj, annotations) {
                var temp,
                    i = 0,
                    results = [];

                while(i < annotations.length) {
                    temp = annotations[i].namespace + annotations[i].localName;
                    if(obj.hasOwnProperty(temp)) {
                        results.push(temp);
                    }
                    i++;
                }

                return results;
            }
        }
})();