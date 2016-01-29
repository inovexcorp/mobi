(function() {
    'use strict';

    angular
        .module('annotationManager', ['responseObj', 'splitIRI'])
        .service('annotationManagerService', annotationManagerService)
        .filter('showAnnotations', showAnnotations);

        annotationManagerService.$inject = ['$filter', 'responseObj']

        function annotationManagerService($filter, responseObj) {
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

                if(select.namespace === 'New Annotation') {
                    temp = key;
                    if(responseObj.stringify(annotations).indexOf(temp) === -1) {
                        var split = $filter('splitIRI')(temp);
                        annotations.push({ namespace: split.begin + split.then, localName: split.end });
                    }
                } else {
                    temp = select.namespace + select.localName;
                }

                if(obj.hasOwnProperty(temp)) {
                    obj[temp].push(item);
                } else {
                    obj[temp] = [item];
                }
            }

            self.edit = function(obj, key, value, index) {
                obj[key][index]['@value'] = value;
            }
        }

        function showAnnotations() {
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