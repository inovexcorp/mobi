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

    angular
        .module('shared')
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
})();