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
describe('User Manager service', function() {
    var $httpBackend,
        userManagerSvc,
        params;

    beforeEach(function() {
        module('userManager');
        mockLoginManager();

        inject(function(userManagerService, _$httpBackend_) {
            userManagerSvc = userManagerService;
            $httpBackend = _$httpBackend_;
        });
    });

    it('should set the correct initial state for users and groups', function() {
        var users = ['user'];
        var userRoles = ['user'];
        var userGroups = ['group'];
        var groups = {group: 'group'};
        $httpBackend.whenGET('/matontorest/users').respond(200, users);
        $httpBackend.whenGET('/matontorest/users/user/roles').respond(200, userRoles);
        $httpBackend.whenGET('/matontorest/users/user/groups').respond(200, userGroups);
        $httpBackend.whenGET('/matontorest/groups').respond(200, groups);
        $httpBackend.flush();
        expect(userManagerSvc.users.length).toBe(users.length);
        expect(userManagerSvc.groups.length).toBe(_.keys(groups).length);
    });
    it('should correctly set the list of users', function(done) {
        $httpBackend.whenGET('/matontorest/groups').respond(200, {});
        var users = ['user'];
        var userRoles = ['user'];
        $httpBackend.whenGET('/matontorest/users').respond(200, users);
        $httpBackend.whenGET('/matontorest/users/user/roles').respond(200, userRoles);
        userManagerSvc.setUsers().then(function(response) {
            expect(userManagerSvc.users.length).toBe(users.length);
            _.forEach(userManagerSvc.users, function(user, idx) {
                expect(user.username).toBe(users[idx]);
                expect(user.roles).toEqual(userRoles);
            });
            done();
        });
        $httpBackend.flush();
    });
    it('should correctly set the list of groups', function(done) {
        $httpBackend.whenGET('/matontorest/users').respond(200, ['user']);
        $httpBackend.whenGET('/matontorest/users/user/roles').respond(200, []);
        var userGroups = ['group'];
        var groups = {group: ['group']};
        $httpBackend.whenGET('/matontorest/groups').respond(200, groups);
        $httpBackend.whenGET('/matontorest/users/user/groups').respond(200, userGroups);
        userManagerSvc.setGroups().then(function(response) {
            var keys = _.keys(groups);
            expect(userManagerSvc.groups.length).toBe(keys.length);
            _.forEach(userManagerSvc.groups, function(group, idx) {
                expect(group.name).toBe(keys[idx]);
                expect(group.roles).toEqual(groups[keys[idx]]);
                expect(group.members).toContain('user');
            });
            done();
        });
        $httpBackend.flush();
    });
    describe('should add a user', function() {
        beforeEach(function() {
            $httpBackend.whenGET('/matontorest/groups').respond(200, {});
            $httpBackend.whenGET('/matontorest/users').respond(200, []);
            $httpBackend.flush();
            params = {
                password: 'password',
                username: 'username'
            };
        });
        it('unless there is an error', function(done) {
            $httpBackend.whenPOST('/matontorest/users' + createQueryString(params)).respond(function(method, url, data, headers) {
                return [400, '', {}, 'Error Message'];
            });
            userManagerSvc.addUser(params.username, params.password).then(function(response) {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toBe('Error Message');
                done();
            });
            $httpBackend.flush();
        });
        it('with the passed username and password', function(done) {
            $httpBackend.whenPOST('/matontorest/users' + createQueryString(params)).respond(200, []);
            userManagerSvc.addUser(params.username, params.password).then(function(response) {
                expect(userManagerSvc.users).toContain({username: params.username, roles: []});
                done();
            });
            $httpBackend.flush();
        });
    });
    describe('should retrieve a user', function() {
        beforeEach(function() {
            $httpBackend.whenGET('/matontorest/groups').respond(200, {});
            $httpBackend.whenGET('/matontorest/users').respond(200, []);
            $httpBackend.flush();
        });
        it('unless there is an error', function(done) {
            var username = 'user';
            $httpBackend.whenGET('/matontorest/users/' + username).respond(function(method, url, data, headers) {
                return [400, '', {}, 'Error Message'];
            });
            userManagerSvc.getUser(username).then(function(response) {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toBe('Error Message');
                done();
            });
            $httpBackend.flush();
        });
        it('with the passed username', function(done) {
            var username = 'user';
            $httpBackend.whenGET('/matontorest/users/' + username).respond(200, username);
            userManagerSvc.getUser(username).then(function(response) {
                expect(response).toBe(username);
                done();
            });
            $httpBackend.flush();
        });
    });
    describe('should update a user', function() {
        beforeEach(function() {
            $httpBackend.whenGET('/matontorest/groups').respond(200, {});
            $httpBackend.whenGET('/matontorest/users').respond(200, []);
            $httpBackend.flush();
            userManagerSvc.users = [{username: 'username'}];
            params = {
                password: 'password',
                username: 'newUsername'
            };
        });
        it('unless there is an error', function(done) {
            var username = userManagerSvc.users[0].username;
            $httpBackend.whenPUT('/matontorest/users/' + username + createQueryString(params)).respond(function(method, url, data, headers) {
                return [400, '', {}, 'Error Message'];
            });
            userManagerSvc.updateUser(username, params.username, params.password).then(function(response) {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toBe('Error Message');
                done();
            });
            $httpBackend.flush();
        });
        it('if there is a new username', function(done) {
            var username = userManagerSvc.users[0].username;
            $httpBackend.whenPUT('/matontorest/users/' + username + createQueryString(params)).respond(200, [])
            userManagerSvc.updateUser(username, params.username, params.password).then(function(response) {
                expect(_.find(userManagerSvc.users, {username: username})).toBeFalsy();
                expect(_.find(userManagerSvc.users, {username: params.username})).toBeTruthy();
                done();
            });
            $httpBackend.flush();
        });
        it('if there is not a new username', function(done) {
            var username = userManagerSvc.users[0].username;
            delete params.username;
            $httpBackend.whenPUT('/matontorest/users/' + username + createQueryString(params)).respond(200, [])
            userManagerSvc.updateUser(username, params.username, params.password).then(function(response) {
                expect(_.find(userManagerSvc.users, {username: params.username})).toBeFalsy();
                expect(_.find(userManagerSvc.users, {username: username})).toBeTruthy();
                done();
            });
            $httpBackend.flush();
        });
    });
    describe('should check a password against a user password', function() {
        beforeEach(function() {
            $httpBackend.whenGET('/matontorest/groups').respond(200, {});
            $httpBackend.whenGET('/matontorest/users').respond(200, []);
            $httpBackend.flush();
            params = {
                password: 'password'
            };
            this.username = 'user';
        });
        it('unless there is an error', function(done) {
            $httpBackend.whenPOST('/matontorest/users/' + this.username + '/password' + createQueryString(params)).respond(function(method, url, data, headers) {
                return [400, '', {}, 'Error Message'];
            });
            userManagerSvc.checkPassword(this.username, params.password).then(function(response) {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toBe('Error Message');
                done();
            });
            $httpBackend.flush();
        });
        it('correctly if they match', function(done) {
            $httpBackend.whenPOST('/matontorest/users/' + this.username + '/password' + createQueryString(params)).respond(200, true)
            userManagerSvc.checkPassword(this.username, params.password).then(function(response) {
                expect(true).toBe(true);
                done();
            });
            $httpBackend.flush();
        });
        it('correctly if they do not match', function(done) {
            $httpBackend.whenPOST('/matontorest/users/' + this.username + '/password' + createQueryString(params)).respond(200, false)
            userManagerSvc.checkPassword(this.username, params.password).then(function(response) {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toBe('Password does not match saved password. Please try again.');
                done();
            });
            $httpBackend.flush();
        });
    });
    describe('should delete a user', function() {
        beforeEach(function() {
            $httpBackend.whenGET('/matontorest/groups').respond(200, {});
            $httpBackend.whenGET('/matontorest/users').respond(200, []);
            $httpBackend.flush();
            userManagerSvc.users = [{username: 'username'}];
            userManagerSvc.groups = [{members: ['username']}];
        });
        it('unless there is an error', function(done) {
            var username = userManagerSvc.users[0].username;
            $httpBackend.whenDELETE('/matontorest/users/' + username).respond(function(method, url, data, headers) {
                return [400, '', {}, 'Error Message'];
            });
            userManagerSvc.deleteUser(username).then(function(response) {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toBe('Error Message');
                done();
            });
            $httpBackend.flush();
        });
        it('with the passed username', function(done) {
            var username = userManagerSvc.users[0].username;
            $httpBackend.whenDELETE('/matontorest/users/' + username).respond(200, [])
            userManagerSvc.deleteUser(username).then(function(response) {
                expect(_.find(userManagerSvc.users, {username: username})).toBeFalsy();
                _.forEach(userManagerSvc.groups, function(group) {
                    expect(group.members).not.toContain(username);
                });
                done();
            });
            $httpBackend.flush();
        });
    });
    describe('should add a role to a user', function() {
        beforeEach(function() {
            $httpBackend.whenGET('/matontorest/groups').respond(200, {});
            $httpBackend.whenGET('/matontorest/users').respond(200, []);
            $httpBackend.flush();
            userManagerSvc.users = [{username: 'username', roles: []}];
            params = {
                role: 'role'
            };
        });
        it('unless there is an error', function(done) {
            var username = userManagerSvc.users[0].username;
            $httpBackend.whenPUT('/matontorest/users/' + username + '/roles' + createQueryString(params)).respond(function(method, url, data, headers) {
                return [400, '', {}, 'Error Message'];
            });
            userManagerSvc.addUserRole(username, params.role).then(function(response) {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toBe('Error Message');
                done();
            });
            $httpBackend.flush();
        });
        it('using the passed parameters', function(done) {
            var username = userManagerSvc.users[0].username;
            $httpBackend.whenPUT('/matontorest/users/' + username + '/roles' + createQueryString(params)).respond(200, []);
            userManagerSvc.addUserRole(username, params.role).then(function(response) {
                var user = _.find(userManagerSvc.users, {username: username});
                expect(user.roles).toContain(params.role);
                done();
            });
            $httpBackend.flush();
        });
    });
    describe('should delete a role from a user', function() {
        beforeEach(function() {
            $httpBackend.whenGET('/matontorest/groups').respond(200, {});
            $httpBackend.whenGET('/matontorest/users').respond(200, []);
            $httpBackend.flush();
            userManagerSvc.users = [{username: 'username', roles: ['role']}];
            params = {
                role: 'role'
            };
        });
        it('unless there is an error', function(done) {
            var username = userManagerSvc.users[0].username;
            $httpBackend.whenDELETE('/matontorest/users/' + username + '/roles' + createQueryString(params)).respond(function(method, url, data, headers) {
                return [400, '', {}, 'Error Message'];
            });
            userManagerSvc.deleteUserRole(username, params.role).then(function(response) {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toBe('Error Message');
                done();
            });
            $httpBackend.flush();
        });
        it('using the passed parameters', function(done) {
            var username = userManagerSvc.users[0].username;
            $httpBackend.whenDELETE('/matontorest/users/' + username + '/roles' + createQueryString(params)).respond(200, []);
            userManagerSvc.deleteUserRole(username, params.role).then(function(response) {
                var user = _.find(userManagerSvc.users, {username: username});
                expect(user.roles).not.toContain(params.role);
                done();
            });
            $httpBackend.flush();
        });
    });
    describe('should add a user to a group', function() {
        beforeEach(function() {
            $httpBackend.whenGET('/matontorest/groups').respond(200, {});
            $httpBackend.whenGET('/matontorest/users').respond(200, []);
            $httpBackend.flush();
            userManagerSvc.users = [{username: 'username'}];
            userManagerSvc.groups = [{name: 'group', members: []}];
            params = {
                group: 'group'
            };
        });
        it('unless there is an error', function(done) {
            var username = userManagerSvc.users[0].username;
            $httpBackend.whenPUT('/matontorest/users/' + username + '/groups' + createQueryString(params)).respond(function(method, url, data, headers) {
                return [400, '', {}, 'Error Message'];
            });
            userManagerSvc.addUserGroup(username, params.group).then(function(response) {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toBe('Error Message');
                done();
            });
            $httpBackend.flush();
        });
        it('using the passed parameters', function(done) {
            var username = userManagerSvc.users[0].username;
            var groupName = userManagerSvc.groups[0].name;
            $httpBackend.whenPUT('/matontorest/users/' + username + '/groups' + createQueryString(params)).respond(200, []);
            userManagerSvc.addUserGroup(username, groupName).then(function(response) {
                var group = _.find(userManagerSvc.groups, {name: groupName});
                expect(group.members).toContain(username);
                done();
            });
            $httpBackend.flush();
        });
    });
    describe('should add a user to a group', function() {
        beforeEach(function() {
            $httpBackend.whenGET('/matontorest/groups').respond(200, {});
            $httpBackend.whenGET('/matontorest/users').respond(200, []);
            $httpBackend.flush();
            userManagerSvc.users = [{username: 'username'}];
            userManagerSvc.groups = [{name: 'group', members: ['username']}];
            params = {
                group: 'group'
            };
        });
        it('unless there is an error', function(done) {
            var username = userManagerSvc.users[0].username;
            $httpBackend.whenDELETE('/matontorest/users/' + username + '/groups' + createQueryString(params)).respond(function(method, url, data, headers) {
                return [400, '', {}, 'Error Message'];
            });
            userManagerSvc.deleteUserGroup(username, params.group).then(function(response) {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toBe('Error Message');
                done();
            });
            $httpBackend.flush();
        });
        it('using the passed parameters', function(done) {
            var username = userManagerSvc.users[0].username;
            var groupName = userManagerSvc.groups[0].name;
            $httpBackend.whenDELETE('/matontorest/users/' + username + '/groups' + createQueryString(params)).respond(200, []);
            userManagerSvc.deleteUserGroup(username, groupName).then(function(response) {
                var group = _.find(userManagerSvc.groups, {name: groupName});
                expect(group.members).not.toContain(username);
                done();
            });
            $httpBackend.flush();
        });
    });
    describe('should add a group', function() {
        beforeEach(function() {
            $httpBackend.whenGET('/matontorest/groups').respond(200, {});
            $httpBackend.whenGET('/matontorest/users').respond(200, []);
            $httpBackend.flush();
            params = {
                name: 'group'
            };
        });
        it('unless there is an error', function(done) {
            $httpBackend.whenPOST('/matontorest/groups' + createQueryString(params)).respond(function(method, url, data, headers) {
                return [400, '', {}, 'Error Message'];
            });
            userManagerSvc.addGroup(params.name).then(function(response) {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toBe('Error Message');
                done();
            });
            $httpBackend.flush();
        });
        it('using the passed parameters', function(done) {
            $httpBackend.whenPOST('/matontorest/groups' + createQueryString(params)).respond(200, []);
            userManagerSvc.addGroup(params.name).then(function(response) {
                expect(userManagerSvc.groups).toContain({name: params.name, roles: ['group'], members: []});
                done();
            });
            $httpBackend.flush();
        });
    });
    describe('should retrieve a group', function() {
        beforeEach(function() {
            $httpBackend.whenGET('/matontorest/groups').respond(200, {});
            $httpBackend.whenGET('/matontorest/users').respond(200, []);
            $httpBackend.flush();
        });
        it('unless there is an error', function(done) {
            var group = {name: 'group'};
            $httpBackend.whenGET('/matontorest/groups/' + group.name).respond(function(method, url, data, headers) {
                return [400, '', {}, 'Error Message'];
            });
            userManagerSvc.getGroup(group.name).then(function(response) {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toBe('Error Message');
                done();
            });
            $httpBackend.flush();
        });
        it('with the passed name', function(done) {
            var group = {name: 'group'};
            $httpBackend.whenGET('/matontorest/groups/' + group.name).respond(200, group);
            userManagerSvc.getGroup(group.name).then(function(response) {
                expect(response).toEqual(group);
                done();
            });
            $httpBackend.flush();
        });
    });
    describe('should delete a group', function() {
        beforeEach(function() {
            $httpBackend.whenGET('/matontorest/groups').respond(200, {});
            $httpBackend.whenGET('/matontorest/users').respond(200, []);
            $httpBackend.flush();
            userManagerSvc.groups = [{name: 'group', members: ['username']}];
        });
        it('unless there is an error', function(done) {
            var groupName = userManagerSvc.groups[0].name;
            $httpBackend.whenDELETE('/matontorest/groups/' + groupName).respond(function(method, url, data, headers) {
                return [400, '', {}, 'Error Message'];
            });
            userManagerSvc.deleteGroup(groupName).then(function(response) {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toBe('Error Message');
                done();
            });
            $httpBackend.flush();
        });
        it('with the passed name', function(done) {
            var groupName = userManagerSvc.groups[0].name;
            $httpBackend.whenDELETE('/matontorest/groups/' + groupName).respond(200, [])
            userManagerSvc.deleteGroup(groupName).then(function(response) {
                expect(_.find(userManagerSvc.groups, {name: groupName})).toBeFalsy();
                done();
            });
            $httpBackend.flush();
        });
    });
    describe('should add a role to a group', function() {
        beforeEach(function() {
            $httpBackend.whenGET('/matontorest/groups').respond(200, {});
            $httpBackend.whenGET('/matontorest/users').respond(200, []);
            $httpBackend.flush();
            userManagerSvc.groups = [{name: 'group', roles: []}];
            params = {
                role: 'role'
            };
        });
        it('unless there is an error', function(done) {
            var groupName = userManagerSvc.groups[0].name;
            $httpBackend.whenPUT('/matontorest/groups/' + groupName + '/roles' + createQueryString(params)).respond(function(method, url, data, headers) {
                return [400, '', {}, 'Error Message'];
            });
            userManagerSvc.addGroupRole(groupName, params.role).then(function(response) {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toBe('Error Message');
                done();
            });
            $httpBackend.flush();
        });
        it('using the passed parameters', function(done) {
            var groupName = userManagerSvc.groups[0].name;
            $httpBackend.whenPUT('/matontorest/groups/' + groupName + '/roles' + createQueryString(params)).respond(200, []);
            userManagerSvc.addGroupRole(groupName, params.role).then(function(response) {
                var group = _.find(userManagerSvc.groups, {name: groupName});
                expect(group.roles).toContain(params.role);
                done();
            });
            $httpBackend.flush();
        });
    });
    describe('should remove a role from a group', function() {
        beforeEach(function() {
            $httpBackend.whenGET('/matontorest/groups').respond(200, {});
            $httpBackend.whenGET('/matontorest/users').respond(200, []);
            $httpBackend.flush();
            userManagerSvc.groups = [{name: 'group', roles: ['role']}];
            params = {
                role: 'role'
            };
        });
        it('unless there is an error', function(done) {
            var groupName = userManagerSvc.groups[0].name;
            $httpBackend.whenDELETE('/matontorest/groups/' + groupName + '/roles' + createQueryString(params)).respond(function(method, url, data, headers) {
                return [400, '', {}, 'Error Message'];
            });
            userManagerSvc.deleteGroupRole(groupName, params.role).then(function(response) {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toBe('Error Message');
                done();
            });
            $httpBackend.flush();
        });
        it('using the passed parameters', function(done) {
            var groupName = userManagerSvc.groups[0].name;
            $httpBackend.whenDELETE('/matontorest/groups/' + groupName + '/roles' + createQueryString(params)).respond(200, []);
            userManagerSvc.deleteGroupRole(groupName, params.role).then(function(response) {
                var group = _.find(userManagerSvc.groups, {name: groupName});
                expect(group.roles).not.toContain(params.role);
                done();
            });
            $httpBackend.flush();
        });
    });
    describe('should test whether the current user is an admin', function() {
        beforeEach(function() {
            $httpBackend.whenGET('/matontorest/groups').respond(200, {});
            $httpBackend.whenGET('/matontorest/users').respond(200, []);
            $httpBackend.flush();
            this.username = 'user';
        });
        it('based on user roles', function() {
            userManagerSvc.users = [{username: 'user', roles: ['admin']}];
            var result = userManagerSvc.isAdmin(this.username);
            expect(result).toBe(true);

            userManagerSvc.users = [{username: 'user', roles: []}];
            result = userManagerSvc.isAdmin(this.username);
            expect(result).toBe(false);
        });
        it('based on group roles', function() {
            userManagerSvc.users = [{username: 'user', roles: []}];
            userManagerSvc.groups = [{name: 'group', roles: ['admin'], members: ['user']}];
            var result = userManagerSvc.isAdmin(this.username);
            expect(result).toBe(true);

            userManagerSvc.groups = [{name: 'group', roles: [], members: ['user']}];
            result = userManagerSvc.isAdmin(this.username);
            expect(result).toBe(false);
        });
    });
});