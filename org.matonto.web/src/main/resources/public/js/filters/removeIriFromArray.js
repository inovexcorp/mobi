(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name removeIriFromArray
         * @requires responseObj
         *
         * @description 
         * The `removeIriFromArray` module only provides the `removeIriFromArray` filter
         * which removes objects with a specific id from an array of objects.
         */
        .module('removeIriFromArray', ['responseObj'])
        /**
         * @ngdoc filter
         * @name removeIriFromArray.filter:removeIriFromArray
         * @kind function
         * @requires responseObj.responseObj
         *
         * @description 
         * Takes an array of objects and removes any elements that have an id that matches
         * the passed in item. If the passed in array is not actually an array, returns an 
         * empty array.
         *
         * @param {Object[]} arr The array of objects to remove elements from
         * @param {*} item The id value to match with objects in the array. Expects either 
         * an array or a string
         * @returns {Object} Either an empty array if the passed in array is not actually an 
         * array or an array of the elements of the passed in array that do not have matching
         * ids with the passed in item.
         */
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