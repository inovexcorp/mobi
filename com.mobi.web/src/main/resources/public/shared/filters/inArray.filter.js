(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name inArray
         *
         * @description
         * The `inArray` module only provides the `inArray` filter which filters an array by the
         * intersection with another array.
         */
        .module('inArray', [])
        /**
         * @ngdoc filter
         * @name inArray.filter:inArray
         * @kind function
         *
         * @description
         * Takes an array and removes any elements are not within the passed in array. If the passed
         * in array is not actually an array, returns an empty array.
         *
         * @param {*[]} list The array to remove elements from
         * @param {*[]} arrayFilter The array to intersect with the original list
         * @returns {*[]} Either an empty array if the passed in array is not actually an
         * array or the intersection of the two arrays.
         */
        .filter('inArray', inArray);

    function inArray() {
        return function(list, arrayFilter) {
            return _.isArray(list) && _.isArray(arrayFilter) ? _.intersection(list, arrayFilter) : [];
        }
    }
})();
