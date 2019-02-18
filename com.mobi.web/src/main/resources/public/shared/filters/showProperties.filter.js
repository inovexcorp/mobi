(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name showProperties
         *
         * @description
         * The `showProperties` module only provides the `showProperties` filter which takes an Object and an array of
         * property strings and returns an array of the properties that the Object has from that array.
         */
        .module('showProperties', [])
        /**
         * @ngdoc filter
         * @name showProperties.filter:showProperties
         * @kind function
         *
         * @description
         * Takes an Object and array of property strings, checks whether or not the Object has that property, and
         * returns an array of the properties it does have.
         *
         * @param {Object} entity The Object to check if it has the properties
         * @param {string[]} properties The array of property strings
         * @returns {Object[]} Either an empty array or a string array of the properties from that list that the entity
         * has.
         */
        .filter('showProperties', showProperties);

    function showProperties() {
        return function(entity, properties) {
            var arr = [];
            if (_.isArray(properties)) {
                arr = _.filter(properties, property => _.has(entity, property));
            }
            return arr;
        }
    }
})();
