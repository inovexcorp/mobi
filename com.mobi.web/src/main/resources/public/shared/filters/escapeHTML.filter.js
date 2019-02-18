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