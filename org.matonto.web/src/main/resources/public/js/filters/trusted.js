(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name trusted
         *
         * @description 
         * The `trusted` module only provides the `trusted` filter which
         * tests whether the passed in string does not contain any HTML.
         */
        .module('trusted', [])
        /**
         * @ngdoc filter
         * @name trusted.filter:trusted
         * @kind function
         * @requires  $sce
         *
         * @description 
         * Takes a string and uses the $sce service to test whether the string
         * contains any HTML. Used for sanitizing user input. The the passed in
         * value is falsey, returns false.
         *
         * @param {string} text The string to inspect for HTML
         * @returns {boolean} True if the passed in text contains no HTML; false
         * if the value is falsey or if it contains HTML
         */
        .filter('trusted', trusted);

    trusted.$inject = ['$sce'];

    function trusted($sce) {
        return function(text) {
            if(text) {
                return $sce.trustAsHtml(text);
            } else {
                return;
            }
        }
    }
})();