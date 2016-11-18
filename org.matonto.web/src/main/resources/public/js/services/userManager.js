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
         * @name userManager
         *
         * @description
         * The `userManager` module only provides the `userManagerService` which provides
         * utilities for adding, removing, and editing MatOnto users and groups.
         */
        .module('userManager', [])
        /**
         * @ngdoc service
         * @name userManager.service:userManagerService
         * @requires $rootScope
         * @requires $http
         * @requires $q
         *
         * @description
         * `userManagerService` is a service that provides access to the MatOnto users and
         * groups REST endpoints for adding, removing, and editing MatOnto users and groups.
         */
        .service('userManagerService', userManagerService);

        userManagerService.$inject = ['$rootScope', '$http', '$q'];

        function userManagerService($rootScope, $http, $q) {
            var self = this,
                userPrefix = '/matontorest/users',
                groupPrefix = '/matontorest/groups';

            /**
             * @ngdoc property
             * @name groups
             * @propertyOf userManager.service:userManagerService
             * @type {object[]}
             *
             * @description
             * `groups` holds a list of objects representing the groups in MatOnto. The structure of
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
             * `users` holds a list of objects representing the users in MatOnto. The structure of
             * each object is:
             * ```
             * {
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
             *
             * @description
             * Initializes the {@link userManager.service:userManagerService#users users} and
             * {@link userManager.service:userManagerService#groups groups} lists. Uses
             * the results of the GET /matontorest/users, GET /matontorest/users/{username},
             * and GET /matontorest/users/{username}/roles endpoints for the users list. Uses the
             * results of the GET /matontorest/groups, GET /matontorest/groups/{groupTitle},
             * GET /matontorest/groups/{groupTitle}/roles, and GET /matontorest/groups/{groupTitle}/roles
             * endpoints for the groups list. If an error occurs in any of the HTTP calls,
             * logs the error on the console.
             */
            self.initialize = function() {
                $rootScope.showSpinner = true;
                $http.get(userPrefix)
                    .then(response => {
                        return $q.all(_.map(response.data, username => self.getUser(username)));
                    }, response => $q.reject(response))
                    .then(responses => {
                        self.users = responses;
                        return $q.all(_.map(self.users, user => listUserRoles(user.username)));
                    }, response => $q.reject(response))
                    .then(responses => {
                        _.forEach(responses, (response, idx) => {
                            self.users[idx].roles = response;
                        });
                    }, response => {
                        console.log(_.get(response, 'statusText', 'Something went wrong. Could not load users.'));
                    })
                    .then(() => $rootScope.showSpinner = false);

                $rootScope.showSpinner = true;
                $http.get(groupPrefix)
                    .then(response => {
                        return $q.all(_.map(response.data, groupTitle => self.getGroup(groupTitle)));
                    }, response => $q.reject(response))
                    .then(responses => {
                        self.groups = responses;
                        return $q.all(_.map(self.groups, group => self.getGroupUsers(group.title)));
                    }, response => $q.reject(response))
                    .then(responses => {
                        _.forEach(responses, (response, idx) => {
                            self.groups[idx].members = _.map(response, 'username');
                        });
                        return $q.all(_.map(self.groups, group => listGroupRoles(group.title)));
                    }, response => $q.reject(response))
                    .then(responses => {
                        _.forEach(responses, (response, idx) => {
                            self.groups[idx].roles = response;
                        });
                    }, response => {
                        console.log(_.get(response, 'statusText', 'Something went wrong. Could not load groups.'));
                    })
                    .then(() => $rootScope.showSpinner = false);
            }

            /**
             * @ngdoc method
             * @name addUser
             * @methodOf userManager.service:userManagerService
             *
             * @description
             * Calls the POST /matontorest/users endpoint to add the passed user to MatOnto. Returns a Promise
             * that resolves if the addition was successful and rejects with an error message if it was not.
             * Updates the {@link userManager.service:userManagerService#users users} list appropriately.
             *
             * @param {string} newUser the new user to add
             * @param {string} password the password for the new user
             * @return {Promise} A Promise that resolves if the request was successful; rejects
             * with an error message otherwise
             */
            self.addUser = function(newUser, password) {
                var deferred = $q.defer(),
                    config = {
                        params: {
                            password: password
                        }
                    };

                $rootScope.showSpinner = true;
                $http.post(userPrefix, newUser, config)
                    .then(response => {
                        deferred.resolve();
                        self.users.push(newUser);
                    }, error => {
                        deferred.reject(_.get(error, 'statusText', 'Something went wrong. Please try again later.'));
                    }).then(() => {
                        $rootScope.showSpinner = false;
                    });
                return deferred.promise;
            }
            /**
             * @ngdoc method
             * @name getUser
             * @methodOf userManager.service:userManagerService
             *
             * @description
             * Calls the GET /matontorest/users/{username} endpoint to retrieve a MatOnto user
             * with passed username. Returns a Promise that resolves with the result of the call
             * if it was successful and rejects with an error message if it was not.
             *
             * @param {string} username the username of the user to retrieve
             * @return {Promise} A Promise that resolves with the user if the request was successful;
             * rejects with an error message otherwise
             */
            self.getUser = function(username) {
                var deferred = $q.defer();

                $rootScope.showSpinner = true;
                $http.get(userPrefix + '/' + username)
                    .then(response => {
                        deferred.resolve(response.data);
                    }, error => {
                        deferred.reject(_.get(error, 'statusText', 'Something went wrong. Please try again later.'));
                    }).then(() => {
                        $rootScope.showSpinner = false;
                    });
                return deferred.promise;
            }
            /**
             * @ngdoc method
             * @name updateUser
             * @methodOf userManager.service:userManagerService
             *
             * @description
             * Calls the PUT /matontorest/users/{username} endpoint to update a MatOnto user specified
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
                var deferred = $q.defer();

                $rootScope.showSpinner = true;
                $http.put(userPrefix + '/' + username, newUser)
                    .then(response => {
                        deferred.resolve();
                        self.users.splice(_.findIndex(self.users, {username}), 1, newUser);
                    }, error => {
                        deferred.reject(_.get(error, 'statusText', 'Something went wrong. Please try again later.'));
                    }).then(() => {
                        $rootScope.showSpinner = false;
                    });
                return deferred.promise;
            }
            /**
             * @ngdoc method
             * @name updateUser
             * @methodOf userManager.service:userManagerService
             *
             * @description
             * Calls the PUT /matontorest/users/{username}/password endpoint to update the password of
             * a MatOnto user specified by the passed username. Requires the user's current password to
             * succeed. Returns a Promise that resolves if it was successful and rejects with an error
             * message if it was not.
             *
             * @param {string} username the username of the user to update
             * @param {string} password the current password of the user
             * @param {string} newPassword the new password to save for the user
             * @return {Promise} A Promise that resolves if the request was successful; rejects
             * with an error message otherwise
             */
            self.updatePassword = function(username, password, newPassword) {
                var deferred = $q.defer(),
                    config = {
                        params: {
                            currentPassword: password,
                            newPassword: newPassword
                        }
                    };

                $rootScope.showSpinner = true;
                $http.put(userPrefix + '/' + username + '/password', null, config)
                    .then(response => {
                        deferred.resolve();
                    }, error => {
                        deferred.reject(_.get(error, 'statusText', 'Something went wrong. Please try again later.'));
                    }).then(() => {
                        $rootScope.showSpinner = false;
                    });
                return deferred.promise;
            }
            /**
             * @ngdoc method
             * @name deleteUser
             * @methodOf userManager.service:userManagerService
             *
             * @description
             * Calls the DELETE /matontorest/users/{username} endpoint to remove the MatOnto user
             * with passed username. Returns a Promise that resolves if the deletion was successful
             * and rejects with an error message if it was not. Updates the
             * {@link userManager.service:userManagerService#groups groups} list appropriately.
             *
             * @param {string} username the username of the user to remove
             * @return {Promise} A Promise that resolves if the request was successful; rejects with
             * an error message otherwise
             */
            self.deleteUser = function(username) {
                var deferred = $q.defer();

                $rootScope.showSpinner = true;
                $http.delete(userPrefix + '/' + username)
                    .then(response => {
                        deferred.resolve();
                        _.remove(self.users, {username: username});
                        _.forEach(self.groups, group => _.pull(group.members, username));
                    }, error => {
                        deferred.reject(_.get(error, 'statusText', 'Something went wrong. Please try again later.'));
                    }).then(() => {
                        $rootScope.showSpinner = false;
                    });
                return deferred.promise;
            }
            /**
             * @ngdoc method
             * @name addUserRole
             * @methodOf userManager.service:userManagerService
             *
             * @description
             * Calls the PUT /matontorest/users/{username}/roles endpoint to add the passed
             * role to the MatOnto user specified by the passed username. Returns a Promise
             * that resolves if the addition was successful and rejects with an error message
             * if not. Updates the {@link userManager.service:userManagerService#users users}
             * list appropriately.
             *
             * @param {string} username the username of the user to add a role to
             * @param {string} role the role to add to the user
             * @return {Promise} A Promise that resolves if the request is successful; rejects
             * with an error message otherwise
             */
            self.addUserRole = function(username, role) {
                var deferred = $q.defer(),
                    config = {
                        params: {
                            role: role
                        }
                    };

                $rootScope.showSpinner = true;
                $http.put(userPrefix + '/' + username + '/roles', null, config)
                    .then(response => {
                        deferred.resolve();
                        _.get(_.find(self.users, {username: username}), 'roles').push(role);
                    }, error => {
                        deferred.reject(_.get(error, 'statusText', 'Something went wrong. Please try again later.'));
                    }).then(() => {
                        $rootScope.showSpinner = false;
                    });
                return deferred.promise;
            }
            /**
             * @ngdoc method
             * @name deleteUserRole
             * @methodOf userManager.service:userManagerService
             *
             * @description
             * Calls the DELETE /matontorest/users/{username}/roles endpoint to remove the passed
             * role from the MatOnto user specified by the passed username. Returns a Promise
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
                var deferred = $q.defer(),
                    config = {
                        params: {
                            role: role
                        }
                    };

                $rootScope.showSpinner = true;
                $http.delete(userPrefix + '/' + username + '/roles', config)
                    .then(response => {
                        deferred.resolve();
                        _.pull(_.get(_.find(self.users, {username: username}), 'roles'), role);
                    }, error => {
                        deferred.reject(_.get(error, 'statusText', 'Something went wrong. Please try again later.'));
                    }).then(() => {
                        $rootScope.showSpinner = false;
                    });
                return deferred.promise;
            }
            /**
             * @ngdoc method
             * @name addUserGroup
             * @methodOf userManager.service:userManagerService
             *
             * @description
             * Calls the PUT /matontorest/users/{username}/groups endpoint to add the MatOnto user specified
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
                var deferred = $q.defer(),
                    config = {
                        params: {
                            group: groupTitle
                        }
                    };

                $rootScope.showSpinner = true;
                $http.put(userPrefix + '/' + username + '/groups', null, config)
                    .then(response => {
                        deferred.resolve();
                        _.get(_.find(self.groups, {title: groupTitle}), 'members').push(username);
                    }, error => {
                        deferred.reject(_.get(error, 'statusText', 'Something went wrong. Please try again later.'));
                    }).then(() => {
                        $rootScope.showSpinner = false;
                    });
                return deferred.promise;
            }
            /**
             * @ngdoc method
             * @name deleteUserGroup
             * @methodOf userManager.service:userManagerService
             *
             * @description
             * Calls the DELETE /matontorest/users/{username}/groups endpoint to remove the MatOnto
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
                var deferred = $q.defer(),
                    config = {
                        params: {
                            group: groupTitle
                        }
                    };

                $rootScope.showSpinner = true;
                $http.delete(userPrefix + '/' + username + '/groups', config)
                    .then(response => {
                        deferred.resolve();
                        _.pull(_.get(_.find(self.groups, {title: groupTitle}), 'members'), username);
                    }, error => {
                        deferred.reject(_.get(error, 'statusText', 'Something went wrong. Please try again later.'));
                    }).then(() => {
                        $rootScope.showSpinner = false;
                    });
                return deferred.promise;
            }
            /**
             * @ngdoc method
             * @name addGroup
             * @methodOf userManager.service:userManagerService
             *
             * @description
             * Calls the POST /matontorest/groups endpoint to add the passed group to MatOnto. Returns
             * a Promise that resolves if the addition was successful and rejects with an error message
             * if it was not. Updates the {@link userManager.service:userManagerService#groups groups}
             * list appropriately.
             *
             * @param {Object} newGroup the new group to add
             * @return {Promise} A Promise that resolves if the request was successful; rejects
             * with an error message otherwise
             */
            self.addGroup = function(newGroup) {
                var deferred = $q.defer();

                $rootScope.showSpinner = true;
                $http.post(groupPrefix, newGroup)
                    .then(response => {
                        deferred.resolve();
                        self.groups.push(newGroup);
                    }, error => {
                        deferred.reject(_.get(error, 'statusText', 'Something went wrong. Please try again later.'));
                    }).then(() => {
                        $rootScope.showSpinner = false;
                    });
                return deferred.promise;
            }
            /**
             * @ngdoc method
             * @name getGroup
             * @methodOf userManager.service:userManagerService
             *
             * @description
             * Calls the GET /matontorest/groups/{groupTitle} endpoint to retrieve a MatOnto group
             * with passed title. Returns a Promise that resolves with the result of the call
             * if it was successful and rejects with an error message if it was not.
             *
             * @param {string} groupTitle the title of the group to retrieve
             * @return {Promise} A Promise that resolves with the group if the request was successful;
             * rejects with an error message otherwise
             */
            self.getGroup = function(groupTitle) {
                var deferred = $q.defer();

                $rootScope.showSpinner = true;
                $http.get(groupPrefix + '/' + groupTitle)
                    .then(response => {
                        deferred.resolve(response.data);
                    }, error => {
                        deferred.reject(_.get(error, 'statusText', 'Something went wrong. Please try again later.'));
                    }).then(() => {
                        $rootScope.showSpinner = false;
                    });
                return deferred.promise;
            }
            /**
             * @ngdoc method
             * @name updateGroup
             * @methodOf userManager.service:userManagerService
             *
             * @description
             * Calls the PUT /matontorest/groups/{groupTitle} endpoint to update a MatOnto group specified
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
                var deferred = $q.defer();

                $rootScope.showSpinner = true;
                $http.put(groupPrefix + '/' + groupTitle, newGroup)
                    .then(response => {
                        deferred.resolve();
                        self.groups.splice(_.findIndex(self.groups, {title: groupTitle}), 1, newGroup);
                    }, error => {
                        deferred.reject(_.get(error, 'statusText', 'Something went wrong. Please try again later.'));
                    }).then(() => {
                        $rootScope.showSpinner = false;
                    });
                return deferred.promise;
            }
            /**
             * @ngdoc method
             * @name deleteGroup
             * @methodOf userManager.service:userManagerService
             *
             * @description
             * Calls the DELETE /matontorest/groups/{groupTitle} endpoint to remove the MatOnto group
             * with passed title. Returns a Promise that resolves if the deletion was successful
             * and rejects with an error message if it was not. Updates the
             * {@link userManager.service:userManagerService#groups groups} list appropriately.
             *
             * @param {string} groupTitle the title of the group to remove
             * @return {Promise} A Promise that resolves if the request was successful; rejects with
             * an error message otherwise
             */
            self.deleteGroup = function(groupTitle) {
                var deferred = $q.defer();

                $rootScope.showSpinner = true;
                $http.delete(groupPrefix + '/' + groupTitle)
                    .then(response => {
                        deferred.resolve();
                        _.remove(self.groups, {title: groupTitle});
                    }, error => {
                        deferred.reject(_.get(error, 'statusText', 'Something went wrong. Please try again later.'));
                    }).then(() => {
                        $rootScope.showSpinner = false;
                    });
                return deferred.promise;
            }
            /**
             * @ngdoc method
             * @name addGroupRole
             * @methodOf userManager.service:userManagerService
             *
             * @description
             * Calls the PUT /matontorest/groups/{groupTitle}/roles endpoint to add the passed
             * role to the MatOnto group specified by the passed title. Returns a Promise
             * that resolves if the addition was successful and rejects with an error message
             * if not. Updates the {@link userManager.service:userManagerService#groups groups}
             * list appropriately.
             *
             * @param {string} groupTitle the title of the group to add a role to
             * @param {string} role the role to add to the group
             * @return {Promise} A Promise that resolves if the request is successful; rejects
             * with an error message otherwise
             */
            self.addGroupRole = function(groupTitle, role) {
                var deferred = $q.defer(),
                    config = {
                        params: {
                            role: role
                        }
                    };

                $rootScope.showSpinner = true;
                $http.put(groupPrefix + '/' + groupTitle + '/roles', null, config)
                    .then(response => {
                        deferred.resolve();
                        _.get(_.find(self.groups, {title: groupTitle}), 'roles').push(role);
                    }, error => {
                        deferred.reject(_.get(error, 'statusText', 'Something went wrong. Please try again later.'));
                    }).then(() => {
                        $rootScope.showSpinner = false;
                    });
                return deferred.promise;
            }
            /**
             * @ngdoc method
             * @name deleteGroupRole
             * @methodOf userManager.service:userManagerService
             *
             * @description
             * Calls the DELETE /matontorest/groups/{groupTitle}/roles endpoint to remove the passed
             * role from the MatOnto group specified by the passed title. Returns a Promise
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
                var deferred = $q.defer(),
                    config = {
                        params: {
                            role: role
                        }
                    };

                $rootScope.showSpinner = true;
                $http.delete(groupPrefix + '/' + groupTitle + '/roles', config)
                    .then(response => {
                        deferred.resolve();
                        _.pull(_.get(_.find(self.groups, {title: groupTitle}), 'roles'), role);
                    }, error => {
                        deferred.reject(_.get(error, 'statusText', 'Something went wrong. Please try again later.'));
                    }).then(() => {
                        $rootScope.showSpinner = false;
                    });
                return deferred.promise;
            }
            /**
             * @ngdoc method
             * @name getGroupUsers
             * @methodOf userManager.service:userManagerService
             *
             * @description
             * Calls the GET /matontorest/groups/{groupTitle}/users endpoint to retrieve the list of
             * users assigned to the MatOnto group specified by the passed title. Returns a Promise
             * that resolves with the result of the call is successful and rejects with an error message
             * if it was not.
             *
             * @param  {string} groupTitle the title of the group to retrieve users from
             * @return {Promise} A Promise that resolves if the request is successful; rejects with an
             * error message otherwise
             */
            self.getGroupUsers = function(groupTitle) {
                var deferred = $q.defer();

                $rootScope.showSpinner = true;
                $http.get(groupPrefix + '/' + groupTitle + '/users')
                    .then(response => {
                        deferred.resolve(response.data);
                    }, error => {
                        deferred.reject(_.get(error, 'statusText', 'Something went wrong. Please try again later.'));
                    }).then(() => {
                        $rootScope.showSpinner = false;
                    });
                return deferred.promise;
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
                if (_.includes(_.get(_.find(self.users, {username: username}), 'roles', []), 'admin')) {
                    return true;
                } else {
                    var userGroups = _.filter(self.groups, group => {
                        return _.includes(group.members, username);
                    });
                    return _.includes(_.flatten(_.map(userGroups, 'roles')), 'admin');
                }
            }

            function listUserRoles(username) {
                var deferred = $q.defer();

                $rootScope.showSpinner = true;
                $http.get(userPrefix + '/' + username + '/roles')
                    .then(response => {
                        deferred.resolve(response.data);
                    }, error => {
                        deferred.reject(_.get(error, 'statusText', 'Something went wrong. Please try again later.'));
                    }).then(() => {
                        $rootScope.showSpinner = false;
                    });
                return deferred.promise;
            }

            function listUserGroups(username) {
                var deferred = $q.defer();

                $rootScope.showSpinner = true;
                $http.get(userPrefix + '/' + username + '/groups')
                    .then(response => {
                        deferred.resolve(response.data);
                    }, error => {
                        deferred.reject(_.get(error, 'statusText', 'Something went wrong. Please try again later.'));
                    }).then(() => {
                        $rootScope.showSpinner = false;
                    });
                return deferred.promise;
            }

            function listGroupRoles(groupTitle) {
                var deferred = $q.defer();

                $rootScope.showSpinner = true;
                $http.get(groupPrefix + '/' + groupTitle + '/roles')
                    .then(response => {
                        deferred.resolve(response.data);
                    }, error => {
                        deferred.reject(_.get(error, 'statusText', 'Something went wrong. Please try again later.'));
                    }).then(() => {
                        $rootScope.showSpinner = false;
                    });
                return deferred.promise;
            }
        }
})();
