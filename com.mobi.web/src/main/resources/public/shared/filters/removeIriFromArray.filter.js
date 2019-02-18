(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name removeIriFromArray
         *
         * @description
         * The `removeIriFromArray` module only provides the `removeIriFromArray` filter
         * which removes a specific id from an array of strings.
         */
        .module('removeIriFromArray', [])
        /**
         * @ngdoc filter
         * @name removeIriFromArray.filter:removeIriFromArray
         * @kind function
         *
         * @description
         * Takes an array of id strings and removes any elements that have matching ids based on
         * the passed in toRemove. The passed in toRemove could be a string with an id or an array of
         * objects with the components of an id as keys. If the passed in array is not
         * actually an array, returns an empty array.
         *
         * @param {string[]} arr The array of strings to remove elements from
         * @param {string|Object[]} toRemove The id value(s) to match with objects in the array.
         * Expects either a string or an array of objects with the components of the ids
         * @returns {Object} Either an empty array if the passed in array is not actually an
         * array or an array of the elements of the passed in array that do not have matching
         * ids based on the passed in toRemove.
         */
        .filter('removeIriFromArray', removeIriFromArray);

    function removeIriFromArray() {
        function hasId(id, arr) {
            return _.some(arr, obj => id === _.get(obj, '@id'));
        }

        return function(arr, toRemove) {
            var result = [];

            if (_.isArray(arr) && arr.length && toRemove) {
                var removeIsArray = _.isArray(toRemove);
                result = _.filter(arr, iri => (removeIsArray && !hasId(iri, toRemove)) || (!removeIsArray && toRemove !== iri));
            } else if (!toRemove) {
                result = result.concat(arr);
            }

            return result;
        }
    }
})();
