(function() {
    'use strict';

    angular
        .module('removeIriFromArray', ['responseObj'])
        .filter('removeIriFromArray', removeIriFromArray);

    removeIriFromArray.$inject = ['responseObj'];

    function removeIriFromArray(responseObj) {
        return function(arr, item) {
            var result = [];

            if(Array.isArray(arr) && arr.length && item) {
                var temp, j, found,
                    i = 0;

                while(i < arr.length) {
                    temp = responseObj.getItemIri(arr[i]);

                    if(Array.isArray(item)) {
                        j = 0;
                        found = false;
                        while(j < item.length) {
                            if(item[j].hasOwnProperty('@id') && temp === item[j]['@id']) {
                                found = true;
                                break;
                            }
                            j++;
                        }
                        if(!found) {
                            result.push(arr[i]);
                        }
                    } else if(item !== temp) {
                        result.push(arr[i]);
                    }
                    i++;
                }
            } else if(!item) {
                result = result.concat(arr);
            }

            return result;
        }
    }
})();