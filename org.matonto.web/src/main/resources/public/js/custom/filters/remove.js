(function() {
    'use strict';

    angular
        .module('remove', [])
        .filter('remove', remove);

    function remove() {
        return function(arr, item) {
            var temp, j, found,
                result = [],
                i = 0;

            while(i < arr.length) {
                temp = arr[i].namespace + arr[i].localName;
                if(Array.isArray(item)) {
                    j = 0;
                    found = false;
                    while(j < item.length) {
                        if(temp === item[j]['@id']) {
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
            return result;
        }
    }
})();