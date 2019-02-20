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
         * @name usernameSearch
         *
         * @description 
         * The `usernameSearch` module only provides the `usernameSearch` filter
         * which finds matches between an array of users and a search string.
         */
        .module('usernameSearch', [])
        /**
         * @ngdoc filter
         * @name usernameSearch.filter:usernameSearch
         * @kind function
         *
         * @description 
         * Takes an array of users and finds matches to a given search string.
         * Matches are made based on any of the following user values:
         *   user.username
         *   user.firstName
         *   user.lastName
         *   user.firstName + " " + user.lastName
         *   user.lastName + " " + user.firstName
         *   user.lastName + ," " + user.firstName
         *
         * @param {array} users The array of users to match
         * @param {string} searchTerm The string to use in matching
         * @returns {array} Either an empty array or the matching users, if any.
         */
        .filter('usernameSearch', usernameSearch);

    function usernameSearch() {
        return function(users, searchTerm) {
            var results = [];
            if (searchTerm) {
                var searchTermLower = searchTerm.toLowerCase();

                _.forEach(users, userObj => {
                    var searchFields = [
                        userObj.username.toLowerCase(),
                        userObj.firstName.toLowerCase(),
                        userObj.lastName.toLowerCase(),
                        (userObj.firstName + " " + userObj.lastName).toLowerCase(),
                        (userObj.lastName + " " + userObj.firstName).toLowerCase(),
                        (userObj.lastName + ", " + userObj.firstName).toLowerCase()
                    ];
                    if (_.some(searchFields, searchField => searchField.match(searchTermLower))) {
                        results.push(userObj);
                    }
                });
            } else {
                results = users;
            }

            return results;
        }
    }
})();