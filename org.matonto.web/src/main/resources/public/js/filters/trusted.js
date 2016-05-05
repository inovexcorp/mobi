(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name trusted
         *
         * @description 
         * The `trusted` module only provides the `trusted` filter which returns 
         * the HTML representation of a string
         */
        .module('trusted', [])
        /**
         * @ngdoc filter
         * @name trusted.filter:trusted
         * @kind function
         * @requires $sce
         *
         * @description 
         * Takes a string and uses the $sce service to generate the HTML 
         * representation of the string. If the passed in value is falsey, 
         * returns undefined.
         *
         * @param {string} text The string to inspect for HTML
         * @returns {*} Undefined if text is not a string or falsey; otherwise, 
         * the HTML generated from the text string
         */
        .filter('trusted', trusted);

    trusted.$inject = ['$sce'];

    function trusted($sce) {
        return function(text) {
            if(text && typeof text !== 'object') {
                return $sce.trustAsHtml(text);
            } else {
                return;
            }
        }
    }
})();