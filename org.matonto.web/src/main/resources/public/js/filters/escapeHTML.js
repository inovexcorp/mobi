(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name escapeHTML
         *
         * @description 
         * The `escapeHTML` module only provides the `escapeHTML` filter which
         * converts any any special characters in a string into escaped characters.
         */
        .module('escapeHTML', [])
        /**
         * @ngdoc filter
         * @name escapeHTML.filter:escapeHTML
         * @kind function
         *
         * @description 
         * Takes a string and using a document text node, converts any special 
         * characters in a string into escaped characters. For example, a '<' in 
         * a string would turn into '&lt;'. If the passed in value is falsey,
         * returns an empty string.
         *
         * @param {string} text The string to escape characters in
         * @returns {string} Either an empty string if the value is falsey or 
         * a copy of the value with escaped characters 
         */
        .filter('escapeHTML', escapeHTML);

    function escapeHTML() {
        return function(text) {
            if(text) {
                var node = document.createTextNode(text);
                var div = document.createElement('div');
                div.appendChild(node);
                return div.innerHTML;
            } else {
                return '';
            }
        }
    }
})();