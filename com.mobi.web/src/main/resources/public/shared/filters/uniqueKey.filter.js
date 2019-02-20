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

    function uniqueKey() {
        return function(collection, keyField) {
            var results = [];
            var keys = [];

            // do not filter if no path was provided
            if (!keyField || _.isEmpty(keyField)) {
                return collection;
            }
            //do filter
            _.forEach(collection, item => {
                var key = _.get(item, keyField);
                if (key && _.indexOf(keys, key) === -1) {
                    keys.push(key);
                    results.push(item);
                }
            });
            return results;
        }
    }

    angular
        .module('shared')
        /**
         * @ngdoc filter
         * @name shared.filter:uniqueKey
         * @kind function
         *
         * @description 
         * Takes an array of items and returns an array without duplicates based on a given key
         *
         * @param {Object[]} collection The array from which to remove duplicates
         * @param {string} keyField The value on which to match
         * @returns {Object[]} The original array minus any duplicate entries
         */
        .filter('uniqueKey', uniqueKey);
})();