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
(function () {
    'use strict';

    /**
     * @ngdoc component
     * @name user-management.component:usersList
     * @requires shared.service:userManagerService
     * @requires shared.service:userStateService
     * @requires shared.service:loginManagerService
     *
     * @description
     * `usersList` is a component that creates an unordered list containing the provided list of `users`. The list will
     * be filtered by the provided `searchText` if present. The `selectedUser` variable determines which user in the
     * list should be styled as if it is selected. The provided `clickEvent` function is expected to update the value of
     * `selectedUser`.
     * 
     * @param {Object[]} users An array of user Objects
     * @param {Object} [selectedUser=undefined] The selected user to be styled
     * @param {Function} clickEvent A function to be called when a user is clicked. Should update the value of
     * `selectedUser`. Expects an argument called `user`.
     * @param {string} searchText Text that should be used to filter the list of users.
     */
    const usersListComponent = {
        templateUrl: 'user-management/components/usersList/usersList.component.html',
        bindings: {
            users: '<',
            selectedUser: '<',
            clickEvent: '&',
            searchText: '<'
        },
        controllerAs: 'dvm',
        controller: usersListComponentCtrl
    };

    usersListComponentCtrl.$inject = ['userManagerService'];

    function usersListComponentCtrl(userManagerService) {
        var dvm = this;
        dvm.um = userManagerService;
        dvm.filteredUsers = [];

        dvm.$onInit = function() {
            dvm.filteredUsers = filterUsers();
        }
        dvm.$onChanges = function() {
            dvm.filteredUsers = filterUsers();
        }

        /**
         * Filters the list of users and finds matches to the search text. Matches are made based on any of the
         * following user values:
         *   user.username
         *   user.firstName
         *   user.lastName
         *   user.firstName + " " + user.lastName
         *   user.lastName + " " + user.firstName
         *   user.lastName + ," " + user.firstName
         */
        function filterUsers() {
            var results = dvm.users;
            if (dvm.searchText) {
                var searchTermLower = dvm.searchText.toLowerCase();

                results = _.filter(dvm.users, userObj => {
                    var searchFields = [
                        userObj.username.toLowerCase(),
                        userObj.firstName.toLowerCase(),
                        userObj.lastName.toLowerCase(),
                        (userObj.firstName + " " + userObj.lastName).toLowerCase(),
                        (userObj.lastName + " " + userObj.firstName).toLowerCase(),
                        (userObj.lastName + ", " + userObj.firstName).toLowerCase()
                    ];
                    return _.some(searchFields, searchField => searchField.match(searchTermLower));
                });
            }

            return results.sort((user1, user2) => user1.username.localeCompare(user2.username));
        }
    }

    angular.module('user-management')
        .component('usersList', usersListComponent);
})();
