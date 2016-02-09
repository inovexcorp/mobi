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

                if(responseObj.validateItem(select)) {
                    if(select.localName === 'New Annotation') {
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
                } else {
                    console.warn('The current selected item doesn\'t have a namespace or localName.', select);
                }
            }

            self.edit = function(obj, key, value, index) {
                obj[key][index]['@value'] = value;
            }
        }

        showAnnotations.$inject = ['responseObj'];

        function showAnnotations(responseObj) {
            return function(obj, annotations) {
                var arr = [];

                if(Array.isArray(annotations)) {
                    var temp, item,
                        i = 0;

                    while(i < annotations.length) {
                        item = annotations[i];
                        if(responseObj.validateItem(item)) {
                            temp = item.namespace + item.localName;
                            if(obj.hasOwnProperty(temp)) {
                                arr.push(temp);
                            }
                        }
                        i++;
                    }
                }

                return arr;
            }
        }
})();