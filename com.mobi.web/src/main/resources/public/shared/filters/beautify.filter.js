(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name beautify
         *
         * @description
         * The `beautify` module only provides the `beautify` filter which takes a string
         * and capitalizes the first letter and adds space before every capital letter.
         */
        .module('beautify', [])
        /**
         * @ngdoc filter
         * @name beautify.filter:beautify
         * @kind function
         *
         * @description 
         * Takes a string, capitalizes the first letter, and adds space before every capital
         * letter. If the passed in value is falsey or an object, returns an empty string.
         *
         * @param {string} value The string to beautify
         * @returns {string} Either an empty string if the value is not a string or a beautified
         * version of the value if it is a string.
         */
        .filter('beautify', beautify);

    function beautify() {
        return function(value) {
            if (value && typeof value !== 'object') {
                return value
                    // insert a space between lower & upper
                    .replace(/([a-z])([A-Z])/g, '$1 $2')
                    // insert a space after number
                    .replace(/([0-9]+)/, '$1 ')
                    // insert a space before number that follows letters
                    .replace(/([a-zA-Z])([0-9]+)/, '$1 $2')
                    // space before last upper in a sequence followed by lower
                    .replace(/\b([A-Z]+)([A-Z])([a-z])/, '$1 $2$3')
                    // uppercase the first character
                    .replace(/^./, _.toUpper);
            }
            return '';
        }
    }
})();