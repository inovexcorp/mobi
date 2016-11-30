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
        var users = [{username: 'user'}];
        var userRoles = ['user'];
        var groups = [{title: 'group'}];
        var groupRoles = _.clone(userRoles);
        var groupUsers = _.clone(users);
        $httpBackend.whenGET('/matontorest/users').respond(200, _.map(users, 'username'));
        $httpBackend.whenGET('/matontorest/users/user').respond(200, users[0]);
        $httpBackend.whenGET('/matontorest/users/user/roles').respond(200, userRoles);
        $httpBackend.whenGET('/matontorest/groups').respond(200, _.map(groups, 'title'));
        $httpBackend.whenGET('/matontorest/groups/group').respond(200, groups[0]);
        $httpBackend.whenGET('/matontorest/groups/group/users').respond(200, groupUsers);
        $httpBackend.whenGET('/matontorest/groups/group/roles').respond(200, groupRoles);
        userManagerSvc.initialize();
        $httpBackend.flush();
        expect(userManagerSvc.users.length).toBe(users.length);
        _.forEach(userManagerSvc.users, function(user, idx) {
            expect(user.username).toBe(users[idx].username);
            expect(user.roles).toEqual(userRoles);
        });
        expect(userManagerSvc.groups.length).toBe(groups.length);
        _.forEach(userManagerSvc.groups, function(group, idx) {
            expect(group.title).toBe(groups[idx].title);
            expect(group.roles).toEqual(groupRoles);
            expect(group.members).toEqual(_.map(groupUsers, 'username'));
        });
    });
    describe('should add a user', function() {
        beforeEach(function() {
            params = {
                password: 'password'
            };
        });
        it('unless there is an error', function(done) {
            $httpBackend.whenPOST('/matontorest/users' + createQueryString(params)).respond(function(method, url, data, headers) {
                return [400, '', {}, 'Error Message'];
            });
            userManagerSvc.addUser({}, params.password).then(function(response) {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toBe('Error Message');
                done();
            });
            $httpBackend.flush();
        });
        it('successfully', function(done) {
            var newUser = {username: 'username'};
            $httpBackend.whenPOST('/matontorest/users' + createQueryString(params), newUser).respond(200, []);
            userManagerSvc.addUser(newUser, params.password).then(function(response) {
                expect(userManagerSvc.users).toContain(newUser);
                done();
            });
            $httpBackend.flush();
        });
    });
    describe('should retrieve a user', function() {
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
            userManagerSvc.users = [{username: 'username', firstName: 'Mary'}];
        });
        it('unless there is an error', function(done) {
            var username = userManagerSvc.users[0].username;
            $httpBackend.whenPUT('/matontorest/users/' + username).respond(function(method, url, data, headers) {
                return [400, '', {}, 'Error Message'];
            });
            userManagerSvc.updateUser(username, userManagerSvc.users[0]).then(function(response) {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toBe('Error Message');
                done();
            });
            $httpBackend.flush();
        });
        it('successfully', function(done) {
            var username = userManagerSvc.users[0].username;
            var newUser = _.clone(userManagerSvc.users[0]);
            newUser.firstName = 'Jane';
            $httpBackend.whenPUT('/matontorest/users/' + username, newUser).respond(200, [])
            userManagerSvc.updateUser(username, newUser).then(function(response) {
                expect(_.find(userManagerSvc.users, {username: username})).toEqual(newUser);
                done();
            });
            $httpBackend.flush();
        });
    });
    describe('should update a user password', function() {
        beforeEach(function() {
            this.username = 'user';
            params = {
                currentPassword: 'password',
                newPassword: 'newPassword'
            };
        });
        it('unless there is an error', function(done) {
            $httpBackend.whenPUT('/matontorest/users/' + this.username + '/password' + createQueryString(params)).respond(function(method, url, data, headers) {
                return [400, '', {}, 'Error Message'];
            });
            userManagerSvc.updatePassword(this.username, params.currentPassword, params.newPassword).then(function(response) {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toBe('Error Message');
                done();
            });
            $httpBackend.flush();
        });
        it('successfully', function(done) {
            $httpBackend.whenPUT('/matontorest/users/' + this.username + '/password' + createQueryString(params)).respond(200, [])
            userManagerSvc.updatePassword(this.username, params.currentPassword, params.newPassword).then(function(response) {
                expect(true).toBe(true);
                done();
            });
            $httpBackend.flush();
        });
    })
    describe('should delete a user', function() {
        beforeEach(function() {
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
            userManagerSvc.users = [{username: 'username'}];
            userManagerSvc.groups = [{title: 'group', members: []}];
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
            var groupTitle = userManagerSvc.groups[0].title;
            $httpBackend.whenPUT('/matontorest/users/' + username + '/groups' + createQueryString(params)).respond(200, []);
            userManagerSvc.addUserGroup(username, groupTitle).then(function(response) {
                var group = _.find(userManagerSvc.groups, {title: groupTitle});
                expect(group.members).toContain(username);
                done();
            });
            $httpBackend.flush();
        });
    });
    describe('should remove a user from a group', function() {
        beforeEach(function() {
            userManagerSvc.users = [{username: 'username'}];
            userManagerSvc.groups = [{title: 'group', members: ['username']}];
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
            var groupTitle = userManagerSvc.groups[0].title;
            $httpBackend.whenDELETE('/matontorest/users/' + username + '/groups' + createQueryString(params)).respond(200, []);
            userManagerSvc.deleteUserGroup(username, groupTitle).then(function(response) {
                var group = _.find(userManagerSvc.groups, {title: groupTitle});
                expect(group.members).not.toContain(username);
                done();
            });
            $httpBackend.flush();
        });
    });
    describe('should add a group', function() {
        it('unless there is an error', function(done) {
            $httpBackend.whenPOST('/matontorest/groups').respond(function(method, url, data, headers) {
                return [400, '', {}, 'Error Message'];
            });
            userManagerSvc.addGroup({}).then(function(response) {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toBe('Error Message');
                done();
            });
            $httpBackend.flush();
        });
        it('successfully', function(done) {
            var newGroup = {title: 'title'};
            $httpBackend.whenPOST('/matontorest/groups', newGroup).respond(200, []);
            userManagerSvc.addGroup(newGroup).then(function(response) {
                expect(userManagerSvc.groups).toContain(newGroup);
                done();
            });
            $httpBackend.flush();
        });
    });
    describe('should retrieve a group', function() {
        it('unless there is an error', function(done) {
            var group = {title: 'group'};
            $httpBackend.whenGET('/matontorest/groups/' + group.title).respond(function(method, url, data, headers) {
                return [400, '', {}, 'Error Message'];
            });
            userManagerSvc.getGroup(group.title).then(function(response) {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toBe('Error Message');
                done();
            });
            $httpBackend.flush();
        });
        it('with the passed name', function(done) {
            var group = {title: 'group'};
            $httpBackend.whenGET('/matontorest/groups/' + group.title).respond(200, group);
            userManagerSvc.getGroup(group.title).then(function(response) {
                expect(response).toEqual(group);
                done();
            });
            $httpBackend.flush();
        });
    });
    describe('should update a group', function() {
        beforeEach(function() {
            userManagerSvc.groups = [{title: 'group', description: 'Description'}];
        });
        it('unless there is an error', function(done) {
            var groupTitle = userManagerSvc.groups[0].title;
            $httpBackend.whenPUT('/matontorest/groups/' + groupTitle).respond(function(method, url, data, headers) {
                return [400, '', {}, 'Error Message'];
            });
            userManagerSvc.updateGroup(groupTitle, userManagerSvc.groups[0]).then(function(response) {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toBe('Error Message');
                done();
            });
            $httpBackend.flush();
        });
        it('successfully', function(done) {
            var groupTitle = userManagerSvc.groups[0].title;
            var newGroup = _.clone(userManagerSvc.groups[0]);
            newGroup.description = 'New Description';
            $httpBackend.whenPUT('/matontorest/groups/' + groupTitle, newGroup).respond(200, [])
            userManagerSvc.updateGroup(groupTitle, newGroup).then(function(response) {
                expect(_.find(userManagerSvc.groups, {title: groupTitle})).toEqual(newGroup);
                done();
            });
            $httpBackend.flush();
        });
    });
    describe('should delete a group', function() {
        beforeEach(function() {
            userManagerSvc.groups = [{title: 'group', members: ['username']}];
        });
        it('unless there is an error', function(done) {
            var groupTitle = userManagerSvc.groups[0].title;
            $httpBackend.whenDELETE('/matontorest/groups/' + groupTitle).respond(function(method, url, data, headers) {
                return [400, '', {}, 'Error Message'];
            });
            userManagerSvc.deleteGroup(groupTitle).then(function(response) {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toBe('Error Message');
                done();
            });
            $httpBackend.flush();
        });
        it('with the passed title', function(done) {
            var groupTitle = userManagerSvc.groups[0].title;
            $httpBackend.whenDELETE('/matontorest/groups/' + groupTitle).respond(200, [])
            userManagerSvc.deleteGroup(groupTitle).then(function(response) {
                expect(_.find(userManagerSvc.groups, {title: groupTitle})).toBeFalsy();
                done();
            });
            $httpBackend.flush();
        });
    });
    describe('should add a role to a group', function() {
        beforeEach(function() {
            userManagerSvc.groups = [{title: 'group', roles: []}];
            params = {
                role: 'role'
            };
        });
        it('unless there is an error', function(done) {
            var groupTitle = userManagerSvc.groups[0].title;
            $httpBackend.whenPUT('/matontorest/groups/' + groupTitle + '/roles' + createQueryString(params)).respond(function(method, url, data, headers) {
                return [400, '', {}, 'Error Message'];
            });
            userManagerSvc.addGroupRole(groupTitle, params.role).then(function(response) {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toBe('Error Message');
                done();
            });
            $httpBackend.flush();
        });
        it('using the passed parameters', function(done) {
            var groupTitle = userManagerSvc.groups[0].title;
            $httpBackend.whenPUT('/matontorest/groups/' + groupTitle + '/roles' + createQueryString(params)).respond(200, []);
            userManagerSvc.addGroupRole(groupTitle, params.role).then(function(response) {
                var group = _.find(userManagerSvc.groups, {title: groupTitle});
                expect(group.roles).toContain(params.role);
                done();
            });
            $httpBackend.flush();
        });
    });
    describe('should remove a role from a group', function() {
        beforeEach(function() {
            userManagerSvc.groups = [{title: 'group', roles: ['role']}];
            params = {
                role: 'role'
            };
        });
        it('unless there is an error', function(done) {
            var groupTitle = userManagerSvc.groups[0].title;
            $httpBackend.whenDELETE('/matontorest/groups/' + groupTitle + '/roles' + createQueryString(params)).respond(function(method, url, data, headers) {
                return [400, '', {}, 'Error Message'];
            });
            userManagerSvc.deleteGroupRole(groupTitle, params.role).then(function(response) {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toBe('Error Message');
                done();
            });
            $httpBackend.flush();
        });
        it('using the passed parameters', function(done) {
            var groupTitle = userManagerSvc.groups[0].title;
            $httpBackend.whenDELETE('/matontorest/groups/' + groupTitle + '/roles' + createQueryString(params)).respond(200, []);
            userManagerSvc.deleteGroupRole(groupTitle, params.role).then(function(response) {
                var group = _.find(userManagerSvc.groups, {title: groupTitle});
                expect(group.roles).not.toContain(params.role);
                done();
            });
            $httpBackend.flush();
        });
    });
    describe('should test whether the current user is an admin', function() {
        beforeEach(function() {
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
            userManagerSvc.users = [{username: 'user'}];
            userManagerSvc.groups = [{title: 'group', roles: ['admin'], members: ['user']}];
            var result = userManagerSvc.isAdmin(this.username);
            expect(result).toBe(true);

            userManagerSvc.groups[0].roles = [];
            result = userManagerSvc.isAdmin(this.username);
            expect(result).toBe(false);
        });
    });
});