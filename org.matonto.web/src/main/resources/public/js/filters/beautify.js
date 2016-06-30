/*-
 * #%L
 * org.matonto.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
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