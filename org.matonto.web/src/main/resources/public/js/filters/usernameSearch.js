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
         * @name usernameSearch
         *
         * @description 
         * The `usernameSearch` module only provides the `usernameSearch` filter which takes
         * a string and converts it to camel case.
         */
        .module('usernameSearch', [])
        /**
         * @ngdoc filter
         * @name usernameSearch.filter:usernameSearch
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
        .filter('usernameSearch', usernameSearch);

    function usernameSearch() {
        return function(users, searchTerm) {
            var results = [];
            if (searchTerm) {
                var searchTermLower = searchTerm.toLowerCase();

                angular.forEach(users, function(userObj) {
                    var searchFields = [
                        userObj.username.toLowerCase(),
                        userObj.firstName.toLowerCase(),
                        userObj.lastName.toLowerCase(),
                        (userObj.firstName + " " + userObj.lastName).toLowerCase(),
                        (userObj.lastName + " " + userObj.firstName).toLowerCase(),
                        (userObj.lastName + ", " + userObj.firstName).toLowerCase()
                    ];
                    for (var i = 0; i < searchFields.length; i++) {
                        if (searchFields[i].match(searchTermLower)) {
                            results.push(userObj);
                            break;
                        }
                    }
                });
            } else {
                results = users;
            }

            return results;
        }
    }
})();