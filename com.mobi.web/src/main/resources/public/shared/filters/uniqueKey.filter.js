(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name uniqueKey
         *
         * @description 
         * The `uniqueKey` module only provides the `uniqueKey` filter
         * which filters out duplicate keys.
         */
        .module('uniqueKey', [])
        /**
         * @ngdoc filter
         * @name uniqueKey.filter:uniqueKey
         * @kind function
         *
         * @description 
         * Takes an array of items and returns an array without duplicates based on a given key
         *
         * @param {Object[]} collection The array from which to remove duplicates
         * @param {string} keyField The value on which to match
         * @returns {Object[]} The original array minus any duplicate entries
         */
        .filter('uniqueKey', uniqueKey);

    function uniqueKey() {
        return function(collection, keyField) {
            var results = [];
            var keys = [];

            // do not filter if no path was provided
            if (!keyField || _.isEmpty(keyField)) {
                return collection;
            }
            //do filter
            _.forEach(collection, item => {
                var key = _.get(item, keyField);
                if (key && _.indexOf(keys, key) === -1) {
                    keys.push(key);
                    results.push(item);
                }
            });
            return results;
        }
    }
})();