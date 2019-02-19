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
describe('User Manager service', function() {
    var userManagerSvc, $q, $httpBackend, scope, $httpParamSerializer, utilSvc, prefixes;

    beforeEach(function() {
        module('userManager');
        mockUtil();
        mockPrefixes();
        injectRestPathConstant();

        inject(function(userManagerService, _$q_, _$httpBackend_, _$rootScope_, _$httpParamSerializer_, _utilService_, _prefixes_) {
            userManagerSvc = userManagerService;
            $q = _$q_;
            $httpBackend = _$httpBackend_;
            scope = _$rootScope_;
            $httpParamSerializer = _$httpParamSerializer_;
            utilSvc = _utilService_;
            prefixes = _prefixes_;
        });

        this.error = 'Error Message';
        utilSvc.rejectError.and.returnValue($q.reject(this.error));

        this.user = {
            jsonld: {},
            iri: 'urn:userIri',
            username : 'username',
            firstName : 'John',
            lastName : 'Doe',
            email : 'john.doe@gmail.com',
            roles : ['user']
        };
        this.userRdf = {
            '@id' : this.user.iri,
            [prefixes.user + 'username'] : [{'@value': this.user.username}],
            [prefixes.foaf + 'firstName'] : [{'@value': this.user.firstName}],
            [prefixes.foaf + 'lastName'] : [{'@value': this.user.lastName}],
            [prefixes.foaf + 'mbox'] : [{'@id': this.user.email}],
            [prefixes.user + 'hasUserRole'] : [{'@id': prefixes.roles + this.user.roles[0]}]
        };
        this.user.jsonld = this.userRdf;
        this.group = {
            jsonld: {},
            iri: 'urn:groupIri',
            title: 'group title',
            description: 'description',
            members: ['username'],
            roles: ['user']
        };
        this.groupRdf = {
            '@id': this.group.iri,
            [prefixes.dcterms + 'title'] : [{'@value': this.group.title}],
            [prefixes.dcterms + 'description'] : [{'@value': this.group.description}],
            [prefixes.foaf + 'member'] : [this.userRdf],
            [prefixes.user + 'hasGroupRole'] : [{'@id': prefixes.roles + this.group.roles[0]}]
        };
        this.group.jsonld = this.groupRdf;

        utilSvc.getPropertyValue.and.callFake((jsonld, prop) => {
            if (prop === prefixes.user + 'username') {
                return this.user.username;
            } else if (prop === prefixes.foaf + 'firstName') {
                return this.user.firstName;
            } else if (prop === prefixes.foaf + 'lastName') {
                return this.user.lastName;
            }
        });
        utilSvc.getPropertyId.and.callFake((jsonld, prop) => {
            if (prop === prefixes.foaf + 'mbox') {
                return this.user.email;
            }
        });
        utilSvc.getDctermsValue.and.callFake((jsonld, prop) => {
            if (prop === 'title') {
                return this.group.title;
            } else if (prop === 'description') {
                return this.group.description;
            }
        });
        utilSvc.getBeautifulIRI.and.callFake(iri => {
            if (iri === prefixes.roles + 'user') {
                return 'user';
            }
        });
    });

    afterEach(function() {
        userManagerSvc = null;
        $q = null;
        $httpBackend = null;
        scope = null;
        $httpParamSerializer = null;
    });

    it('should set the correct initial state for users and groups', function() {
        $httpBackend.whenGET('/mobirest/users').respond(200, [this.userRdf]);
        $httpBackend.whenGET('/mobirest/groups').respond(200, [this.groupRdf]);
        userManagerSvc.initialize();
        flushAndVerify($httpBackend);
        expect(userManagerSvc.users.length).toBe(1);
        expect(userManagerSvc.users[0].username).toBe(this.user.username);
        expect(userManagerSvc.users[0].roles).toEqual(this.user.roles);

        expect(userManagerSvc.groups.length).toBe(1);
        expect(userManagerSvc.groups[0].title).toBe(this.group.title);
        expect(userManagerSvc.groups[0].roles).toEqual(this.group.roles);
        expect(userManagerSvc.groups[0].members).toEqual(this.group.members);
    });
    describe('should get the username of the user with the passed iri', function() {
        beforeEach(function() {
            this.params = { iri: 'iri' };
        });
        it('if it has been found before', function() {
            userManagerSvc.users = [{iri: this.params.iri, username: 'username'}];
            userManagerSvc.getUsername(this.params.iri)
                .then(response => expect(response).toBe('username'));
            scope.$apply();
        });
        describe('if it has not been found before', function() {
            it('unless an error occurs', function() {
                $httpBackend.whenGET('/mobirest/users/username?' + $httpParamSerializer(this.params)).respond(400, null, null, this.error);
                userManagerSvc.getUsername(this.params.iri)
                    .then(response => fail('Promise should have rejected'), response => expect(response).toBe(this.error));
                flushAndVerify($httpBackend);
                expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({status: 400, statusText: this.error}));
            });
            it('successfully', function() {
                var username = 'username';
                userManagerSvc.users = [{username: username}];
                $httpBackend.whenGET('/mobirest/users/username?' + $httpParamSerializer(this.params)).respond(200, username);
                userManagerSvc.getUsername(this.params.iri)
                    .then(response => expect(response).toBe(username));
                flushAndVerify($httpBackend);
                expect(_.get(_.find(userManagerSvc.users, {username: username}), 'iri')).toBe(this.params.iri);
            });
        });
    });
    describe('should add a user', function() {
        beforeEach(function() {
            spyOn(userManagerSvc, 'getUser').and.returnValue(this.user);
        });
        it('unless an error occurs', function() {
            $httpBackend.whenPOST('/mobirest/users', data => data instanceof FormData).respond(400, null, null, this.error);
            userManagerSvc.addUser(this.user, this.password)
                .then(response => fail('Promise should have rejected'), response => expect(response).toBe(this.error));
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({status: 400, statusText: this.error}));
        });
        it('successfully', function() {
            $httpBackend.whenPOST('/mobirest/users', data => data instanceof FormData).respond(200, '');
            userManagerSvc.addUser(this.user, this.password)
                .then(_.noop, () => fail('Promise should have resolved'));
            flushAndVerify($httpBackend);
            expect(userManagerSvc.getUser).toHaveBeenCalledWith(this.user.username);
            expect(userManagerSvc.users).toContain(this.user);
        });
    });
    describe('should retrieve a user', function() {
        it('unless an error occurs', function() {
            var username = 'user';
            $httpBackend.whenGET('/mobirest/users/' + username).respond(400, null, null, this.error);
            userManagerSvc.getUser(username)
                .then(response => fail('Promise should have rejected'), response => expect(response).toBe(this.error));
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({status: 400, statusText: this.error}));
        });
        it('with the passed username', function() {
            var username = 'user';
            var localUser = this.user;
            $httpBackend.whenGET('/mobirest/users/' + username).respond(200, this.userRdf);
            userManagerSvc.getUser(username)
                .then(response => expect(response.iri).toBe(localUser.iri));
            flushAndVerify($httpBackend);
        });
    });
    describe('should update a user', function() {
        beforeEach(function() {
            userManagerSvc.users = [this.user];
        });
        it('unless an error occurs', function() {
            var username = userManagerSvc.users[0].username;
            $httpBackend.whenPUT('/mobirest/users/' + username, this.userRdf).respond(400, null, null, this.error);
            userManagerSvc.updateUser(username, userManagerSvc.users[0])
                .then(response => fail('Promise should have rejected'), response => expect(response).toBe(this.error));
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({status: 400, statusText: this.error}));
        });
        it('successfully', function() {
            var username = userManagerSvc.users[0].username;
            var newUser = _.clone(userManagerSvc.users[0]);
            newUser.jsonld[prefixes.foaf + 'firstName'] = [{'@value': 'Jane'}];
            newUser.firstName = 'Jane';
            $httpBackend.whenPUT('/mobirest/users/' + username, newUser.jsonld).respond(200, '')
            userManagerSvc.updateUser(username, newUser)
                .then(_.noop, response => fail('Promise should have resolved'));
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
                .then(response => fail('Promise should have rejected'), response => expect(response).toBe(this.error));
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({status: 400, statusText: this.error}));
        });
        it('successfully', function() {
            $httpBackend.whenPOST('/mobirest/users/' + this.username + '/password?' + $httpParamSerializer(this.params)).respond(200)
            userManagerSvc.changePassword(this.username, this.params.currentPassword, this.params.newPassword)
                .then(_.noop, () => fail('Promise should have resolved'));
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
                .then(response => fail('Promise should have rejected'), response => expect(response).toBe(this.error));
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({status: 400, statusText: this.error}));
        });
        it('successfully', function() {
            $httpBackend.whenPUT('/mobirest/users/' + this.username + '/password?' + $httpParamSerializer(this.params)).respond(200);
            userManagerSvc.resetPassword(this.username, this.params.newPassword)
                .then(_.noop, () => fail('Promise should have resolved'));
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
                .then(response => fail('Promise should have rejected'), response => expect(response).toBe(this.error));
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({status: 400, statusText: this.error}));
        });
        it('with the passed username', function() {
            var username = userManagerSvc.users[0].username;
            $httpBackend.whenDELETE('/mobirest/users/' + username).respond(200)
            userManagerSvc.deleteUser(username)
                .then(_.noop, () => fail('Promise should have resolved'));
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
                .then(response => fail('Promise should have rejected'), response => expect(response).toBe(this.error));
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({status: 400, statusText: this.error}));
        });
        it('using the passed parameters', function() {
            $httpBackend.whenPUT('/mobirest/users/' + this.user.username + '/roles?' + $httpParamSerializer(this.params)).respond(200);
            userManagerSvc.addUserRoles(this.user.username, this.params.roles)
                .then(_.noop, () => fail('Promise should have resolved'));
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
                .then(response => fail('Promise should have rejected'), response => expect(response).toBe(this.error));
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({status: 400, statusText: this.error}));
        });
        it('using the passed parameters', function() {
            var username = userManagerSvc.users[0].username;
            $httpBackend.whenDELETE('/mobirest/users/' + username + '/roles?' + $httpParamSerializer(this.params)).respond(200);
            userManagerSvc.deleteUserRole(username, this.params.role)
                .then(_.noop, () => fail('Promise should have resolved'));
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
                .then(response => fail('Promise should have rejected'), response => expect(response).toBe(this.error));
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({status: 400, statusText: this.error}));
        });
        it('using the passed parameters', function() {
            var username = userManagerSvc.users[0].username;
            var groupTitle = userManagerSvc.groups[0].title;
            $httpBackend.whenPUT('/mobirest/users/' + username + '/groups?' + $httpParamSerializer(this.params)).respond(200);
            userManagerSvc.addUserGroup(username, groupTitle)
                .then(_.noop, () => fail('Promise should have resolved'));
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
                .then(response => fail('Promise should have rejected'), response => expect(response).toBe(this.error));
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({status: 400, statusText: this.error}));
        });
        it('using the passed parameters', function() {
            var username = userManagerSvc.users[0].username;
            var groupTitle = userManagerSvc.groups[0].title;
            $httpBackend.whenDELETE('/mobirest/users/' + username + '/groups?' + $httpParamSerializer(this.params)).respond(200);
            userManagerSvc.deleteUserGroup(username, groupTitle)
                .then(_.noop, () => fail('Promise should have resolved'));
            flushAndVerify($httpBackend);
            var group = _.find(userManagerSvc.groups, {title: groupTitle});
            expect(group.members).not.toContain(username);
        });
    });
    describe('should add a group', function() {
        beforeEach(function() {
            spyOn(userManagerSvc, 'getGroup').and.returnValue(this.group);
        });
        it('unless an error occurs', function() {
            $httpBackend.whenPOST('/mobirest/groups', data => data instanceof FormData).respond(400, null, null, this.error);
            userManagerSvc.addGroup({})
                .then(response => fail('Promise should have rejected'), response => expect(response).toBe(this.error));
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({status: 400, statusText: this.error}));
        });
        it('successfully', function() {
            $httpBackend.whenPOST('/mobirest/groups', data => data instanceof FormData).respond(200);
            userManagerSvc.addGroup(this.group)
                .then(_.noop, () => fail('Promise should have resolved'));
            flushAndVerify($httpBackend);
            expect(userManagerSvc.getGroup).toHaveBeenCalledWith(this.group.title);
            expect(userManagerSvc.groups).toContain(this.group);
        });
    });
    describe('should retrieve a group', function() {
        it('unless an error occurs', function() {
            $httpBackend.whenGET('/mobirest/groups/' + encodeURIComponent(this.group.title)).respond(400, null, null, this.error);
            userManagerSvc.getGroup(this.group.title)
                .then(response => fail('Promise should have rejected'), response => expect(response).toBe(this.error));
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({status: 400, statusText: this.error}));
        });
        it('with the passed name', function() {
            var localGroup = this.group;
            $httpBackend.whenGET('/mobirest/groups/' + encodeURIComponent(this.group.title)).respond(200, this.groupRdf);
            userManagerSvc.getGroup(this.group.title)
                .then(response => expect(response.iri).toEqual(localGroup.iri));
            flushAndVerify($httpBackend);
        });
    });
    describe('should update a group', function() {
        beforeEach(function() {
            userManagerSvc.groups = [this.group];
        });
        it('unless an error occurs', function() {
            var groupTitle = userManagerSvc.groups[0].title;
            $httpBackend.whenPUT('/mobirest/groups/' + encodeURIComponent(groupTitle)).respond(400, null, null, this.error);
            userManagerSvc.updateGroup(groupTitle, userManagerSvc.groups[0])
                .then(response => fail('Promise should have rejected'), response => expect(response).toBe(this.error));
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({status: 400, statusText: this.error}));
        });
        it('successfully', function() {
            var groupTitle = userManagerSvc.groups[0].title;
            var newGroup = _.clone(userManagerSvc.groups[0]);
            newGroup.jsonld[prefixes.dcterms + 'description'] = [{'@value': 'New Description'}];
            newGroup.description = 'New Description';

            $httpBackend.whenPUT('/mobirest/groups/' + encodeURIComponent(groupTitle), newGroup.jsonld).respond(200);
            userManagerSvc.updateGroup(groupTitle, newGroup)
                .then(_.noop, () => fail('Promise should have resolved'));
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
                .then(response => fail('Promise should have rejected'), response => expect(response).toBe(this.error));
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({status: 400, statusText: this.error}));
        });
        it('with the passed title', function() {
            var groupTitle = userManagerSvc.groups[0].title;
            $httpBackend.whenDELETE('/mobirest/groups/' + groupTitle).respond(200)
            userManagerSvc.deleteGroup(groupTitle)
                .then(_.noop, () => fail('Promise should have resolved'));
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
                .then(response => fail('Promise should have rejected'), response => expect(response).toBe(this.error));
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({status: 400, statusText: this.error}));
        });
        it('using the passed parameters', function() {
            $httpBackend.whenPUT('/mobirest/groups/' + this.group.title + '/roles?' + $httpParamSerializer(this.params)).respond(200);
            userManagerSvc.addGroupRoles(this.group.title, this.params.roles)
                .then(_.noop, () => fail('Promise should have resolved'));
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
                .then(response => fail('Promise should have rejected'), response => expect(response).toBe(this.error));
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({status: 400, statusText: this.error}));
        });
        it('using the passed parameters', function() {
            var groupTitle = userManagerSvc.groups[0].title;
            $httpBackend.whenDELETE('/mobirest/groups/' + groupTitle + '/roles?' + $httpParamSerializer(this.params)).respond(200);
            userManagerSvc.deleteGroupRole(groupTitle,this. params.role)
                .then(_.noop, () => fail('Promise should have resolved'));
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
                .then(response => fail('Promise should have rejected'), response => expect(response).toBe(this.error));
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({status: 400, statusText: this.error}));
        });
        it('successfully', function() {
            $httpBackend.whenGET('/mobirest/groups/' + this.groupTitle + '/users').respond(200, []);
            userManagerSvc.getGroupUsers(this.groupTitle)
                .then(response => expect(response).toEqual([]));
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
                .then(response => fail('Promise should have rejected'), response => expect(response).toBe(this.error));
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({status: 400, statusText: this.error}));
        });
        it('successfully', function() {
            $httpBackend.whenPUT('/mobirest/groups/' + this.group.title + '/users?' + $httpParamSerializer(this.params)).respond(200);
            userManagerSvc.addGroupUsers(this.group.title, this.params.users)
                .then(_.noop, () => fail('Promise should have resolved'));
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
                .then(response => fail('Promise should have rejected'), response => expect(response).toBe(this.error));
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({status: 400, statusText: this.error}));
        });
        it('successfully', function() {
            $httpBackend.whenDELETE('/mobirest/groups/' + this.group.title + '/users?' + $httpParamSerializer(this.params)).respond(200);
            userManagerSvc.deleteGroupUser(this.group.title, this.params.user)
                .then(_.noop, () => fail('Promise should have resolved'));
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
            };
            expect(userManagerSvc.getUserDisplay(userObject)).toEqual('first last');
        });
        it('when there is not a first or last but there is a username', function() {
            var userObject = {
                username: 'username'
            };
            expect(userManagerSvc.getUserDisplay(userObject)).toEqual('username');
        });
        it('when there is not a first, last, or username', function() {
            expect(userManagerSvc.getUserDisplay({})).toEqual('[Not Available]');
        });
    });
});
