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
         * @name userManager
         *
         * @description
         * The `userManager` module only provides the `userManagerService` which provides
         * utilities for adding, removing, and editing Mobi users and groups.
         */
        .module('userManager', [])
        /**
         * @ngdoc service
         * @name userManager.service:userManagerService
         * @requires $http
         * @requires $q
         * @requires util.service:utilService
         * @requires prefixes.service:prefixes
         *
         * @description
         * `userManagerService` is a service that provides access to the Mobi users and
         * groups REST endpoints for adding, removing, and editing Mobi users and groups.
         */
        .service('userManagerService', userManagerService);

        userManagerService.$inject = ['$http', '$q', 'REST_PREFIX', 'utilService', 'prefixes'];

        function userManagerService($http, $q, REST_PREFIX, utilService, prefixes) {
            var self = this,
                userPrefix = REST_PREFIX + 'users',
                groupPrefix = REST_PREFIX + 'groups';
            var util = utilService;

            /**
             * @ngdoc property
             * @name groups
             * @propertyOf userManager.service:userManagerService
             * @type {object[]}
             *
             * @description
             * `groups` holds a list of objects representing the groups in Mobi. The structure of
             * each object is:
             * ```
             * {
             *    title: '',
             *    description: '',
             *    roles: [],
             *    members: []
             * }
             * ```
             */
            self.groups = [];
            /**
             * @ngdoc property
             * @name users
             * @propertyOf userManager.service:userManagerService
             * @type {object[]}
             *
             * @description
             * `users` holds a list of objects representing the users in Mobi. The structure of
             * each object is:
             * ```
             * {
             *    iri: '',
             *    username: '',
             *    firstName: '',
             *    lastName: '',
             *    email: '',
             *    roles: []
             * }
             * ```
             */
            self.users = [];

            /**
             * @ngdoc method
             * @name reset
             * @methodOf userManager.service:userManagerService
             *
             * @description
             * Resets all state variables.
             */
            self.reset = function() {
                self.users = [];
                self.groups = [];
            }
            /**
             * @ngdoc method
             * @name setUsers
             * @methodOf userManager.service:userManagerService
             * TODO: REDO DOCUMENTATION
             * @description
             * Initializes the {@link userManager.service:userManagerService#users users} and
             * {@link userManager.service:userManagerService#groups groups} lists. Uses
             * the results of the GET /mobirest/users, GET /mobirest/users/{username},
             * and GET /mobirest/users/{username}/roles endpoints for the users list. Uses the
             * results of the GET /mobirest/groups, GET /mobirest/groups/{groupTitle},
             * GET /mobirest/groups/{groupTitle}/roles, and GET /mobirest/groups/{groupTitle}/roles
             * endpoints for the groups list. If an error occurs in any of the HTTP calls,
             * logs the error on the console. Returns a promise.
             *
             * @return {Promise} A Promise that indicates the function has completed.
             */
            self.initialize = function() {
                return self.getUsers()
                    .then(data => {
                        self.users = _.map(data, self.getUserObj);
                        return self.getGroups();
                    }, $q.reject)
                    .then(data => {
                        self.groups = _.map(data, self.getGroupObj)
                    }, error => console.log(util.getErrorMessage(error)));
            }
            /**
             * @ngdoc method
             * @name getUsers
             * @methodOf userManager.service:userManagerService
             *
             * @description
             * Calls the GET /mobirest/users endpoint which retrieves a list of Users without their passwords.
             *
             * @return {Promise} A promise that resolves with the list of Users or rejects with an error message.
             */
            self.getUsers = function() {
                return $http.get(userPrefix)
                    .then(response => response.data, util.rejectError);
            }
            /**
             * @ngdoc method
             * @name getGroups
             * @methodOf userManager.service:userManagerService
             *
             * @description
             * Calls the GET /mobirest/groups endpoint which retrieves a list of Groups.
             *
             * @return {Promise} A promise that resolves with the list of Groups or rejects with an error message.
             */
            self.getGroups = function() {
                return $http.get(groupPrefix)
                    .then(response => response.data, util.rejectError);
            }
            /**
             * @ngdoc method
             * @name getUsername
             * @methodOf userManager.service:userManagerService
             *
             * @description
             * Finds the username of the user associated with the passed IRI. If it has not been found before,
             * calls the GET /mobirest/users/username endpoint and saves the result in the
             * {@link userManager.service:userManagerService#users users} list. If it has been found before,
             * grabs the username from the users list. Returns a Promise that resolves with the username and rejects
             * if the endpoint fails.
             *
             * @param {string} iri The user IRI to search for
             * @return {Promise} A Promise that resolves with the username if the user was found; rejects with an
             * error message otherwise
             */
            self.getUsername = function(iri) {
                var config = { params: { iri } };
                var user = _.find(self.users, { iri });
                if (user) {
                    return $q.when(user.username);
                } else {
                    return $http.get(userPrefix + '/username', config)
                        .then(response => {
                            _.set(_.find(self.users, {username: response.data}), 'iri', iri);
                            return response.data;
                        }, util.rejectError);
                }
            }

            /**
             * @ngdoc method
             * @name addUser
             * @methodOf userManager.service:userManagerService
             *
             * @description
             * Calls the POST /mobirest/users endpoint to add the passed user to Mobi. Returns a Promise
             * that resolves if the addition was successful and rejects with an error message if it was not.
             * Updates the {@link userManager.service:userManagerService#users users} list appropriately.
             *
             * @param {Object} newUser the new user to add
             * @param {string} newUser.username The required username for the user
             * @param {string[]} newUser.roles The required roles for the user
             * @param {string} newUser.firstName The optional first name of the user
             * @param {string} newUser.lastName The optional last name of the user
             * @param {string} newUser.email The optional email for the user
             * @param {string} password the password for the new user
             * @return {Promise} A Promise that resolves if the request was successful; rejects
             * with an error message otherwise
             */
            self.addUser = function(newUser, password) {
                var fd = new FormData(),
                    config = {
                        transformRequest: _.identity,
                        headers: {
                            'Content-Type': undefined
                        },
                    };
                fd.append('username', newUser.username);
                fd.append('password', password);
                _.forEach(_.get(newUser, 'roles', []), role => fd.append('roles', role));
                if (_.has(newUser, 'firstName')) {
                    fd.append('firstName', newUser.firstName);
                }
                if (_.has(newUser, 'lastName')) {
                    fd.append('lastName', newUser.lastName);
                }
                if (_.has(newUser, 'email')) {
                    fd.append('email', newUser.email);
                }

                return $http.post(userPrefix, fd, config)
                    .then(response => {
                        return self.getUser(newUser.username);
                    }, util.rejectError)
                    .then(user => {
                        self.users.push(user);
                    }, util.rejectError);
            }
            /**
             * @ngdoc method
             * @name getUser
             * @methodOf userManager.service:userManagerService
             *
             * @description
             * Retrieves the userId and Calls the GET /mobirest/users/{userId} endpoint to retrieve a Mobi user
             * with passed username. Returns a Promise that resolves with the result of the call
             * if it was successful and rejects with an error message if it was not.
             *
             * @param {string} username the username of the user to retrieve
             * @return {Promise} A Promise that resolves with the user if the request was successful;
             * rejects with an error message otherwise
             */
            self.getUser = function(username) {
                return $http.get(userPrefix + '/' + encodeURIComponent(username))
                    .then(response => self.getUserObj(response.data), util.rejectError);
            }
            /**
             * @ngdoc method
             * @name updateUser
             * @methodOf userManager.service:userManagerService
             *
             * @description
             * Calls the PUT /mobirest/users/{username} endpoint to update a Mobi user specified
             * by the passed username with the passed new user. Returns a Promise that resolves if it
             * was successful and rejects with an error message if it was not. Updates the
             * {@link userManager.service:userManagerService#users users} list appropriately.
             *
             * @param {string} username the username of the user to retrieve
             * @param {Object} newUser an object containing all the new user information to
             * save. The structure of the object should be the same as the structure of the user
             * objects in the {@link userManager.service:userManagerService#users users list}
             * @return {Promise} A Promise that resolves if the request was successful; rejects
             * with an error message otherwise
             */
            self.updateUser = function(username, newUser) {
                return $http.put(userPrefix + '/' + encodeURIComponent(username), self.getUserJson(newUser))
                    .then(response => {
                        _.assign(_.find(self.users, {username}), newUser);
                    }, util.rejectError);
            }
            /**
             * @ngdoc method
             * @name changePassword
             * @methodOf userManager.service:userManagerService
             *
             * @description
             * Calls the POST /mobirest/users/{username}/password endpoint to change the password of
             * a Mobi user specified by the passed username. Requires the user's current password to
             * succeed. Returns a Promise that resolves if it was successful and rejects with an error
             * message if it was not.
             *
             * @param {string} username the username of the user to update
             * @param {string} password the current password of the user
             * @param {string} newPassword the new password to save for the user
             * @return {Promise} A Promise that resolves if the request was successful; rejects
             * with an error message otherwise
             */
            self.changePassword = function(username, password, newPassword) {
                var config = {
                    params: {
                        currentPassword: password,
                        newPassword
                    }
                };
                return $http.post(userPrefix + '/' + encodeURIComponent(username) + '/password', null, config)
                    .then(_.noop, util.rejectError);
            }
            /**
             * @ngdoc method
             * @name resetPassword
             * @methodOf userManager.service:userManagerService
             *
             * @description
             * Calls the PUT /mobirest/users/{username}/password endpoint to reset the password of
             * a Mobi user specified by the passed username. Can only be performed by an admin user.
             * Returns a Promise that resolves if it was successful and rejects with an error message
             * if it was not.
             *
             * @param {string} username the username of the user to update
             * @param {string} newPassword the new password to save for the user
             * @return {Promise} A Promise that resolves if the request was successful; rejects
             * with an error message otherwise
             */
            self.resetPassword = function(username, newPassword) {
                var config = { params: { newPassword } };
                return $http.put(userPrefix + '/' + encodeURIComponent(username) + '/password', null, config)
                    .then(_.noop, util.rejectError);
            }
            /**
             * @ngdoc method
             * @name deleteUser
             * @methodOf userManager.service:userManagerService
             *
             * @description
             * Calls the DELETE /mobirest/users/{username} endpoint to remove the Mobi user
             * with passed username. Returns a Promise that resolves if the deletion was successful
             * and rejects with an error message if it was not. Updates the
             * {@link userManager.service:userManagerService#groups groups} list appropriately.
             *
             * @param {string} username the username of the user to remove
             * @return {Promise} A Promise that resolves if the request was successful; rejects with
             * an error message otherwise
             */
            self.deleteUser = function(username) {
                return $http.delete(userPrefix + '/' + encodeURIComponent(username))
                    .then(response => {
                        _.remove(self.users, {username});
                        _.forEach(self.groups, group => _.pull(group.members, username));
                    }, util.rejectError);
            }
            /**
             * @ngdoc method
             * @name addUserRole
             * @methodOf userManager.service:userManagerService
             *
             * @description
             * Calls the PUT /mobirest/users/{username}/roles endpoint to add the passed
             * roles to the Mobi user specified by the passed username. Returns a Promise
             * that resolves if the addition was successful and rejects with an error message
             * if not. Updates the {@link userManager.service:userManagerService#users users}
             * list appropriately.
             *
             * @param {string} username the username of the user to add a role to
             * @param {string[]} roles the roles to add to the user
             * @return {Promise} A Promise that resolves if the request is successful; rejects
             * with an error message otherwise
             */
            self.addUserRoles = function(username, roles) {
                var config = { params: { roles } };
                return $http.put(userPrefix + '/' + encodeURIComponent(username) + '/roles', null, config)
                    .then(response => {
                        var user = _.find(self.users, {username});
                        user.roles = _.union(_.get(user, 'roles', []), roles);
                    }, util.rejectError);
            }
            /**
             * @ngdoc method
             * @name deleteUserRole
             * @methodOf userManager.service:userManagerService
             *
             * @description
             * Calls the DELETE /mobirest/users/{username}/roles endpoint to remove the passed
             * role from the Mobi user specified by the passed username. Returns a Promise
             * that resolves if the deletion was successful and rejects with an error message
             * if not. Updates the {@link userManager.service:userManagerService#users users}
             * list appropriately.
             *
             * @param {string} username the username of the user to remove a role from
             * @param {string} role the role to remove from the user
             * @return {Promise} A Promise that resolves if the request is successful; rejects
             * with an error message otherwise
             */
            self.deleteUserRole = function(username, role) {
                var config = { params: { role } };
                return $http.delete(userPrefix + '/' + encodeURIComponent(username) + '/roles', config)
                    .then(response => {
                        _.pull(_.get(_.find(self.users, {username}), 'roles'), role);
                    }, util.rejectError);
            }
            /**
             * @ngdoc method
             * @name addUserGroup
             * @methodOf userManager.service:userManagerService
             *
             * @description
             * Calls the PUT /mobirest/users/{username}/groups endpoint to add the Mobi user specified
             * by the passed username to the group specified by the passed group title. Returns a Promise
             * that resolves if the addition was successful and rejects with an error message if not.
             * Updates the {@link userManager.service:userManagerService#groups groups} list appropriately.
             *
             * @param {string} username the username of the user to add to the group
             * @param {string} groupTitle the title of the group to add the user to
             * @return {Promise} A Promise that resolves if the request is successful; rejects
             * with an error message otherwise
             */
            self.addUserGroup = function(username, groupTitle) {
                var config = {
                    params: {
                        group: groupTitle
                    }
                };
                return $http.put(userPrefix + '/' + encodeURIComponent(username) + '/groups', null, config)
                    .then(response => {
                        var group = _.find(self.groups, {title: groupTitle});
                        group.members = _.union(_.get(group, 'members', []), [username]);
                    }, util.rejectError);
            }
            /**
             * @ngdoc method
             * @name deleteUserGroup
             * @methodOf userManager.service:userManagerService
             *
             * @description
             * Calls the DELETE /mobirest/users/{username}/groups endpoint to remove the Mobi
             * user specified by the passed username from the group specified by the passed group
             * title. Returns a Promise that resolves if the deletion was successful and rejects
             * with an error message if not. Updates the
             * {@link userManager.service:userManagerService#groups groups} list appropriately.
             *
             * @param {string} username the username of the user to remove from the group
             * @param {string} groupTitle the title of the group to remove the user from
             * @return {Promise} A Promise that resolves if the request is successful; rejects
             * with an error message otherwise
             */
            self.deleteUserGroup = function(username, groupTitle) {
                var config = {
                    params: {
                        group: groupTitle
                    }
                };
                return $http.delete(userPrefix + '/' + encodeURIComponent(username) + '/groups', config)
                    .then(response => {
                        _.pull(_.get(_.find(self.groups, {title: groupTitle}), 'members'), username);
                    }, util.rejectError);
            }
            /**
             * @ngdoc method
             * @name addGroup
             * @methodOf userManager.service:userManagerService
             *
             * @description
             * Calls the POST /mobirest/groups endpoint to add the passed group to Mobi. Returns
             * a Promise that resolves if the addition was successful and rejects with an error message
             * if it was not. Updates the {@link userManager.service:userManagerService#groups groups}
             * list appropriately.
             *
             * @param {Object} newGroup the new group to add
             * @param {string} newGroup.title the required title of the group
             * @param {string} newGroup.description the optional description of the group
             * @param {string[]} newGroup.roles the optional roles of the group
             * @param {string[]} newGroup.members the required members of the group
             * @return {Promise} A Promise that resolves if the request was successful; rejects
             * with an error message otherwise
             */
            self.addGroup = function(newGroup) {
                var fd = new FormData(),
                    config = {
                        transformRequest: _.identity,
                        headers: {
                            'Content-Type': undefined
                        },
                    };
                fd.append('title', newGroup.title);
                _.forEach(_.get(newGroup, 'members', []), member => fd.append('members', member));
                if (_.has(newGroup, 'description')) {
                    fd.append('description', newGroup.description);
                }
                if (_.has(newGroup, 'roles')) {
                    _.forEach(_.get(newGroup, 'roles', []), role => fd.append('roles', role));
                }

                return $http.post(groupPrefix, fd, config)
                    .then(response => {
                        return self.getGroup(newGroup.title);
                    }, $q.reject)
                    .then(group => {
                        self.groups.push(group);
                    }, util.rejectError);
            }
            /**
             * @ngdoc method
             * @name getGroup
             * @methodOf userManager.service:userManagerService
             *
             * @description
             * Calls the GET /mobirest/groups/{groupTitle} endpoint to retrieve a Mobi group
             * with passed title. Returns a Promise that resolves with the result of the call
             * if it was successful and rejects with an error message if it was not.
             *
             * @param {string} groupTitle the title of the group to retrieve
             * @return {Promise} A Promise that resolves with the group if the request was successful;
             * rejects with an error message otherwise
             */
            self.getGroup = function(groupTitle) {
                return $http.get(groupPrefix + '/' + encodeURIComponent(groupTitle))
                    .then(response => self.getGroupObj(response.data), util.rejectError);
            }
            /**
             * @ngdoc method
             * @name updateGroup
             * @methodOf userManager.service:userManagerService
             *
             * @description
             * Calls the PUT /mobirest/groups/{groupTitle} endpoint to update a Mobi group specified
             * by the passed title with the passed new group. Returns a Promise that resolves if it
             * was successful and rejects with an error message if it was not. Updates the
             * {@link userManager.service:userManagerService#groups groups} list appropriately.
             *
             * @param {string} title the title of the group to update
             * @param {Object} newGroup an object containing all the new group information to
             * save. The structure of the object should be the same as the structure of the group
             * objects in the {@link userManager.service:userManagerService#groups groups list}
             * @return {Promise} A Promise that resolves if the request was successful; rejects
             * with an error message otherwise
             */
            self.updateGroup = function(groupTitle, newGroup) {
                return $http.put(groupPrefix + '/' + encodeURIComponent(groupTitle), self.getGroupJson(newGroup))
                    .then(response => {
                        _.assign(_.find(self.groups, {title: groupTitle}), newGroup);
                    }, util.rejectError);
            }
            /**
             * @ngdoc method
             * @name deleteGroup
             * @methodOf userManager.service:userManagerService
             *
             * @description
             * Calls the DELETE /mobirest/groups/{groupTitle} endpoint to remove the Mobi group
             * with passed title. Returns a Promise that resolves if the deletion was successful
             * and rejects with an error message if it was not. Updates the
             * {@link userManager.service:userManagerService#groups groups} list appropriately.
             *
             * @param {string} groupTitle the title of the group to remove
             * @return {Promise} A Promise that resolves if the request was successful; rejects with
             * an error message otherwise
             */
            self.deleteGroup = function(groupTitle) {
                return $http.delete(groupPrefix + '/' + encodeURIComponent(groupTitle))
                    .then(response => {
                        _.remove(self.groups, {title: groupTitle});
                    }, util.rejectError);
            }
            /**
             * @ngdoc method
             * @name addGroupRole
             * @methodOf userManager.service:userManagerService
             *
             * @description
             * Calls the PUT /mobirest/groups/{groupTitle}/roles endpoint to add the passed
             * roles to the Mobi group specified by the passed title. Returns a Promise
             * that resolves if the addition was successful and rejects with an error message
             * if not. Updates the {@link userManager.service:userManagerService#groups groups}
             * list appropriately.
             *
             * @param {string} groupTitle the title of the group to add a role to
             * @param {string[]} roles the roles to add to the group
             * @return {Promise} A Promise that resolves if the request is successful; rejects
             * with an error message otherwise
             */
            self.addGroupRoles = function(groupTitle, roles) {
                var config = { params: { roles } };
                return $http.put(groupPrefix + '/' + encodeURIComponent(groupTitle) + '/roles', null, config)
                    .then(response => {
                        var group = _.find(self.groups, {title: groupTitle});
                        group.roles = _.union(_.get(group, 'roles', []), roles);
                    }, util.rejectError);
            }
            /**
             * @ngdoc method
             * @name deleteGroupRole
             * @methodOf userManager.service:userManagerService
             *
             * @description
             * Calls the DELETE /mobirest/groups/{groupTitle}/roles endpoint to remove the passed
             * role from the Mobi group specified by the passed title. Returns a Promise
             * that resolves if the deletion was successful and rejects with an error message
             * if not. Updates the {@link userManager.service:userManagerService#groups groups}
             * list appropriately.
             *
             * @param {string} groupTitle the title of the group to remove a role from
             * @param {string} role the role to remove from the group
             * @return {Promise} A Promise that resolves if the request is successful; rejects
             * with an error message otherwise
             */
            self.deleteGroupRole = function(groupTitle, role) {
                var config = { params: { role } };
                return $http.delete(groupPrefix + '/' + encodeURIComponent(groupTitle) + '/roles', config)
                    .then(response => {
                        _.pull(_.get(_.find(self.groups, {title: groupTitle}), 'roles'), role);
                    }, util.rejectError);
            }
            /**
             * @ngdoc method
             * @name getGroupUsers
             * @methodOf userManager.service:userManagerService
             *
             * @description
             * Calls the GET /mobirest/groups/{groupTitle}/users endpoint to retrieve the list of
             * users assigned to the Mobi group specified by the passed title. Returns a Promise
             * that resolves with the result of the call is successful and rejects with an error message
             * if it was not.
             *
             * @param  {string} groupTitle the title of the group to retrieve users from
             * @return {Promise} A Promise that resolves if the request is successful; rejects with an
             * error message otherwise
             */
            self.getGroupUsers = function(groupTitle) {
                return $http.get(groupPrefix + '/' + encodeURIComponent(groupTitle) + '/users')
                    .then(response => response.data, util.rejectError);
            }
            /**
             * @ngdoc method
             * @name addGroupUsers
             * @methodOf userManager.service:userManagerService
             *
             * @description
             * Calls the PUT /mobirest/groups/{groupTitle}/users endpoint to add the Mobi
             * users specified by the passed array of usernames to the group specified by the
             * passed group title. Returns a Promise that resolves if the addition was successful
             * and rejects with an error message if not. Updates the
             * {@link userManager.service:userManagerService#groups groups} list appropriately.
             *
             * @param {string} groupTitle the title of the group to add users to
             * @param {string[]} users an array of usernames of users to add to the group
             * @return {Promise} A Promise that resolves if the request is successful; rejects
             * with an error message otherwise
             */
            self.addGroupUsers = function(groupTitle, users) {
                var config = { params: { users } };
                return $http.put(groupPrefix + '/' + encodeURIComponent(groupTitle) + '/users', null, config)
                    .then(response => {
                        var group = _.find(self.groups, {title: groupTitle});
                        group.members = _.union(_.get(group, 'members', []), users);
                    }, util.rejectError);
            }
            /**
             * @ngdoc method
             * @name deleteGroupUser
             * @methodOf userManager.service:userManagerService
             *
             * @description
             * Calls the DELETE /mobirest/groups/{groupTitle}/users endpoint to remove the Mobi
             * user specified by the passed username from the group specified by the passed group
             * title. Returns a Promise that resolves if the deletion was successful and rejects
             * with an error message if not. Updates the
             * {@link userManager.service:userManagerService#groups groups} list appropriately.
             *
             * @param {string} groupTitle the title of the group to remove the user from
             * @param {string} username the username of the user to remove from the group
             * @return {Promise} A Promise that resolves if the request is successful; rejects
             * with an error message otherwise
             */
            self.deleteGroupUser = function(groupTitle, username) {
                var config = {
                    params: {
                        user: username
                    }
                };
                return $http.delete(groupPrefix + '/' + encodeURIComponent(groupTitle) + '/users', config)
                    .then(response => {
                        _.pull(_.get(_.find(self.groups, {title: groupTitle}), 'members'), username);
                    }, util.rejectError);
            }
            /**
             * @ngdoc method
             * @name isAdmin
             * @methodOf userManager.service:userManagerService
             *
             * @description
             * Tests whether the user with the passed username is an admin or not by checking the
             * roles assigned to the user itself and the roles assigned to any groups the user
             * is a part of.
             *
             * @param {string} username the username of the user to test whether they are an admin
             * @return {boolean} true if the user is an admin; false otherwise
             */
            self.isAdmin = function(username) {
                if (_.includes(_.get(_.find(self.users, {username}), 'roles', []), 'admin')) {
                    return true;
                } else {
                    var userGroups = _.filter(self.groups, group => {
                        return _.includes(group.members, username);
                    });
                    return _.includes(_.flatten(_.map(userGroups, 'roles')), 'admin');
                }
            }
            /**
             * @ngdoc method
             * @name getUserDisplay
             * @methodOf userManager.service:userManagerService
             *
             * @description
             * Returns a human readable form of a user. It will default to the "firstName lastName". If both of those
             * properties are not present, it will return the "username". If the username is not present, it will return
             * "[Not Available]".
             *
             * @param {object} userObject the object which represents a user.
             * @return {string} a string to identify for the provided user.
             */
            self.getUserDisplay = function(userObject) {
                return (_.get(userObject, 'firstName') && _.get(userObject, 'lastName')) ? userObject.firstName + ' ' + userObject.lastName : _.get(userObject, 'username', '[Not Available]');
            }
            /**
             * //TODO: DOCUMENT THIS
             * @param jsonld
             * @return {{jsonld: *, iri: *, username: (string|*), firstName: (string|*), lastName: (string|*), email: (string|*), roles: *}}
             */
            self.getUserObj = function(jsonld) {
                return {
                    jsonld,
                    iri: jsonld['@id'],
                    username: util.getPropertyValue(jsonld, prefixes.user + 'username'),
                    firstName: util.getPropertyValue(jsonld, prefixes.foaf + 'firstName'),
                    lastName: util.getPropertyValue(jsonld, prefixes.foaf + 'lastName'),
                    email: util.getPropertyId(jsonld, prefixes.foaf + 'mbox'),
                    roles: _.map(jsonld[prefixes.user + 'hasUserRole'], role => util.getBeautifulIRI(role['@id']).toLowerCase())
                }
            }
            /**
             * //TODO: DOCUMENT THIS
             * @param jsonld
             */
            self.getGroupObj = function(jsonld) {
                return {
                    jsonld,
                    iri: jsonld['@id'],
                    title: util.getDctermsValue(jsonld, 'title'),
                    description: util.getDctermsValue(jsonld, 'description'),
                    members: _.map(jsonld[prefixes.foaf + 'member'], member => {
                        var user = _.find(self.users, {'iri': member['@id']});
                        if (user != undefined) {
                            return user.username;
                        }
                    }),
                    roles: _.map(jsonld[prefixes.user + 'hasGroupRole'], role => util.getBeautifulIRI(role['@id']).toLowerCase())
                }
            }

            self.getUserJson = function(user) {
                var jsonld = user.jsonld;

                jsonld[prefixes.user + 'username'] =  [{'@value': user.username}];
                jsonld[prefixes.foaf + 'firstName'] = [{'@value': user.firstName}];
                jsonld[prefixes.foaf + 'lastName'] = [{'@value': user.lastName}];
                jsonld[prefixes.foaf + 'mbox'] = [{'@id': user.email}];
                jsonld[prefixes.user + 'hasUserRole'] = [];
                _.forEach(user.roles, role => jsonld[prefixes.user + 'hasUserRole'].push({'@id': prefixes.roles + role}));

                return jsonld;
            }

            self.getGroupJson = function(group) {
                var jsonld = group.jsonld;

                util.updateDctermsValue(jsonld, 'title', group.title);
                util.updateDctermsValue(jsonld, 'description', group.description);
                jsonld[prefixes.foaf + 'member'] = [];
                _.forEach(group.members, member => {
                    var user = _.find(self.users, {'username': member});
                    if (user != undefined) {
                        jsonld[prefixes.foaf + 'member'].push({'@id': user.iri})
                    }
                });
                jsonld[prefixes.user + 'hasGroupRole'] = [];
                _.forEach(group.roles, role => jsonld[prefixes.user + 'hasGroupRole'].push({'@id': prefixes.roles + role}));

                return jsonld;
            }

            function listUserRoles(username) {
                return $http.get(userPrefix + '/' + encodeURIComponent(username) + '/roles')
                    .then(response => response.data, util.rejectError);
            }

            function listUserGroups(username) {
                return $http.get(userPrefix + '/' + encodeURIComponent(username) + '/groups')
                    .then(response => response.data, util.rejectError);
            }

            function listGroupRoles(groupTitle) {
                return $http.get(groupPrefix + '/' + encodeURIComponent(groupTitle) + '/roles')
                    .then(response => response.data, util.rejectError);
            }
        }
})();
