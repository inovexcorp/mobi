(function() {
    'use strict';

    angular
        .module('removeIriFromArray', ['responseObj'])
        .filter('removeIriFromArray', removeIriFromArray);

    removeIriFromArray.$inject = ['responseObj'];

    function removeIriFromArray(responseObj) {
        function hasItem(item, arr) {
            var j = 0;

            while(j < arr.length) {
                if(arr[j].hasOwnProperty('@id') && item === arr[j]['@id']) {
                    return true;
                }
                j++;
            }

            return false;
        }

        return function(arr, item) {
            var result = [];

            if(Array.isArray(arr) && arr.length && item) {
                var itemIri,
                    itemIsArray = Array.isArray(item),
                    i = 0;

                while(i < arr.length) {
                    itemIri = responseObj.getItemIri(arr[i]);
                    if((itemIsArray && !hasItem(itemIri, item)) || (!itemIsArray && item !== itemIri)) {
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