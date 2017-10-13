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
         * @name removeIriFromArray
         * @requires responseObj
         *
         * @description
         * The `removeIriFromArray` module only provides the `removeIriFromArray` filter
         * which removes objects with a specific id from an array of objects.
         */
        .module('removeIriFromArray', [])
        /**
         * @ngdoc filter
         * @name removeIriFromArray.filter:removeIriFromArray
         * @kind function
         * @requires responseObj.responseObj
         *
         * @description
         * Takes an array of objects and removes any elements that have matching ids based on
         * the passed in toRemove. The passed in toRemove could be a string with an id or an array of
         * objects with the components of an id as keys. If the passed in array is not
         * actually an array, returns an empty array.
         *
         * @param {Object[]} arr The array of objects to remove elements from
         * @param {string|Object[]} toRemove The id value(s) to match with objects in the array.
         * Expects either a string or an array of objects with the components of the ids
         * @returns {Object} Either an empty array if the passed in array is not actually an
         * array or an array of the elements of the passed in array that do not have matching
         * ids based on the passed in toRemove.
         */
        .filter('removeIriFromArray', removeIriFromArray);

    removeIriFromArray.$inject = ['responseObj'];

    function removeIriFromArray(responseObj) {
        function hasId(id, arr) {
            return _.some(arr, function(obj) {
                return id === _.get(obj, '@id');
            });
        }

        return function(arr, toRemove) {
            var result = [];

            if(_.isArray(arr) && arr.length && toRemove) {
                var itemIri,
                    removeIsArray = _.isArray(toRemove),
                    i = 0;

                result = _.filter(arr, function(obj) {
                    itemIri = responseObj.getItemIri(obj);
                    return (removeIsArray && !hasId(itemIri, toRemove)) || (!removeIsArray && toRemove !== itemIri);
                });
            } else if(!toRemove) {
                result = result.concat(arr);
            }

            return result;
        }
    }
})();
