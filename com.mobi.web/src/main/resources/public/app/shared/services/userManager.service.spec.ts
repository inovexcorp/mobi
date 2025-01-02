/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { MockProvider } from 'ng-mocks';
import { cloneDeep } from 'lodash';

import {
    cleanStylesFromDOM
} from '../../../test/ts/Shared';
import { Group } from '../models/group.interface';
import { JSONLDObject } from '../models/JSONLDObject.interface';
import { User } from '../models/user.class';
import { ADMIN_USER_IRI } from '../../constants';
import { DCTERMS, FOAF, ROLES, USER } from '../../prefixes';
import { ProgressSpinnerService } from '../components/progress-spinner/services/progressSpinner.service';
import { NewUserConfig } from '../models/new-user-config';
import { UserManagerService } from './userManager.service';

describe('User Manager service', function() {
    let service: UserManagerService;
    let progressSpinnerStub: jasmine.SpyObj<ProgressSpinnerService>;
    let httpMock: HttpTestingController;
    const userRdf: JSONLDObject = {
        '@id': 'urn:userIri',
        '@type': [`${USER}User`],
        [`${USER}username`]: [{'@value': 'username'}],
        [`${FOAF}firstName`]: [{'@value': 'John'}],
        [`${FOAF}lastName`]: [{'@value': 'Doe'}],
        [`${FOAF}mbox`]: [{'@id': 'john.doe@gmail.com'}],
        [`${USER}hasUserRole`]: [{'@id': `${ROLES}user`}]
    };
    const user: User = new User(userRdf);
    let groupRdf: JSONLDObject;
    let group: Group;

    const error = 'Error Message';

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ HttpClientTestingModule ],
            providers: [
                UserManagerService,
                MockProvider(ProgressSpinnerService)
            ]
        });

        service = TestBed.inject(UserManagerService);
        progressSpinnerStub = TestBed.inject(ProgressSpinnerService) as jasmine.SpyObj<ProgressSpinnerService>;
        httpMock = TestBed.inject(HttpTestingController) as jasmine.SpyObj<HttpTestingController>;

        progressSpinnerStub.track.and.callFake(ob => ob);
        
        group = {
            external: false,
            iri: 'urn:groupIri',
            title: 'title',
            description: 'description',
            members: [user.username],
            roles: ['user']
        };
        groupRdf = {
            '@id': group.iri,
            '@type': [],
            [`${DCTERMS}title`]: [{'@value': group.title}],
            [`${DCTERMS}description`]: [{'@value': group.description}],
            [`${FOAF}member`]: [userRdf],
            [`${USER}hasGroupRole`]: [{'@id': ROLES + group.roles[0]}]
        };
        group.jsonld = groupRdf;
    });

    afterEach(function() {
        cleanStylesFromDOM();
        service = null;
        httpMock = null;
        group = null;
        groupRdf = null;
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('should reset the service', function() {
        service.users = [user];
        service.groups = [group];
        service.reset();
        expect(service.users).toEqual([]);
        expect(service.groups).toEqual([]);
    });
    describe('should set the correct initial state for users and groups', function() {
        beforeEach(function() {
            spyOn(service, 'getGroupObj').and.returnValue(group);
        });
        it('successfully', fakeAsync(function() {
            spyOn(service, 'getUsers').and.returnValue(of([userRdf]));
            spyOn(service, 'getGroups').and.returnValue(of([groupRdf]));
            service.initialize().subscribe();
            tick();
            expect(service.getUsers).toHaveBeenCalledWith();
            expect(service.getGroups).toHaveBeenCalledWith();
            expect(service.getGroupObj).toHaveBeenCalledWith(groupRdf);
            expect(service.users).toEqual([user]);
            expect(service.groups).toEqual([group]);
        }));
        it('unless there is an error', fakeAsync(function() {
            const errorResp = new HttpErrorResponse({statusText: error});
            spyOn(service, 'getUsers').and.returnValue(throwError(errorResp));
            spyOn(service, 'getGroups').and.returnValue(of([groupRdf]));
            service.initialize().subscribe();
            tick();
            expect(service.getUsers).toHaveBeenCalledWith();
            expect(service.getGroups).not.toHaveBeenCalled();
        }));
    });
    describe('should get users', function() {
        it('successfully', function() {
            service.getUsers().subscribe(response => {
                expect(response).toEqual([userRdf]);
            }, () => fail('Promise should have resolved'));
            const request = httpMock.expectOne({url: service.userPrefix, method: 'GET'});
            request.flush([userRdf]);
        });
        it('unless an error occurs', function() {
            service.getUsers().subscribe(() => fail('Promise should have rejected'), response => {
                expect(response).toEqual(error);
            });
            const request = httpMock.expectOne({url: service.userPrefix, method: 'GET'});
            request.flush('flush', { status: 400, statusText: error });
        });
    });
    describe('should get groups', function() {
        it('successfully', function() {
            service.getGroups().subscribe(response => {
                expect(response).toEqual([groupRdf]);
            }, () => fail('Promise should have resolved'));
            const request = httpMock.expectOne({url: service.groupPrefix, method: 'GET'});
            request.flush([groupRdf]);
        });
        it('unless an error occurs', function() {
            service.getGroups().subscribe(() => fail('Promise should have rejected'), response => {
                expect(response).toEqual(error);
            });
            const request = httpMock.expectOne({url: service.groupPrefix, method: 'GET'});
            request.flush('flush', { status: 400, statusText: error });
        });
    });
    describe('should get the username of the user with the passed iri', function() {
        beforeEach(function() {
            this.params = { iri: 'iri' };
            spyOn(service, 'getUser').and.returnValue(of(user));
        });
        it('if it has been found before', fakeAsync(function() {
            service.users = [user];
            service.getUsername(user.iri)
                .subscribe(response => expect(response).toEqual(user.username), () => fail('Promise should have resolved'));
            tick();
            expect(service.getUser).not.toHaveBeenCalled();
        }));
        describe('if it has not been found before', function() {
            it('unless an error occurs', function() {
                service.getUsername('iri')
                    .subscribe(() => fail('Promise should have rejected'), response => {
                        expect(response).toEqual(error);
                    });
                const request = httpMock.expectOne(req => req.url === `${service.userPrefix}/username` && req.method === 'GET');
                expect(request.request.params.get('iri')).toEqual('iri');
                request.flush('flush', { status: 400, statusText: error });
                expect(service.getUser).not.toHaveBeenCalled();
              });
            it('successfully', function() {
                service.getUsername('iri')
                    .subscribe(response => {
                        expect(response).toEqual(user.username);
                    }, () => fail('Promise should have resolved'));
                const request = httpMock.expectOne(req => req.url === `${service.userPrefix}/username` && req.method === 'GET');
                expect(request.request.params.get('iri')).toEqual('iri');
                request.flush(user.username);
                expect(service.getUser).toHaveBeenCalledWith(user.username);
            });
        });
    });
    describe('should add a user', function() {
        const config: NewUserConfig = {
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            password: 'pw',
            roles: ['user']
        };
        beforeEach(function() {
            spyOn(service, 'getUser').and.returnValue(of(user));
        });
        it('unless an error occurs', function() {
            service.addUser(config)
                .subscribe(() => fail('Promise should have rejected'), response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne({url: service.userPrefix, method: 'POST'});
            expect(request.request.body instanceof FormData).toBeTrue();
            expect((request.request.body as FormData).get('username').toString()).toEqual(config.username);
            expect((request.request.body as FormData).get('password').toString()).toEqual(config.password);
            expect((request.request.body as FormData).get('firstName').toString()).toEqual(config.firstName);
            expect((request.request.body as FormData).get('lastName').toString()).toEqual(config.lastName);
            expect((request.request.body as FormData).get('email').toString()).toEqual(config.email);
            expect((request.request.body as FormData).getAll('roles')).toEqual(config.roles);
            request.flush('flush', { status: 400, statusText: error });
        });
        it('successfully', function() {
            service.addUser(config)
                .subscribe(() => {
                    expect(service.getUser).toHaveBeenCalledWith(user.username);
                }, () => fail('Promise should have resolved'));
            const request = httpMock.expectOne({url: service.userPrefix, method: 'POST'});
            expect(request.request.body instanceof FormData).toBeTrue();
            expect((request.request.body as FormData).get('username').toString()).toEqual(config.username);
            expect((request.request.body as FormData).get('password').toString()).toEqual(config.password);
            expect((request.request.body as FormData).get('firstName').toString()).toEqual(config.firstName);
            expect((request.request.body as FormData).get('lastName').toString()).toEqual(config.lastName);
            expect((request.request.body as FormData).get('email').toString()).toEqual(config.email);
            expect((request.request.body as FormData).getAll('roles')).toEqual(config.roles);
            request.flush(200);
        });
    });
    describe('should retrieve a user', function() {
        it('unless an error occurs', function() {
            service.getUser('user')
                .subscribe(() => fail('Promise should have rejected'), response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne({url: `${service.userPrefix}/user`, method: 'GET'});
            request.flush('flush', { status: 400, statusText: error });
        });
        describe('successfully and update the users list if', function() {
            it('the user was already retrieved', function() {
                const copyUser = cloneDeep(userRdf);
                delete copyUser[`${FOAF}firstName`];
                service.users = [new User(copyUser)];
                service.getUser(user.username)
                    .subscribe(response => {
                        expect(response.iri).toEqual(user.iri);
                        expect(service.users.length).toEqual(1);
                        expect(service.users[0]).toEqual(user);
                    }, () => fail('Promise should have resolved'));
                const request = httpMock.expectOne({url: `${service.userPrefix}/${user.username}`, method: 'GET'});
                request.flush(userRdf);
            });
            it('the user has not been retrieved', function() {
                service.getUser(user.username)
                    .subscribe(response => {
                        expect(response.iri).toEqual(user.iri);
                        expect(service.users.length).toEqual(1);
                        expect(service.users[0]).toEqual(user);
                    }, () => fail('Promise should have resolved'));
                const request = httpMock.expectOne({url: `${service.userPrefix}/${user.username}`, method: 'GET'});
                request.flush(userRdf);
            });
        });
    });
    describe('should update a user', function() {
        const newUserRdf: JSONLDObject = cloneDeep(userRdf);
        newUserRdf[`${FOAF}firstName`] = [{ '@value': 'NEW' }];
        const newUser: User = new User(newUserRdf);
        beforeEach(function() {
            service.users = [user];
        });
        it('unless an error occurs', function() {
            service.updateUser(user.username, newUser)
                .subscribe(() => fail('Promise should have rejected'), response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne({url: `${service.userPrefix}/${user.username}`, method: 'PUT'});
            expect(request.request.body).toEqual(newUserRdf);
            request.flush('flush', { status: 400, statusText: error });
        });
        it('successfully', function() {
            service.updateUser(user.username, newUser)
                .subscribe(() => {
                    expect(service.users).toContain(newUser);
                }, () => fail('Promise should have resolved'));
            const request = httpMock.expectOne({url: `${service.userPrefix}/${user.username}`, method: 'PUT'});
            expect(request.request.body).toEqual(newUserRdf);
            request.flush(200);
        });
    });
    describe('should change a user password', function() {
        it('unless an error occurs', function() {
            service.changePassword(user.username, 'currentPassword', 'newPassword')
                .subscribe(() => fail('Promise should have rejected'), response => {
                    expect(response).toEqual({error: '', errorMessage: error, errorDetails: []});
                });
            const request = httpMock.expectOne(req => req.url === `${service.userPrefix}/${user.username}/password` && req.method === 'POST');
            expect(request.request.params.get('currentPassword')).toEqual('currentPassword');
            expect(request.request.params.get('newPassword')).toEqual('newPassword');
            request.flush({error: '', errorMessage: error, errorDetails: []}, { status: 400, statusText: error});
        });
        it('successfully', function() {
            service.changePassword(user.username, 'currentPassword', 'newPassword')
                .subscribe(() => {
                    expect(true).toBeTrue();
                });
            const request = httpMock.expectOne(req => req.url === `${service.userPrefix}/${user.username}/password` && req.method === 'POST');
            expect(request.request.params.get('currentPassword')).toEqual('currentPassword');
            expect(request.request.params.get('newPassword')).toEqual('newPassword');
            request.flush(200);
        });
    });
    describe('should reset a user password', function() {
        it('unless an error occurs', function() {
            service.resetPassword(user.username, 'newPassword')
                .subscribe(() => fail('Promise should have rejected'), response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne(req => req.url === `${service.userPrefix}/${user.username}/password` && req.method === 'PUT');
            expect(request.request.params.get('newPassword')).toEqual('newPassword');
            request.flush('flush', { status: 400, statusText: error });
        });
        it('successfully', function() {
            service.resetPassword(user.username, 'newPassword')
                .subscribe(() => {
                    expect(true).toBeTrue();
                }, () => fail('Promise should have resolved'));
            const request = httpMock.expectOne(req => req.url === `${service.userPrefix}/${user.username}/password` && req.method === 'PUT');
            expect(request.request.params.get('newPassword')).toEqual('newPassword');
            request.flush(200);
        });
    });
    describe('should delete a user', function() {
        beforeEach(function() {
            service.users = [user];
            service.groups = [group];
        });
        it('unless an error occurs', function() {
            service.deleteUser(user.username)
                .subscribe(() => fail('Promise should have rejected'), response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne({url: `${service.userPrefix}/${user.username}`, method: 'DELETE'});
            request.flush('flush', { status: 400, statusText: error });
        });
        it('with the passed username', function() {
            service.deleteUser(user.username)
                .subscribe(() => {
                    expect(service.users).not.toContain(user);
                    expect(group.members).not.toContain(user.username);
                }, () => fail('Promise should have resolved'));
            const request = httpMock.expectOne({url: `${service.userPrefix}/${user.username}`, method: 'DELETE'});
            request.flush(200);
        });
    });
    describe('should add roles to a user', function() {
        const roles = ['role1', 'role2'];
        beforeEach(function() {
            service.users = [user];
        });
        it('unless an error occurs', function() {
             service.addUserRoles(user.username, roles)
                .subscribe(() => fail('Promise should have rejected'), response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne(req => req.url === `${service.userPrefix}/${user.username}/roles` && req.method === 'PUT');
            expect(request.request.params.getAll('roles')).toEqual(roles);
            request.flush('flush', { status: 400, statusText: error });
        });
        it('using the passed parameters', function() {
            const originalRoles = user.roles;
            service.addUserRoles(user.username, roles)
                .subscribe(() => {
                    expect(user.roles).toEqual(originalRoles.concat(roles));
                }, () => fail('Promise should have resolved'));
            const request = httpMock.expectOne(req => req.url === `${service.userPrefix}/${user.username}/roles` && req.method === 'PUT');
            expect(request.request.params.getAll('roles')).toEqual(roles);
            request.flush(200);
        });
    });
    describe('should remove a role from a user', function() {
        beforeEach(function() {
            service.users = [user];
        });
        it('unless an error occurs', function() {
            service.deleteUserRole(user.username, 'user')
                .subscribe(() => fail('Promise should have rejected'), response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne(req => req.url === `${service.userPrefix}/${user.username}/roles` && req.method === 'DELETE');
            expect(request.request.params.get('role')).toEqual('user');
            request.flush('flush', { status: 400, statusText: error });
        });
        it('using the passed parameters', function() {
            service.deleteUserRole(user.username, 'user')
                .subscribe(() => {
                    expect(user.roles).toEqual([]);
                }, () => fail('Promise should have resolved'));
            const request = httpMock.expectOne(req => req.url === `${service.userPrefix}/${user.username}/roles` && req.method === 'DELETE');
            expect(request.request.params.get('role')).toEqual('user');
            request.flush(200);
        });
    });
    describe('should add a group to a user', function() {
        beforeEach(function() {
            service.users = [user];
            group.members = [];
            service.groups = [group];
        });
        it('unless an error occurs', function() {
            service.addUserGroup(user.username, group.title)
                .subscribe(() => fail('Promise should have rejected'), response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne(req => req.url === `${service.userPrefix}/${user.username}/groups` && req.method === 'PUT');
            expect(request.request.params.get('group')).toEqual(group.title);
            request.flush('flush', { status: 400, statusText: error });
        });
        it('using the passed parameters', function() {
            service.addUserGroup(user.username, group.title)
                .subscribe(() => {
                    expect(group.members).toContain(user.username);
                }, () => fail('Promise should have resolved'));
            const request = httpMock.expectOne(req => req.url === `${service.userPrefix}/${user.username}/groups` && req.method === 'PUT');
            expect(request.request.params.get('group')).toEqual(group.title);
            request.flush(200);
        });
    });
    describe('should remove a group from a user', function() {
        beforeEach(function() {
            service.users = [user];
            service.groups = [group];
        });
        it('unless an error occurs', function() {
            service.deleteUserGroup(user.username, group.title)
                .subscribe(() => fail('Promise should have rejected'), response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne(req => req.url === `${service.userPrefix}/${user.username}/groups` && req.method === 'DELETE');
            expect(request.request.params.get('group')).toEqual(group.title);
            request.flush('flush', { status: 400, statusText: error });
        });
        it('using the passed parameters', function() {
            service.deleteUserGroup(user.username, group.title)
                .subscribe(() => {
                    expect(group.members).not.toContain(user.username);
                }, () => fail('Promise should have resolved'));
            const request = httpMock.expectOne(req => req.url === `${service.userPrefix}/${user.username}/groups` && req.method === 'DELETE');
            expect(request.request.params.get('group')).toEqual(group.title);
            request.flush(200);
        });
    });
    describe('should add a group', function() {
        beforeEach(function() {
            spyOn(service, 'getGroup').and.returnValue(of(group));
        });
        it('unless an error occurs', function() {
            service.addGroup(group)
                .subscribe(() => fail('Promise should have rejected'), response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne({url: service.groupPrefix, method: 'POST'});
            expect(request.request.body instanceof FormData).toBeTrue();
            request.flush('flush', { status: 400, statusText: error });
        });
        it('successfully', function() {
            service.addGroup(group)
                .subscribe(() => {
                    expect(service.getGroup).toHaveBeenCalledWith(group.title);
                }, () => fail('Promise should have resolved'));
            const request = httpMock.expectOne({url: service.groupPrefix, method: 'POST'});
            expect(request.request.body instanceof FormData).toBeTrue();
            request.flush(200);
        });
    });
    describe('should retrieve a group', function() {
        it('unless an error occurs', function() {
            service.getGroup(group.title)
                .subscribe(() => fail('Promise should have rejected'), response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne({url: `${service.groupPrefix}/${group.title}`, method: 'GET'});
            request.flush('flush', { status: 400, statusText: error });
        });
        describe('successfully and update the groups list if', function() {
            beforeEach(function() {
                spyOn(service, 'getGroupObj').and.returnValue(group);
            });
            it('the group was already retrieved', function() {
                const copyGroup = Object.assign({}, group);
                delete copyGroup.description;
                service.groups = [copyGroup];
                service.getGroup(group.title)
                    .subscribe(response => {
                        expect(response.iri).toEqual(group.iri);
                        expect(service.groups.length).toEqual(1);
                        expect(service.groups[0]).toEqual(group);
                    }, () => fail('Promise should have resolved'));
                const request = httpMock.expectOne({url: `${service.groupPrefix}/${group.title}`, method: 'GET'});
                request.flush(groupRdf);
            });
            it('the group has not been retrieved', function() {
                service.getGroup(group.title)
                    .subscribe(response => {
                        expect(response.iri).toEqual(group.iri);
                        expect(service.groups.length).toEqual(1);
                        expect(service.groups[0]).toEqual(group);
                    }, () => fail('Promise should have resolved'));
                const request = httpMock.expectOne({url: `${service.groupPrefix}/${group.title}`, method: 'GET'});
                request.flush(groupRdf);
            });
        });
    });
    describe('should update a group', function() {
        beforeEach(function() {
            service.groups = [group];
            this.newGroup = Object.assign({}, group);
            this.newGroup.description = 'NEW';
        });
        it('unless an error occurs', function() {
            service.updateGroup(group.title, this.newGroup)
                .subscribe(() => fail('Promise should have rejected'), response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne({url: `${service.groupPrefix}/${group.title}`, method: 'PUT'});
            expect(request.request.body).toEqual(this.newGroup.jsonld);
            request.flush('flush', { status: 400, statusText: error });
        });
        it('successfully', function() {
            service.updateGroup(group.title, this.newGroup)
                .subscribe(() => {
                    expect(service.groups).toContain(this.newGroup);
                }, () => fail('Promise should have resolved'));
            const request = httpMock.expectOne({url: `${service.groupPrefix}/${group.title}`, method: 'PUT'});
            expect(request.request.body).toEqual(this.newGroup.jsonld);
            request.flush(200);
        });
    });
    describe('should delete a group', function() {
        beforeEach(function() {
            service.groups = [group];
        });
        it('unless an error occurs', function() {
            service.deleteGroup(group.title)
                .subscribe(() => fail('Promise should have rejected'), response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne({url: `${service.groupPrefix}/${group.title}`, method: 'DELETE'});
            request.flush('flush', { status: 400, statusText: error });
    });
        it('with the passed title', function() {
            service.deleteGroup(group.title)
                .subscribe(() => {
                    expect(service.groups).not.toContain(group);
                }, () => fail('Promise should have resolved'));
            const request = httpMock.expectOne({url: `${service.groupPrefix}/${group.title}`, method: 'DELETE'});
            request.flush(200);
        });
    });
    describe('should add roles to a group', function() {
        const roles = ['role1', 'role2'];
        beforeEach(function() {
            service.groups = [group];
        });
        it('unless an error occurs', function() {
            service.addGroupRoles(group.title, roles)
                .subscribe(() => fail('Promise should have rejected'), response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne(req => req.url === `${service.groupPrefix}/${group.title}/roles` && req.method === 'PUT');
            expect(request.request.params.getAll('roles')).toEqual(roles);
            request.flush('flush', { status: 400, statusText: error });
        });
        it('using the passed parameters', function() {
            const originalRoles = group.roles;
            service.addGroupRoles(group.title, roles)
                .subscribe(() => {
                    expect(group.roles).toEqual(originalRoles.concat(roles));
                }, () => fail('Promise should have resolved'));
            const request = httpMock.expectOne(req => req.url === `${service.groupPrefix}/${group.title}/roles` && req.method === 'PUT');
            expect(request.request.params.getAll('roles')).toEqual(roles);
            request.flush(200);
        });
    });
    describe('should remove a role from a group', function() {
        beforeEach(function() {
            group.roles = ['role'];
            service.groups = [group];
        });
        it('unless an error occurs', function() {
            service.deleteGroupRole(group.title, 'role')
                .subscribe(() => fail('Promise should have rejected'), response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne(req => req.url === `${service.groupPrefix}/${group.title}/roles` && req.method === 'DELETE');
            expect(request.request.params.get('role')).toEqual('role');
            request.flush('flush', { status: 400, statusText: error });
        });
        it('using the passed parameters', function() {
            service.deleteGroupRole(group.title, 'role')
                .subscribe(() => {
                    expect(group.roles).toEqual([]);
                }, () => fail('Promise should have resolved'));
            const request = httpMock.expectOne(req => req.url === `${service.groupPrefix}/${group.title}/roles` && req.method === 'DELETE');
            expect(request.request.params.get('role')).toEqual('role');
            request.flush(200);
        });
    });
    describe('should get the list of users in a group', function() {
        it('unless an error occurs', function() {
            service.getGroupUsers(group.title)
                .subscribe(() => fail('Promise should have rejected'), response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne({url: `${service.groupPrefix}/${group.title}/users`, method: 'GET'});
            request.flush('flush', { status: 400, statusText: error });
        });
        it('successfully', function() {
            service.getGroupUsers(group.title)
                .subscribe(response => {
                    expect(response).toEqual([userRdf]);
                }, () => fail('Promise should have resolved'));
            const request = httpMock.expectOne({url: `${service.groupPrefix}/${group.title}/users`, method: 'GET'});
            request.flush([userRdf]);
        });
    });
    describe('should add users to a group', function() {
        const users = ['user1', 'user2'];
        beforeEach(function() {
            service.groups = [group];
        });
        it('unless an error occurs', function() {
            service.addGroupUsers(group.title, users)
                .subscribe(() => fail('Promise should have rejected'), response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne(req => req.url === `${service.groupPrefix}/${group.title}/users` && req.method === 'PUT');
            expect(request.request.params.getAll('users')).toEqual(users);
            request.flush('flush', { status: 400, statusText: error });
        });
        it('successfully', function() {
            const originalMembers = group.members;
            service.addGroupUsers(group.title, users)
                .subscribe(() => {
                    expect(group.members).toEqual(originalMembers.concat(users));
                }, () => fail('Promise should have resolved'));
            const request = httpMock.expectOne(req => req.url === `${service.groupPrefix}/${group.title}/users` && req.method === 'PUT');
            expect(request.request.params.getAll('users')).toEqual(users);
            request.flush(200);
        });
    });
    describe('should remove a user from a group', function() {
        beforeEach(function() {
            service.groups = [group];
        });
        it('unless an error occurs', function() {
            service.deleteGroupUser(group.title, user.username)
                .subscribe(() => fail('Promise should have rejected'), response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne(req => req.url === `${service.groupPrefix}/${group.title}/users` && req.method === 'DELETE');
            expect(request.request.params.get('user')).toEqual(user.username);
            request.flush('flush', { status: 400, statusText: error });
        });
        it('successfully', function() {
            service.deleteGroupUser(group.title, user.username)
                .subscribe(() => {
                    expect(group.members).toEqual([]);
                }, () => fail('Promise should have resolved'));
            const request = httpMock.expectOne(req => req.url === `${service.groupPrefix}/${group.title}/users` && req.method === 'DELETE');
            expect(request.request.params.get('user')).toEqual(user.username);
            request.flush(200);
        });
    });
    describe('should test whether a user is an admin', function() {
        it('based on user roles', function() {
            expect(service.isAdmin(user.username)).toBeFalse();
            
            const copyUser = cloneDeep(user.jsonld);
            copyUser[`${USER}hasUserRole`] = [{ '@id': `${ROLES}user` }, {'@id': `${ROLES}admin`}];
            service.users = [new User(copyUser)];
            expect(service.isAdmin(user.username)).toBeTrue();
        });
        it('based on group roles', function() {
            service.users = [user];
            group.roles.push('admin');
            service.groups = [group];
            expect(service.isAdmin(user.username)).toBeTrue();

            group.roles = [];
            expect(service.isAdmin(user.username)).toBeFalse();
        });
    });
    it('should test whether a user is the admin user', function() {
        expect(service.isAdminUser(user.iri)).toBeFalse();
        expect(service.isAdminUser(ADMIN_USER_IRI)).toBeTrue();
    });
    it('should determine whether a group is external', function() {
        expect(service.isExternalGroup(groupRdf)).toBeFalse();
        groupRdf['@type'] = [`${USER}Group`, `${USER}ExternalGroup`];
        expect(service.isExternalGroup(groupRdf)).toBeTrue();
        groupRdf['@type'] = [`${USER}Group`];
        expect(service.isExternalGroup(groupRdf)).toBeFalse();
        groupRdf['@type'] = [`${USER}User`];
        expect(service.isExternalGroup(groupRdf)).toBeFalse();
    });
    it('should create a group object', function() {
        spyOn(service, 'isExternalGroup').and.returnValue(false);
        groupRdf[`${USER}hasGroupRole`] = [{'@id': 'role'}];
        service.users = [user];
        const result = service.getGroupObj(groupRdf);
        expect(result.jsonld).toEqual(groupRdf);
        expect(result.external).toEqual(false);
        expect(result.iri).toEqual(groupRdf['@id']);
        expect(result.title).toEqual('title');
        expect(result.description).toEqual('description');
        expect(result.members).toEqual([user.username]);
        expect(result.roles).toEqual(['role']);
    });
    describe('should handle a search of a users list when', function() {
        beforeEach(function() {
            this.user2 = {
                username: 'seconduser',
                firstName: 'secondfirst',
                lastName: 'secondlast',
                email: '',
                external: false,
                roles: []
            };
            this.user3 = {
                username: 'thirduser',
                firstName: 'onlyfirst',
                lastName: '',
                email: '',
                external: false,
                roles: []
            };
            this.user4 = {
                username: 'fourthuser',
                firstName: '',
                lastName: 'onlylast',
                email: '',
                external: false,
                roles: []
            };
            this.users = [user, this.user2, this.user3, this.user4];
        });
        it('searchText is empty', function() {
            expect(service.filterUsers(this.users, '')).toEqual([this.user4, this.user2, this.user3, user]);
        });
        it('searchText does not match any users', function() {
            expect(service.filterUsers(this.users, 'thisstringdoesnotmatch')).toEqual([]);
        });
        it('searchText matches all users', function() {
            expect(service.filterUsers(this.users, 'user')).toEqual([this.user4, this.user2, this.user3, user]);
        });
        it('searchText matches only first name', function() {
            expect(service.filterUsers(this.users, 'John')).toEqual([user]);
        });
        it('searchText matches only last name', function() {
            expect(service.filterUsers(this.users, 'secondlast')).toEqual([this.user2]);
        });
        it('searchText matches only username', function() {
            expect(service.filterUsers(this.users, 'seconduser')).toEqual([this.user2]);
        });
        it('searchText matches firstName lastName', function() {
            expect(service.filterUsers(this.users, 'John Doe')).toEqual([user]);
        });
        it('searchText matches lastName firstName', function() {
            expect(service.filterUsers(this.users, 'Doe John')).toEqual([user]);
        });
        it('searchText matches lastName, firstName', function() {
            expect(service.filterUsers(this.users, 'Doe, John')).toEqual([user]);
        });
        it('searchText matches but casing is different', function() {
            expect(service.filterUsers(this.users, 'dOe jOhN')).toEqual([user]);
        });
        it('searchText matches two users', function() {
            expect(service.filterUsers(this.users, 'only')).toEqual([this.user4, this.user3]);
        });
    });
    describe('should handle a search of a groups list when', function() {
        beforeEach(function() {
            this.group1= {title: 'other title', description: '', external: false, members: [], roles: []};
            this.groups = [group, this.group1];
        });
        it('searchText is empty', function() {
            expect(service.filterGroups(this.groups, '')).toEqual([this.group1, group]);
        });
        it('searchText does not match any groups', function() {
            expect(service.filterGroups(this.groups, 'NO')).toEqual([]);
        });
        it('searchText matches all groups', function() {
            expect(service.filterGroups(this.groups, 'title')).toEqual([this.group1, group]);
        });
        it('searchText matches one group', function() {
            expect(service.filterGroups(this.groups, 'other')).toEqual([this.group1]);
        });
        it('searchText matches but casing is different', function() {
            expect(service.filterGroups(this.groups, 'oThEr')).toEqual([this.group1]);
        });
    });
});
