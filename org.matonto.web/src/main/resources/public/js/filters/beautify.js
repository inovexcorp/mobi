(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name beautify
         *
         * @description
         * The `beautify` module only provides the `beautify` filter which takes a string
         * and capitalizes the first letter and adds space before every captial letter.
         */
        .module('beautify', [])
        /**
         * @ngdoc filter
         * @name beautify.filter:beautify
         * @kind function
         *
         * @description 
         * Takes a string, capitalizes the first letter, and adds space before every captial 
         * letter. If the passed in value is falsey or an object, returns an empty string.
         *
         * @param {string} value The string to beautify
         * @returns {string} Either an empty string if the value is not a stirng or a beautified 
         * version of the value if it is a string.
         */
        .filter('beautify', beautify);

    function beautify() {
        return function(value) {
            var result = '';

            if(value && typeof value !== 'object') {
                var reg = /[A-Z]/,
                    i = 1;
                result += value[0].toUpperCase();

                while(i < value.length) {
                    if(value[i].match(reg) !== null) {
                        result += ' ';
                    }
                    result += value[i];
                    i++;
                }
            }
            return result;
        }
    }
})();