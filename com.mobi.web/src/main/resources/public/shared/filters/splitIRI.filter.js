(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name splitIRI
         *
         * @description
         * The `splitIRI` module only provides the `splitIri` directive which splits
         * an IRI string based on the last valid delimiter it finds.
         */
        .module('splitIRI', [])
        /**
         * @ngdoc filter
         * @name splitIRI.filter:splitIRI
         * @kind function
         *
         * @description
         * Splits an IRI string based on the last valid delimiter (#, /, or :) it finds
         * and returns the beginning, delimiter, and ending in a JSON object. The JSON
         * object looks like this:
         * ```
         * {
         *     begin: 'http://mobi.com/ontologies',
         *     then: '/',
         *     end: 'uhtc'
         * }
         * ```
         * If the IRI string is falsey, the JSON object will have empty string values.
         * Assumes that the IRI is valid.
         *
         * @param {string} iri The IRI string to split
         * @returns {object} An object with keys for the beginning, delimiter, and end
         * of the IRI string.
         */
        .filter('splitIRI', splitIRI);

    function splitIRI() {
        return function(iri) {
            if(iri && typeof iri !== 'object') {
                var hash = iri.indexOf('#');
                var slash = iri.lastIndexOf('/');
                var colon = iri.lastIndexOf(':');
                var index = _.max([hash, slash, colon]);

                return {
                    begin: iri.substring(0, index),
                    then: iri[index],
                    end: iri.substring(index + 1)
                }
            } else {
                return {
                    begin: '',
                    then: '',
                    end: ''
                };
            }
        }
    }
})();