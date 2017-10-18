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
describe('User Manager service', function() {
    var $httpBackend,
        userManagerSvc,
        $timeout,
        $httpParamSerializer,
        params;

    beforeEach(function() {
        module('userManager');
        mockLoginManager();
        injectRestPathConstant();

        inject(function(userManagerService, _$httpBackend_, _$timeout_, _$httpParamSerializer_) {
            userManagerSvc = userManagerService;
            $httpBackend = _$httpBackend_;
            $timeout = _$timeout_;
            $httpParamSerializer = _$httpParamSerializer_;
        });
    });

    it('should set the correct initial state for users and groups', function() {
        var users = [{username: 'user'}];
        var userRoles = ['user'];
        var groups = [{title: 'group'}];
        var groupRoles = _.clone(userRoles);
        var groupUsers = _.clone(users);
        $httpBackend.whenGET('/mobirest/users').respond(200, _.map(users, 'username'));
        $httpBackend.whenGET('/mobirest/users/user').respond(200, users[0]);
        $httpBackend.whenGET('/mobirest/users/user/roles').respond(200, userRoles);
        $httpBackend.whenGET('/mobirest/groups').respond(200, _.map(groups, 'title'));
        $httpBackend.whenGET('/mobirest/groups/group').respond(200, groups[0]);
        $httpBackend.whenGET('/mobirest/groups/group/users').respond(200, groupUsers);
        $httpBackend.whenGET('/mobirest/groups/group/roles').respond(200, groupRoles);
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
    describe('should get the username of the user with the passed iri', function() {
        beforeEach(function() {
            params = {
                iri: 'iri'
            };
        });
        it('if it has been found before', function(done) {
            userManagerSvc.users = [{iri: params.iri, username: 'username'}];
            userManagerSvc.getUsername(params.iri).then(function(response) {
                expect(response).toBe('username');
                done();
            });
            $timeout.flush();
            $httpBackend.verifyNoOutstandingRequest();
        });
        describe('if it has not been found before', function() {
            it('unless an error occurs', function(done) {
                $httpBackend.whenGET('/mobirest/users/username?' + $httpParamSerializer(params)).respond(400, null, null, 'Error Message');
                userManagerSvc.getUsername(params.iri).then(function(response) {
                    fail('Promise should have rejected');
                    done();
                }, function(response) {
                    expect(response).toBe('Error Message');
                    done();
                });
                $httpBackend.flush();
            });
            it('successfully', function(done) {
                var username = 'username';
                userManagerSvc.users = [{username: username}];
                $httpBackend.whenGET('/mobirest/users/username?' + $httpParamSerializer(params)).respond(200, username);
                userManagerSvc.getUsername(params.iri).then(function(response) {
                    expect(response).toBe(username);
                    expect(_.get(_.find(userManagerSvc.users, {username: username}), 'iri')).toBe(params.iri);
                    done();
                });
                $httpBackend.flush();
            });
        });
    });
    describe('should add a user', function() {
        beforeEach(function() {
            params = {
                password: 'password'
            };
        });
        it('unless an error occurs', function(done) {
            $httpBackend.whenPOST('/mobirest/users?' + $httpParamSerializer(params)).respond(400, null, null, 'Error Message');
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
            $httpBackend.whenPOST('/mobirest/users?' + $httpParamSerializer(params), newUser).respond(200, []);
            userManagerSvc.addUser(newUser, params.password).then(function(response) {
                expect(userManagerSvc.users).toContain(newUser);
                done();
            });
            $httpBackend.flush();
        });
    });
    describe('should retrieve a user', function() {
        it('unless an error occurs', function(done) {
            var username = 'user';
            $httpBackend.whenGET('/mobirest/users/' + username).respond(400, null, null, 'Error Message');
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
            $httpBackend.whenGET('/mobirest/users/' + username).respond(200, username);
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
        it('unless an error occurs', function(done) {
            var username = userManagerSvc.users[0].username;
            $httpBackend.whenPUT('/mobirest/users/' + username).respond(400, null, null, 'Error Message');
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
            $httpBackend.whenPUT('/mobirest/users/' + username, newUser).respond(200, [])
            userManagerSvc.updateUser(username, newUser).then(function(response) {
                expect(_.find(userManagerSvc.users, {username: username})).toEqual(newUser);
                done();
            });
            $httpBackend.flush();
        });
    });
    describe('should change a user password', function() {
        beforeEach(function() {
            this.username = 'user';
            params = {
                currentPassword: 'password',
                newPassword: 'newPassword'
            };
        });
        it('unless an error occurs', function(done) {
            $httpBackend.whenPOST('/mobirest/users/' + this.username + '/password?' + $httpParamSerializer(params)).respond(400, null, null, 'Error Message');
            userManagerSvc.changePassword(this.username, params.currentPassword, params.newPassword).then(function(response) {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toBe('Error Message');
                done();
            });
            $httpBackend.flush();
        });
        it('successfully', function(done) {
            $httpBackend.whenPOST('/mobirest/users/' + this.username + '/password?' + $httpParamSerializer(params)).respond(200, [])
            userManagerSvc.changePassword(this.username, params.currentPassword, params.newPassword).then(function(response) {
                expect(true).toBe(true);
                done();
            });
            $httpBackend.flush();
        });
    });
    describe('should reset a user password', function() {
        beforeEach(function() {
            this.username = 'user';
            params = { newPassword: 'newPassword' };
        });
        it('unless an error occurs', function(done) {
            $httpBackend.whenPUT('/mobirest/users/' + this.username + '/password?' + $httpParamSerializer(params)).respond(400, null, null, 'Error Message');
            userManagerSvc.resetPassword(this.username, params.newPassword).then(function(response) {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toBe('Error Message');
                done();
            });
            $httpBackend.flush();
        });
        it('successfully', function(done) {
            $httpBackend.whenPUT('/mobirest/users/' + this.username + '/password?' + $httpParamSerializer(params)).respond(200, [])
            userManagerSvc.resetPassword(this.username, params.newPassword).then(function(response) {
                expect(true).toBe(true);
                done();
            });
            $httpBackend.flush();
        });
    });
    describe('should delete a user', function() {
        beforeEach(function() {
            userManagerSvc.users = [{username: 'username'}];
            userManagerSvc.groups = [{members: ['username']}];
        });
        it('unless an error occurs', function(done) {
            var username = userManagerSvc.users[0].username;
            $httpBackend.whenDELETE('/mobirest/users/' + username).respond(400, null, null, 'Error Message');
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
            $httpBackend.whenDELETE('/mobirest/users/' + username).respond(200, [])
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
    describe('should add roles to a user', function() {
        beforeEach(function() {
            this.user = {username: 'username', roles: []};
            userManagerSvc.users = [this.user];
            params = {
                roles: ['role1', 'role2']
            };
        });
        it('unless an error occurs', function(done) {
            $httpBackend.whenPUT('/mobirest/users/' + this.user.username + '/roles?' + $httpParamSerializer(params)).respond(400, null, null, 'Error Message');
            userManagerSvc.addUserRoles(this.user.username, params.roles).then(function(response) {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toBe('Error Message');
                done();
            });
            $httpBackend.flush();
        });
        it('using the passed parameters', function(done) {
            var test = this;
            $httpBackend.whenPUT('/mobirest/users/' + test.user.username + '/roles?' + $httpParamSerializer(params)).respond(200, []);
            userManagerSvc.addUserRoles(test.user.username, params.roles).then(function(response) {
                expect(test.user.roles).toEqual(params.roles);
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
        it('unless an error occurs', function(done) {
            var username = userManagerSvc.users[0].username;
            $httpBackend.whenDELETE('/mobirest/users/' + username + '/roles?' + $httpParamSerializer(params)).respond(400, null, null, 'Error Message');
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
            $httpBackend.whenDELETE('/mobirest/users/' + username + '/roles?' + $httpParamSerializer(params)).respond(200, []);
            userManagerSvc.deleteUserRole(username, params.role).then(function(response) {
                var user = _.find(userManagerSvc.users, {username: username});
                expect(user.roles).not.toContain(params.role);
                done();
            });
            $httpBackend.flush();
        });
    });
    describe('should add a group to a user', function() {
        beforeEach(function() {
            userManagerSvc.users = [{username: 'username'}];
            userManagerSvc.groups = [{title: 'group', members: []}];
            params = {
                group: 'group'
            };
        });
        it('unless an error occurs', function(done) {
            var username = userManagerSvc.users[0].username;
            $httpBackend.whenPUT('/mobirest/users/' + username + '/groups?' + $httpParamSerializer(params)).respond(400, null, null, 'Error Message');
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
            $httpBackend.whenPUT('/mobirest/users/' + username + '/groups?' + $httpParamSerializer(params)).respond(200, []);
            userManagerSvc.addUserGroup(username, groupTitle).then(function(response) {
                var group = _.find(userManagerSvc.groups, {title: groupTitle});
                expect(group.members).toContain(username);
                done();
            });
            $httpBackend.flush();
        });
    });
    describe('should remove a group from a user', function() {
        beforeEach(function() {
            userManagerSvc.users = [{username: 'username'}];
            userManagerSvc.groups = [{title: 'group', members: ['username']}];
            params = {
                group: 'group'
            };
        });
        it('unless an error occurs', function(done) {
            var username = userManagerSvc.users[0].username;
            $httpBackend.whenDELETE('/mobirest/users/' + username + '/groups?' + $httpParamSerializer(params)).respond(400, null, null, 'Error Message');
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
            $httpBackend.whenDELETE('/mobirest/users/' + username + '/groups?' + $httpParamSerializer(params)).respond(200, []);
            userManagerSvc.deleteUserGroup(username, groupTitle).then(function(response) {
                var group = _.find(userManagerSvc.groups, {title: groupTitle});
                expect(group.members).not.toContain(username);
                done();
            });
            $httpBackend.flush();
        });
    });
    describe('should add a group', function() {
        it('unless an error occurs', function(done) {
            $httpBackend.whenPOST('/mobirest/groups').respond(400, null, null, 'Error Message');
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
            $httpBackend.whenPOST('/mobirest/groups', newGroup).respond(200, []);
            userManagerSvc.addGroup(newGroup).then(function(response) {
                expect(userManagerSvc.groups).toContain(newGroup);
                done();
            });
            $httpBackend.flush();
        });
    });
    describe('should retrieve a group', function() {
        it('unless an error occurs', function(done) {
            var group = {title: 'group'};
            $httpBackend.whenGET('/mobirest/groups/' + group.title).respond(400, null, null, 'Error Message');
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
            $httpBackend.whenGET('/mobirest/groups/' + group.title).respond(200, group);
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
        it('unless an error occurs', function(done) {
            var groupTitle = userManagerSvc.groups[0].title;
            $httpBackend.whenPUT('/mobirest/groups/' + groupTitle).respond(400, null, null, 'Error Message');
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
            $httpBackend.whenPUT('/mobirest/groups/' + groupTitle, newGroup).respond(200, [])
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
        it('unless an error occurs', function(done) {
            var groupTitle = userManagerSvc.groups[0].title;
            $httpBackend.whenDELETE('/mobirest/groups/' + groupTitle).respond(400, null, null, 'Error Message');
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
            $httpBackend.whenDELETE('/mobirest/groups/' + groupTitle).respond(200, [])
            userManagerSvc.deleteGroup(groupTitle).then(function(response) {
                expect(_.find(userManagerSvc.groups, {title: groupTitle})).toBeFalsy();
                done();
            });
            $httpBackend.flush();
        });
    });
    describe('should add roles to a group', function() {
        beforeEach(function() {
            this.group = {title: 'group', roles: []};
            userManagerSvc.groups = [this.group];
            params = {
                roles: ['role1', 'role2']
            };
        });
        it('unless an error occurs', function(done) {
            $httpBackend.whenPUT('/mobirest/groups/' + this.group.title + '/roles?' + $httpParamSerializer(params)).respond(400, null, null, 'Error Message');
            userManagerSvc.addGroupRoles(this.group.title, params.roles).then(function(response) {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toBe('Error Message');
                done();
            });
            $httpBackend.flush();
        });
        it('using the passed parameters', function(done) {
            var test = this;
            $httpBackend.whenPUT('/mobirest/groups/' + test.group.title + '/roles?' + $httpParamSerializer(params)).respond(200, []);
            userManagerSvc.addGroupRoles(test.group.title, params.roles).then(function(response) {
                expect(test.group.roles).toEqual(params.roles);
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
        it('unless an error occurs', function(done) {
            var groupTitle = userManagerSvc.groups[0].title;
            $httpBackend.whenDELETE('/mobirest/groups/' + groupTitle + '/roles?' + $httpParamSerializer(params)).respond(400, null, null, 'Error Message');
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
            $httpBackend.whenDELETE('/mobirest/groups/' + groupTitle + '/roles?' + $httpParamSerializer(params)).respond(200, []);
            userManagerSvc.deleteGroupRole(groupTitle, params.role).then(function(response) {
                var group = _.find(userManagerSvc.groups, {title: groupTitle});
                expect(group.roles).not.toContain(params.role);
                done();
            });
            $httpBackend.flush();
        });
    });
    describe('should get the list of users in a group', function() {
        beforeEach(function() {
            this.groupTitle = 'group';
        });
        it('unless an error occurs', function(done) {
            $httpBackend.whenGET('/mobirest/groups/' + this.groupTitle + '/users').respond(400, null, null, 'Error Message');
            userManagerSvc.getGroupUsers(this.groupTitle).then(function(response) {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toBe('Error Message');
                done();
            });
            $httpBackend.flush();
        });
        it('successfully', function(done) {
            $httpBackend.whenGET('/mobirest/groups/' + this.groupTitle + '/users').respond(200, []);
            userManagerSvc.getGroupUsers(this.groupTitle).then(function(response) {
                expect(response).toEqual([]);
                done();
            });
            $httpBackend.flush();
        });
    });
    describe('should add users to a group', function() {
        beforeEach(function() {
            this.group = {
                title: 'group',
                members: []
            };
            params = {
                users: ['user1', 'user2']
            };
            userManagerSvc.groups = [this.group];
        });
        it('unless an error occurs', function(done) {
            $httpBackend.whenPUT('/mobirest/groups/' + this.group.title + '/users?' + $httpParamSerializer(params)).respond(400, null, null, 'Error Message');
            userManagerSvc.addGroupUsers(this.group.title, params.users).then(function(response) {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toBe('Error Message');
                done();
            });
            $httpBackend.flush();
        });
        it('successfully', function(done) {
            var test = this;
            $httpBackend.whenPUT('/mobirest/groups/' + test.group.title + '/users?' + $httpParamSerializer(params)).respond(200, '');
            userManagerSvc.addGroupUsers(test.group.title, params.users).then(function(response) {
                expect(test.group.members).toEqual(params.users);
                done();
            });
            $httpBackend.flush();
        });
    });
    describe('should remove a user from a group', function() {
        beforeEach(function() {
            params = {
                user: 'username'
            };
            this.group = {
                title: 'group',
                members: [params.user]
            };
            userManagerSvc.groups = [this.group];
        });
        it('unless an error occurs', function(done) {
            $httpBackend.whenDELETE('/mobirest/groups/' + this.group.title + '/users?' + $httpParamSerializer(params)).respond(400, null, null, 'Error Message');
            userManagerSvc.deleteGroupUser(this.group.title, params.user).then(function(response) {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toBe('Error Message');
                done();
            });
            $httpBackend.flush();
        });
        it('successfully', function(done) {
            var test = this;
            $httpBackend.whenDELETE('/mobirest/groups/' + test.group.title + '/users?' + $httpParamSerializer(params)).respond(200, '');
            userManagerSvc.deleteGroupUser(test.group.title, params.user).then(function(response) {
                expect(test.group.members).not.toContain(params.user);
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
    describe('getUserDisplay should return the correct value', function() {
        it('when there is a first and last', function() {
            var userObject = {
                firstName: 'first',
                lastName: 'last'
            }
            expect(userManagerSvc.getUserDisplay(userObject)).toEqual('first last');
        });
        it('when there is not a first or last but there is a username', function() {
            var userObject = {
                username: 'username'
            }
            expect(userManagerSvc.getUserDisplay(userObject)).toEqual('username');
        });
        it('when there is not a first, last, or username', function() {
            expect(userManagerSvc.getUserDisplay({})).toEqual('[Not Available]');
        });
    });
});
