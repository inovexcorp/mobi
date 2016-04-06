(function() {
    'use strict';

    angular
        .module('updateRefs', [])
        .service('updateRefsService', updateRefsService);

    function updateRefsService() {
        var self = this;

        self.update = function(obj, old, fresh, owl) {
            var temp, prop, i, arr, excluded,
                exclude = [
                    '$$hashKey',
                    'context',
                    'unsaved'
                ];

            // iterates over all of the properties of the object
            for(prop in obj) {
                excluded = exclude.indexOf(prop);

                // checks to see if the property contains the old string
                if(prop.indexOf(old) !== -1 && excluded === -1) {
                    // copies current value
                    temp = angular.copy(obj[prop]);
                    // deletes property
                    delete obj[prop];
                    // adds new property name
                    prop = prop.replace(old, fresh);
                    obj[prop] = temp;
                }

                // do nothing for these situations
                if(excluded !== -1 || !obj[prop] || prop === '@id') {
                    // do nothing
                }
                // iterates through the array and recursively calls this function
                else if(Object.prototype.toString.call(obj[prop]) === '[object Array]') {
                    i = obj[prop].length;
                    while(i--) {
                        // means that it is the annotationList
                        if(typeof obj[prop][i] === 'string') {
                            obj[prop][i] = obj[prop][i].replace(old, fresh);
                        }
                        // else, something else
                        else {
                            self.update(obj[prop][i], old, fresh, owl);
                        }
                    }
                }
                // recursively call this function
                else if(typeof obj[prop] === 'object') {
                    self.update(obj[prop], old, fresh, owl);
                }
                // remove the old prefix and replace it with the new
                else if(obj[prop].indexOf(old) !== -1) {
                    obj[prop] = obj[prop].replace(old, fresh);
                }
            }
        }
    }
})();