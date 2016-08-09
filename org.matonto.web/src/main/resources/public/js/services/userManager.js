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
        .module('userManager', [])
        .service('userManagerService', userManagerService);

        userManagerService.$inject = ['$rootScope', '$http', '$q'];

        function userManagerService($rootScope, $http, $q) {
            var self = this,
                userPrefix = '/matontorest/users',
                groupPrefix = '/matontorest/groups';

            self.groups = [];
            self.users = [];

            function initialize() {
                self.setUsers().then(response => {
                    self.setGroups();                
                });
            }

            self.setUsers = function() {
                return getUsers().then(users => {
                    self.users = users;
                    return $q.all(_.map(self.users, user => listUserRoles(user.username)));
                }).then(responses => {
                    _.forEach(responses, (response, idx) => {
                        self.users[idx].roles = response;
                    });
                });
            }

            self.setGroups = function() {
                return getGroups().then(groups => {
                    self.groups = groups;
                    return $q.all(_.map(self.groups, group => listGroupMembers(group.name)));
                }).then(responses => {
                    _.forEach(responses, (response, idx) => {
                        self.groups[idx].members = _.map(response, 'username');
                    });
                });
            }

            self.addUser = function(username, password) {
                var deferred = $q.defer(),
                    config = {
                        params: {
                            username: username,
                            password: password
                        }
                    };

                $rootScope.showSpinner = true;
                $http.post(userPrefix, null, config)
                    .then(response => {
                        deferred.resolve();
                        self.users.push({username: username, roles: []});
                    }, error => {
                        deferred.reject(_.get(error, 'statusText', 'Something went wrong. Please try again later.'));
                    }).then(() => {
                        $rootScope.showSpinner = false;
                    });
                return deferred.promise;
            }

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

            self.updateUser = function(username, newUsername, password) {
                var deferred = $q.defer(),
                    config = {
                        params: {
                            username: newUsername,
                            password: password
                        }
                    };

                $rootScope.showSpinner = true;
                $http.put(userPrefix + '/' + username, null, config)
                    .then(response => {
                        deferred.resolve();
                        var original = _.find(self.users, {username: username});
                        if (newUsername) {
                            _.set(original, 'username', newUsername);
                        }
                    }, error => {
                        deferred.reject(_.get(error, 'statusText', 'Something went wrong. Please try again later.'));
                    }).then(() => {
                        $rootScope.showSpinner = false;
                    });
                return deferred.promise;
            }

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

            self.addUserGroup = function(username, groupName) {
                var deferred = $q.defer(),
                    config = {
                        params: {
                            group: groupName
                        }
                    };

                $rootScope.showSpinner = true;
                $http.put(userPrefix + '/' + username + '/groups', null, config)
                    .then(response => {
                        deferred.resolve();
                        _.get(_.find(self.groups, {name: groupName}), 'members').push(username);
                    }, error => {
                        deferred.reject(_.get(error, 'statusText', 'Something went wrong. Please try again later.'));
                    }).then(() => {
                        $rootScope.showSpinner = false;
                    });
                return deferred.promise;
            }

            self.deleteUserGroup = function(username, groupName) {
                var deferred = $q.defer(),
                    config = {
                        params: {
                            group: groupName
                        }
                    };

                $rootScope.showSpinner = true;
                $http.delete(userPrefix + '/' + username + '/groups', config)
                    .then(response => {
                        deferred.resolve();
                        _.pull(_.get(_.find(self.groups, {name: groupName}), 'members'), username);
                    }, error => {
                        deferred.reject(_.get(error, 'statusText', 'Something went wrong. Please try again later.'));
                    }).then(() => {
                        $rootScope.showSpinner = false;
                    });
                return deferred.promise;
            }

            self.addGroup = function(groupName) {
                var deferred = $q.defer(),
                    config = {
                        params: {
                            name: groupName
                        }
                    };

                $rootScope.showSpinner = true;
                $http.post(groupPrefix, null, config)
                    .then(response => {
                        deferred.resolve();
                        self.groups.push({name: groupName, roles: ['group'], members: []});
                    }, error => {
                        deferred.reject(_.get(error, 'statusText', 'Something went wrong. Please try again later.'));
                    }).then(() => {
                        $rootScope.showSpinner = false;
                    });
                return deferred.promise;
            }

            self.getGroup = function(groupName) {
                var deferred = $q.defer();

                $rootScope.showSpinner = true;
                $http.get(groupPrefix + '/' + groupName)
                    .then(response => {
                        deferred.resolve(response.data);
                    }, error => {
                        deferred.reject(_.get(error, 'statusText', 'Something went wrong. Please try again later.'));
                    }).then(() => {
                        $rootScope.showSpinner = false;
                    });
                return deferred.promise;
            }

            self.deleteGroup = function(groupName) {
                var deferred = $q.defer();

                $rootScope.showSpinner = true;
                $http.delete(groupPrefix + '/' + groupName)
                    .then(response => {
                        deferred.resolve();
                        _.remove(self.groups, {name: groupName});
                    }, error => {
                        deferred.reject(_.get(error, 'statusText', 'Something went wrong. Please try again later.'));
                    }).then(() => {
                        $rootScope.showSpinner = false;
                    });
                return deferred.promise;
            }

            self.addGroupRole = function(groupName, role) {
                var deferred = $q.defer(),
                    config = {
                        params: {
                            role: role
                        }
                    };

                $rootScope.showSpinner = true;
                $http.put(groupPrefix + '/' + groupName + '/roles', null, config)
                    .then(response => {
                        deferred.resolve();
                        _.get(_.find(self.groups, {name: groupName}), 'roles').push(role);
                    }, error => {
                        deferred.reject(_.get(error, 'statusText', 'Something went wrong. Please try again later.'));
                    }).then(() => {
                        $rootScope.showSpinner = false;
                    });
                return deferred.promise;
            }

            self.deleteGroupRole = function(groupName, role) {
                var deferred = $q.defer(),
                    config = {
                        params: {
                            role: role
                        }
                    };

                $rootScope.showSpinner = true;
                $http.delete(groupPrefix + '/' + groupName + '/roles', config)
                    .then(response => {
                        deferred.resolve();
                        _.pull(_.get(_.find(self.groups, {name: groupName}), 'roles'), role);
                    }, error => {
                        deferred.reject(_.get(error, 'statusText', 'Something went wrong. Please try again later.'));
                    }).then(() => {
                        $rootScope.showSpinner = false;
                    });
                return deferred.promise;
            }

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

            function getUsers() {
                return $http.get(userPrefix)
                    .then(response => {
                        var users = _.map(response.data, user => {return {username: user}});
                        return $q.when(users);
                    });
            }

            function getGroups() {
                return $http.get(groupPrefix)
                    .then(response => {
                        var groupNames = _.keys(response.data);
                        var groups = _.map(groupNames, groupName => {
                            return {
                                name: groupName,
                                roles: response.data[groupName]
                            };
                        });
                        return $q.when(groups);
                    });
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

            function listGroupRoles(groupName) {
                var deferred = $q.defer();

                $rootScope.showSpinner = true;
                $http.get(groupPrefix + '/' + groupName + '/roles')
                    .then(response => {
                        deferred.resolve(response.data);
                    }, error => {
                        deferred.reject(_.get(error, 'statusText', 'Something went wrong. Please try again later.'));
                    }).then(() => {
                        $rootScope.showSpinner = false;
                    });
                return deferred.promise;
            }

            function listGroupMembers(groupName) {
                var deferred = $q.defer();

                $rootScope.showSpinner = true;
                $q.all(_.map(self.users, user => listUserGroups(user.username))).then(userGroups => {
                    var members = _.filter(self.users, (user, idx) => {
                        return _.includes(userGroups[idx], groupName);
                    });
                    deferred.resolve(members);
                }, error => {
                    deferred.reject(_.get(error, 'statusText', 'Something went wrong. Please try again later.'));
                }).then(() => {
                    $rootScope.showSpinner = false;
                });

                return deferred.promise;
            }

            initialize();
        }
})();