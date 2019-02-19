/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
 * %%
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */
(function() {
    'use strict';

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

    angular
        .module('shared')
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
})();