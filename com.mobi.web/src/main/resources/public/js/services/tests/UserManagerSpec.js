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
    var userManagerSvc, $q, $httpBackend, scope, $httpParamSerializer, utilSvc;

    beforeEach(function() {
        module('userManager');
        mockUtil();
        injectRestPathConstant();

        inject(function(userManagerService, _$q_, _$httpBackend_, _$rootScope_, _$httpParamSerializer_, _utilService_) {
            userManagerSvc = userManagerService;
            $q = _$q_;
            $httpBackend = _$httpBackend_;
            scope = _$rootScope_;
            $httpParamSerializer = _$httpParamSerializer_;
            utilSvc = _utilService_;
        });

        this.error = 'Error Message';
        utilSvc.rejectError.and.returnValue($q.reject(this.error));
    });

    afterEach(function() {
        userManagerSvc = null;
        $q = null;
        $httpBackend = null;
        scope = null;
        $httpParamSerializer = null;
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
        flushAndVerify($httpBackend);
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
            this.params = { iri: 'iri' };
        });
        it('if it has been found before', function() {
            userManagerSvc.users = [{iri: this.params.iri, username: 'username'}];
            userManagerSvc.getUsername(this.params.iri)
                .then(function(response) {
                    expect(response).toBe('username');
                });
            scope.$apply();
        });
        describe('if it has not been found before', function() {
            it('unless an error occurs', function() {
                $httpBackend.whenGET('/mobirest/users/username?' + $httpParamSerializer(this.params)).respond(400, null, null, this.error);
                userManagerSvc.getUsername(this.params.iri)
                    .then(function(response) {
                        fail('Promise should have rejected');
                    }, function(response) {
                        expect(response).toBe(this.error);
                    }.bind(this));
                flushAndVerify($httpBackend);
                expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({status: 400, statusText: this.error}));
            });
            it('successfully', function() {
                var username = 'username';
                userManagerSvc.users = [{username: username}];
                $httpBackend.whenGET('/mobirest/users/username?' + $httpParamSerializer(this.params)).respond(200, username);
                userManagerSvc.getUsername(this.params.iri)
                    .then(function(response) {
                        expect(response).toBe(username);
                    });
                flushAndVerify($httpBackend);
                expect(_.get(_.find(userManagerSvc.users, {username: username}), 'iri')).toBe(this.params.iri);
            });
        });
    });
    describe('should add a user', function() {
        beforeEach(function() {
            this.params = {
                password: 'password'
            };
            spyOn(userManagerSvc, 'getUser').and.returnValue({iri: 'iri'});
        });
        it('unless an error occurs', function() {
            $httpBackend.whenPOST('/mobirest/users?' + $httpParamSerializer(this.params)).respond(400, null, null, this.error);
            userManagerSvc.addUser({}, this.params.password)
                .then(function(response) {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toBe(this.error);
                }.bind(this));
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({status: 400, statusText: this.error}));
        });
        it('successfully', function() {
            var newUser = {username: 'username'};
            $httpBackend.whenPOST('/mobirest/users?' + $httpParamSerializer(this.params), newUser).respond(200, '');
            userManagerSvc.addUser(newUser, this.params.password)
                .then(_.noop, function() {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
            expect(userManagerSvc.getUser).toHaveBeenCalledWith(newUser.username);
            expect(userManagerSvc.users).toContain({iri: 'iri', username: 'username'});
        });
    });
    describe('should retrieve a user', function() {
        it('unless an error occurs', function() {
            var username = 'user';
            $httpBackend.whenGET('/mobirest/users/' + username).respond(400, null, null, this.error);
            userManagerSvc.getUser(username)
                .then(function(response) {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toBe(this.error);
                }.bind(this));
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({status: 400, statusText: this.error}));
        });
        it('with the passed username', function() {
            var username = 'user';
            $httpBackend.whenGET('/mobirest/users/' + username).respond(200, username);
            userManagerSvc.getUser(username)
                .then(function(response) {
                    expect(response).toBe(username);
                });
            flushAndVerify($httpBackend);
        });
    });
    describe('should update a user', function() {
        beforeEach(function() {
            userManagerSvc.users = [{username: 'username', firstName: 'Mary'}];
        });
        it('unless an error occurs', function() {
            var username = userManagerSvc.users[0].username;
            $httpBackend.whenPUT('/mobirest/users/' + username).respond(400, null, null, this.error);
            userManagerSvc.updateUser(username, userManagerSvc.users[0])
                .then(function(response) {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toBe(this.error);
                }.bind(this));
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({status: 400, statusText: this.error}));
        });
        it('successfully', function() {
            var username = userManagerSvc.users[0].username;
            var newUser = _.clone(userManagerSvc.users[0]);
            newUser.firstName = 'Jane';
            $httpBackend.whenPUT('/mobirest/users/' + username, newUser).respond(200, '')
            userManagerSvc.updateUser(username, newUser)
                .then(_.noop, function() {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
            expect(_.find(userManagerSvc.users, {username: username})).toEqual(newUser);
        });
    });
    describe('should change a user password', function() {
        beforeEach(function() {
            this.username = 'user';
            this.params = {
                currentPassword: 'password',
                newPassword: 'newPassword'
            };
        });
        it('unless an error occurs', function() {
            $httpBackend.whenPOST('/mobirest/users/' + this.username + '/password?' + $httpParamSerializer(this.params)).respond(400, null, null, this.error);
            userManagerSvc.changePassword(this.username, this.params.currentPassword, this.params.newPassword)
                .then(function(response) {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toBe(this.error);
                }.bind(this));
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({status: 400, statusText: this.error}));
        });
        it('successfully', function() {
            $httpBackend.whenPOST('/mobirest/users/' + this.username + '/password?' + $httpParamSerializer(this.params)).respond(200)
            userManagerSvc.changePassword(this.username, this.params.currentPassword, this.params.newPassword)
                .then(_.noop, function() {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
    });
    describe('should reset a user password', function() {
        beforeEach(function() {
            this.username = 'user';
            this.params = { newPassword: 'newPassword' };
        });
        it('unless an error occurs', function() {
            $httpBackend.whenPUT('/mobirest/users/' + this.username + '/password?' + $httpParamSerializer(this.params)).respond(400, null, null, this.error);
            userManagerSvc.resetPassword(this.username, this.params.newPassword)
                .then(function(response) {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toBe(this.error);
                }.bind(this));
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({status: 400, statusText: this.error}));
        });
        it('successfully', function() {
            $httpBackend.whenPUT('/mobirest/users/' + this.username + '/password?' + $httpParamSerializer(this.params)).respond(200)
            userManagerSvc.resetPassword(this.username, this.params.newPassword)
                .then(_.noop, function() {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
    });
    describe('should delete a user', function() {
        beforeEach(function() {
            userManagerSvc.users = [{username: 'username'}];
            userManagerSvc.groups = [{members: ['username']}];
        });
        it('unless an error occurs', function() {
            var username = userManagerSvc.users[0].username;
            $httpBackend.whenDELETE('/mobirest/users/' + username).respond(400, null, null, this.error);
            userManagerSvc.deleteUser(username)
                .then(function(response) {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toBe(this.error);
                }.bind(this));
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({status: 400, statusText: this.error}));
        });
        it('with the passed username', function() {
            var username = userManagerSvc.users[0].username;
            $httpBackend.whenDELETE('/mobirest/users/' + username).respond(200)
            userManagerSvc.deleteUser(username)
                .then(_.noop, function() {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
            expect(_.find(userManagerSvc.users, {username: username})).toBeFalsy();
            _.forEach(userManagerSvc.groups, function(group) {
                expect(group.members).not.toContain(username);
            });
        });
    });
    describe('should add roles to a user', function() {
        beforeEach(function() {
            this.user = {username: 'username', roles: []};
            userManagerSvc.users = [this.user];
            this.params = {
                roles: ['role1', 'role2']
            };
        });
        it('unless an error occurs', function() {
            $httpBackend.whenPUT('/mobirest/users/' + this.user.username + '/roles?' + $httpParamSerializer(this.params)).respond(400, null, null, this.error);
            userManagerSvc.addUserRoles(this.user.username, this.params.roles)
                .then(function(response) {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toBe(this.error);
                }.bind(this));
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({status: 400, statusText: this.error}));
        });
        it('using the passed parameters', function() {
            $httpBackend.whenPUT('/mobirest/users/' + this.user.username + '/roles?' + $httpParamSerializer(this.params)).respond(200);
            userManagerSvc.addUserRoles(this.user.username, this.params.roles)
                .then(_.noop, function() {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
            expect(this.user.roles).toEqual(this.params.roles);
        });
    });
    describe('should delete a role from a user', function() {
        beforeEach(function() {
            userManagerSvc.users = [{username: 'username', roles: ['role']}];
            this.params = {
                role: 'role'
            };
        });
        it('unless an error occurs', function() {
            var username = userManagerSvc.users[0].username;
            $httpBackend.whenDELETE('/mobirest/users/' + username + '/roles?' + $httpParamSerializer(this.params)).respond(400, null, null, this.error);
            userManagerSvc.deleteUserRole(username, this.params.role)
                .then(function(response) {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toBe(this.error);
                }.bind(this));
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({status: 400, statusText: this.error}));
        });
        it('using the passed parameters', function() {
            var username = userManagerSvc.users[0].username;
            $httpBackend.whenDELETE('/mobirest/users/' + username + '/roles?' + $httpParamSerializer(this.params)).respond(200);
            userManagerSvc.deleteUserRole(username, this.params.role)
                .then(_.noop, function() {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
            var user = _.find(userManagerSvc.users, {username: username});
            expect(user.roles).not.toContain(this.params.role);
        });
    });
    describe('should add a group to a user', function() {
        beforeEach(function() {
            userManagerSvc.users = [{username: 'username'}];
            userManagerSvc.groups = [{title: 'group', members: []}];
            this.params = {
                group: 'group'
            };
        });
        it('unless an error occurs', function() {
            var username = userManagerSvc.users[0].username;
            $httpBackend.whenPUT('/mobirest/users/' + username + '/groups?' + $httpParamSerializer(this.params)).respond(400, null, null, this.error);
            userManagerSvc.addUserGroup(username, this.params.group)
                .then(function(response) {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toBe(this.error);
                }.bind(this));
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({status: 400, statusText: this.error}));
        });
        it('using the passed parameters', function() {
            var username = userManagerSvc.users[0].username;
            var groupTitle = userManagerSvc.groups[0].title;
            $httpBackend.whenPUT('/mobirest/users/' + username + '/groups?' + $httpParamSerializer(this.params)).respond(200);
            userManagerSvc.addUserGroup(username, groupTitle)
                .then(_.noop, function() {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
            var group = _.find(userManagerSvc.groups, {title: groupTitle});
            expect(group.members).toContain(username);
        });
    });
    describe('should remove a group from a user', function() {
        beforeEach(function() {
            userManagerSvc.users = [{username: 'username'}];
            userManagerSvc.groups = [{title: 'group', members: ['username']}];
            this.params = {
                group: 'group'
            };
        });
        it('unless an error occurs', function() {
            var username = userManagerSvc.users[0].username;
            $httpBackend.whenDELETE('/mobirest/users/' + username + '/groups?' + $httpParamSerializer(this.params)).respond(400, null, null, this.error);
            userManagerSvc.deleteUserGroup(username, this.params.group)
                .then(function(response) {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toBe(this.error);
                }.bind(this));
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({status: 400, statusText: this.error}));
        });
        it('using the passed parameters', function() {
            var username = userManagerSvc.users[0].username;
            var groupTitle = userManagerSvc.groups[0].title;
            $httpBackend.whenDELETE('/mobirest/users/' + username + '/groups?' + $httpParamSerializer(this.params)).respond(200);
            userManagerSvc.deleteUserGroup(username, groupTitle)
                .then(_.noop, function() {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
            var group = _.find(userManagerSvc.groups, {title: groupTitle});
            expect(group.members).not.toContain(username);
        });
    });
    describe('should add a group', function() {
        beforeEach(function() {
            spyOn(userManagerSvc, 'getGroup').and.returnValue({iri: 'iri'});
        });
        it('unless an error occurs', function() {
            $httpBackend.whenPOST('/mobirest/groups').respond(400, null, null, this.error);
            userManagerSvc.addGroup({})
                .then(function(response) {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toBe(this.error);
                }.bind(this));
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({status: 400, statusText: this.error}));
        });
        it('successfully', function() {
            var newGroup = {title: 'title'};
            $httpBackend.whenPOST('/mobirest/groups', newGroup).respond(200);
            userManagerSvc.addGroup(newGroup)
                .then(_.noop, function() {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
            expect(userManagerSvc.getGroup).toHaveBeenCalledWith(newGroup.title);
            expect(userManagerSvc.groups).toContain({title: 'title', iri: 'iri'});
        });
    });
    describe('should retrieve a group', function() {
        it('unless an error occurs', function() {
            var group = {title: 'group'};
            $httpBackend.whenGET('/mobirest/groups/' + group.title).respond(400, null, null, this.error);
            userManagerSvc.getGroup(group.title)
                .then(function(response) {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toBe(this.error);
                }.bind(this));
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({status: 400, statusText: this.error}));
        });
        it('with the passed name', function() {
            var group = {title: 'group'};
            $httpBackend.whenGET('/mobirest/groups/' + group.title).respond(200, group);
            userManagerSvc.getGroup(group.title)
                .then(function(response) {
                    expect(response).toEqual(group);
                });
            flushAndVerify($httpBackend);
        });
    });
    describe('should update a group', function() {
        beforeEach(function() {
            userManagerSvc.groups = [{title: 'group', description: 'Description'}];
        });
        it('unless an error occurs', function() {
            var groupTitle = userManagerSvc.groups[0].title;
            $httpBackend.whenPUT('/mobirest/groups/' + groupTitle).respond(400, null, null, this.error);
            userManagerSvc.updateGroup(groupTitle, userManagerSvc.groups[0])
                .then(function(response) {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toBe(this.error);
                }.bind(this));
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({status: 400, statusText: this.error}));
        });
        it('successfully', function() {
            var groupTitle = userManagerSvc.groups[0].title;
            var newGroup = _.clone(userManagerSvc.groups[0]);
            newGroup.description = 'New Description';
            $httpBackend.whenPUT('/mobirest/groups/' + groupTitle, newGroup).respond(200)
            userManagerSvc.updateGroup(groupTitle, newGroup)
                .then(_.noop, function() {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
            expect(_.find(userManagerSvc.groups, {title: groupTitle})).toEqual(newGroup);
        });
    });
    describe('should delete a group', function() {
        beforeEach(function() {
            userManagerSvc.groups = [{title: 'group', members: ['username']}];
        });
        it('unless an error occurs', function() {
            var groupTitle = userManagerSvc.groups[0].title;
            $httpBackend.whenDELETE('/mobirest/groups/' + groupTitle).respond(400, null, null, this.error);
            userManagerSvc.deleteGroup(groupTitle)
                .then(function(response) {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toBe(this.error);
                }.bind(this));
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({status: 400, statusText: this.error}));
        });
        it('with the passed title', function() {
            var groupTitle = userManagerSvc.groups[0].title;
            $httpBackend.whenDELETE('/mobirest/groups/' + groupTitle).respond(200)
            userManagerSvc.deleteGroup(groupTitle)
                .then(_.noop, function() {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
            expect(_.find(userManagerSvc.groups, {title: groupTitle})).toBeFalsy();
        });
    });
    describe('should add roles to a group', function() {
        beforeEach(function() {
            this.group = {title: 'group', roles: []};
            userManagerSvc.groups = [this.group];
            this.params = {
                roles: ['role1', 'role2']
            };
        });
        it('unless an error occurs', function() {
            $httpBackend.whenPUT('/mobirest/groups/' + this.group.title + '/roles?' + $httpParamSerializer(this.params)).respond(400, null, null, this.error);
            userManagerSvc.addGroupRoles(this.group.title, this.params.roles)
                .then(function(response) {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toBe(this.error);
                }.bind(this));
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({status: 400, statusText: this.error}));
        });
        it('using the passed parameters', function() {
            $httpBackend.whenPUT('/mobirest/groups/' + this.group.title + '/roles?' + $httpParamSerializer(this.params)).respond(200);
            userManagerSvc.addGroupRoles(this.group.title, this.params.roles)
                .then(_.noop, function() {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
            expect(this.group.roles).toEqual(this.params.roles);
        });
    });
    describe('should remove a role from a group', function() {
        beforeEach(function() {
            userManagerSvc.groups = [{title: 'group', roles: ['role']}];
            this.params = {
                role: 'role'
            };
        });
        it('unless an error occurs', function() {
            var groupTitle = userManagerSvc.groups[0].title;
            $httpBackend.whenDELETE('/mobirest/groups/' + groupTitle + '/roles?' + $httpParamSerializer(this.params)).respond(400, null, null, this.error);
            userManagerSvc.deleteGroupRole(groupTitle, this.params.role)
                .then(function(response) {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toBe(this.error);
                }.bind(this));
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({status: 400, statusText: this.error}));
        });
        it('using the passed parameters', function() {
            var groupTitle = userManagerSvc.groups[0].title;
            $httpBackend.whenDELETE('/mobirest/groups/' + groupTitle + '/roles?' + $httpParamSerializer(this.params)).respond(200);
            userManagerSvc.deleteGroupRole(groupTitle,this. params.role)
                .then(_.noop, function() {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
            var group = _.find(userManagerSvc.groups, {title: groupTitle});
            expect(group.roles).not.toContain(this.params.role);
        });
    });
    describe('should get the list of users in a group', function() {
        beforeEach(function() {
            this.groupTitle = 'group';
        });
        it('unless an error occurs', function() {
            $httpBackend.whenGET('/mobirest/groups/' + this.groupTitle + '/users').respond(400, null, null, this.error);
            userManagerSvc.getGroupUsers(this.groupTitle)
                .then(function(response) {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toBe(this.error);
                }.bind(this));
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({status: 400, statusText: this.error}));
        });
        it('successfully', function() {
            $httpBackend.whenGET('/mobirest/groups/' + this.groupTitle + '/users').respond(200, []);
            userManagerSvc.getGroupUsers(this.groupTitle)
                .then(function(response) {
                    expect(response).toEqual([]);
                });
            flushAndVerify($httpBackend);
        });
    });
    describe('should add users to a group', function() {
        beforeEach(function() {
            this.group = {
                title: 'group',
                members: []
            };
            this.params = {
                users: ['user1', 'user2']
            };
            userManagerSvc.groups = [this.group];
        });
        it('unless an error occurs', function() {
            $httpBackend.whenPUT('/mobirest/groups/' + this.group.title + '/users?' + $httpParamSerializer(this.params)).respond(400, null, null, this.error);
            userManagerSvc.addGroupUsers(this.group.title, this.params.users)
                .then(function(response) {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toBe(this.error);
                }.bind(this));
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({status: 400, statusText: this.error}));
        });
        it('successfully', function() {
            $httpBackend.whenPUT('/mobirest/groups/' + this.group.title + '/users?' + $httpParamSerializer(this.params)).respond(200);
            userManagerSvc.addGroupUsers(this.group.title, this.params.users)
                .then(_.noop, function() {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
            expect(this.group.members).toEqual(this.params.users);
        });
    });
    describe('should remove a user from a group', function() {
        beforeEach(function() {
            this.params = {
                user: 'username'
            };
            this.group = {
                title: 'group',
                members: [this.params.user]
            };
            userManagerSvc.groups = [this.group];
        });
        it('unless an error occurs', function() {
            $httpBackend.whenDELETE('/mobirest/groups/' + this.group.title + '/users?' + $httpParamSerializer(this.params)).respond(400, null, null, this.error);
            userManagerSvc.deleteGroupUser(this.group.title, this.params.user)
                .then(function(response) {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toBe(this.error);
                }.bind(this));
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({status: 400, statusText: this.error}));
        });
        it('successfully', function() {
            $httpBackend.whenDELETE('/mobirest/groups/' + this.group.title + '/users?' + $httpParamSerializer(this.params)).respond(200);
            userManagerSvc.deleteGroupUser(this.group.title, this.params.user)
                .then(_.noop, function() {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
            expect(this.group.members).not.toContain(this.params.user);
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
