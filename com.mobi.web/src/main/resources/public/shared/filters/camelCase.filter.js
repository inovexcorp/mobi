/*-
 * #%L
 * com.mobi.web
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