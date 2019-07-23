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

    /**
     * @ngdoc filter
     * @name shared.filter:showProperties
     * @kind function
     *
     * @description
     * Takes an Object and array of property strings, checks whether or not the Object has that property, and
     * returns an array of the properties it does have.
     *
     * @param {Object} entity The Object to check if it has the properties
     * @param {string[]} properties The array of property strings
     * @returns {Object[]} Either an empty array or a string array of the properties from that list that the entity
     * has.
     */
    function showProperties() {
        return function(entity, properties) {
            var arr = [];
            if (_.isArray(properties)) {
                arr = _.filter(properties, property => _.has(entity, property));
            }
            return arr;
        }
    }

    angular.module('shared')
        .filter('showProperties', showProperties);
})();
