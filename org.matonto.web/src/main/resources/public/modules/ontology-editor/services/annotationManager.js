(function() {
    'use strict';

    var newAnnotationString = 'New OWL AnnotationProperty';

    angular
        .module('annotationManager', ['responseObj', 'splitIRI'])
        .service('annotationManagerService', annotationManagerService)
        .filter('showAnnotations', showAnnotations);

        annotationManagerService.$inject = ['$filter', 'responseObj'];

        function annotationManagerService($filter, responseObj) {
            var self = this;

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
                    if(select.localName === newAnnotationString) {
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

            self.getLocalNameLowercase = function(item) {
                if(item.localName === newAnnotationString) {
                    return -1;
                }
                return item.localName.toLowerCase();
            }
        }

        showAnnotations.$inject = ['responseObj'];

        function showAnnotations(responseObj) {
            return function(obj, annotations) {
                var arr = [];

                if(Array.isArray(annotations)) {
                    var itemIri, item,
                        i = 0;

                    while(i < annotations.length) {
                        item = annotations[i];
                        if(responseObj.validateItem(item)) {
                            itemIri = responseObj.getItemIri(item);
                            if(obj.hasOwnProperty(itemIri)) {
                                arr.push(item);
                            }
                        }
                        i++;
                    }
                }

                return arr;
            }
        }
})();