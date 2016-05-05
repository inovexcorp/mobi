(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name camelCase
         *
         * @description 
         * The `camelCase` module only provides the `camelCase` filter which takes 
         * a string and converts it to camel case.
         */
        .module('camelCase', [])
        /**
         * @ngdoc filter
         * @name camelCase.filter:camelCase
         * @kind function
         *
         * @description 
         * Takes a string and converts it to camel case with a captial first letter if
         * the type if "class" or a lowercase first letter if the type is not "class". 
         * If the value is falsey or an object, returns an empty string.
         *
         * @param {string} value The string to camel case
         * @param {string} type The type of camel casing that should be performed. Either
         * "class" or something else.
         * @returns {string} Either an empty string is the value is not a string or the 
         * value in camel case if it is a string.
         */
        .filter('camelCase', camelCase);

    function camelCase() {
        return function(value, type) {
            var result = '';

            if(value && typeof value !== 'object') {
                var capitalize = false,
                    whitespace = /\s/,
                    alphaNumeric = /[a-zA-Z0-9]/,
                    i = 1;

                if(type === 'class') {
                    result += value[0].toUpperCase();
                } else {
                    result += value[0].toLowerCase();
                }

                while(i < value.length) {
                    if(value[i].match(whitespace) !== null) {
                        capitalize = true;
                    } else if(value[i].match(alphaNumeric) === null) {
                        // do nothing with non letters
                    } else if(capitalize || (i === 0 && type === 'class')) {
                        result += value[i].toUpperCase();
                        capitalize = false;
                    } else {
                        result += value[i];
                    }
                    i++;
                }
            }
            return result;
        }
    }
})();