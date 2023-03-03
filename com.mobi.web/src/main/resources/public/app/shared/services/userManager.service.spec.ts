/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2023 iNovex Information Systems, Inc.
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
import { HttpErrorResponse, HttpParams } from '@angular/common/http';
import { MockProvider } from 'ng-mocks';

import {
    cleanStylesFromDOM
} from '../../../test/ts/Shared';
import { Group } from '../models/group.interface';
import { JSONLDObject } from '../models/JSONLDObject.interface';
import { User } from '../models/user.interface';
import { ADMIN_USER_IRI } from '../../constants';
import { DCTERMS, FOAF, ROLES, USER } from '../../prefixes';
import { UtilService } from './util.service';
import { ProgressSpinnerService } from '../components/progress-spinner/services/progressSpinner.service';
import { UserManagerService } from './userManager.service';

describe('User Manager service', function() {
    let service: UserManagerService;
    let utilStub: jasmine.SpyObj<UtilService>;
    let progressSpinnerStub: jasmine.SpyObj<ProgressSpinnerService>;
    let httpMock: HttpTestingController;
    let user: User;
    let group: Group;
    let userRdf: JSONLDObject;
    let groupRdf: JSONLDObject;

    const error = 'Error Message';

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ HttpClientTestingModule ],
            providers: [
                UserManagerService,
                MockProvider(UtilService),
                MockProvider(ProgressSpinnerService)
            ]
        });

        service = TestBed.inject(UserManagerService);
        utilStub = TestBed.inject(UtilService) as jasmine.SpyObj<UtilService>;
        progressSpinnerStub = TestBed.inject(ProgressSpinnerService) as jasmine.SpyObj<ProgressSpinnerService>;
        httpMock = TestBed.inject(HttpTestingController) as jasmine.SpyObj<HttpTestingController>;

        progressSpinnerStub.track.and.callFake(ob => ob);
        utilStub.trackedRequest.and.callFake((ob) => ob);
        utilStub.handleError.and.callFake(error => {
            if (error.status === 0) {
                return throwError('');
            } else {
                return throwError(error.statusText || 'Something went wrong. Please try again later.');
            }
        });
        utilStub.createHttpParams.and.callFake(params => {
            let httpParams: HttpParams = new HttpParams();
            Object.keys(params).forEach(param => {
                if (params[param] !== undefined && params[param] !== null && params[param] !== '') {
                    if (Array.isArray(params[param])) {
                        params[param].forEach(el => {
                            httpParams = httpParams.append(param, '' + el);
                        });
                    } else {
                        httpParams = httpParams.append(param, '' + params[param]);
                    }
                }
            });
        
            return httpParams;
        });

        user = {
            external: false,
            iri: 'urn:userIri',
            username: 'username',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@gmail.com',
            roles: ['user']
        };
        userRdf = {
            '@id': user.iri,
            '@type': [],
            [USER + 'username']: [{'@value': user.username}],
            [FOAF + 'firstName']: [{'@value': user.firstName}],
            [FOAF + 'lastName']: [{'@value': user.lastName}],
            [FOAF + 'mbox']: [{'@id': user.email}],
            [USER + 'hasUserRole']: [{'@id': ROLES + user.roles[0]}]
        };
        user.jsonld = userRdf;
        
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
            [DCTERMS + 'title']: [{'@value': group.title}],
            [DCTERMS + 'description']: [{'@value': group.description}],
            [FOAF + 'member']: [userRdf],
            [USER + 'hasGroupRole']: [{'@id': ROLES + group.roles[0]}]
        };
        group.jsonld = groupRdf;
        utilStub.getErrorDataObject.and.callFake(errorResp => {
            return {
                error: '',
                errorMessage: errorResp.statusText || '',
                errorDetails: []
            };
        });
        utilStub.getPropertyValue.and.callFake((jsonld, prop) => {
            if (prop === USER + 'username') {
                return user.username;
            } else if (prop === FOAF + 'firstName') {
                return user.firstName;
            } else if (prop === FOAF + 'lastName') {
                return user.lastName;
            }
        });
        utilStub.getPropertyId.and.callFake((jsonld, prop) => {
            if (prop === FOAF + 'mbox') {
                return user.email;
            }
        });
        utilStub.getDctermsValue.and.callFake((jsonld, prop) => {
            if (prop === 'title') {
                return group.title;
            } else if (prop === 'description') {
                return group.description;
            }
        });
        utilStub.getBeautifulIRI.and.callFake(iri => {
            if (iri === ROLES + 'user') {
                return 'user';
            }
        });
    });

    afterEach(function() {
        cleanStylesFromDOM();
        service = null;
        utilStub = null;
        httpMock = null;
        user = null;
        group = null;
        userRdf = null;
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
            spyOn(service, 'getUserObj').and.returnValue(user);
            spyOn(service, 'getGroupObj').and.returnValue(group);
        });
        it('successfully', fakeAsync(function() {
            spyOn(service, 'getUsers').and.returnValue(of([userRdf]));
            spyOn(service, 'getGroups').and.returnValue(of([groupRdf]));
            service.initialize().subscribe();
            tick();
            expect(service.getUsers).toHaveBeenCalledWith();
            expect(service.getGroups).toHaveBeenCalledWith();
            expect(service.getUserObj).toHaveBeenCalledWith(userRdf);
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
            expect(utilStub.getErrorMessage).toHaveBeenCalledWith(errorResp);
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
        });
        it('if it has been found before', fakeAsync(function() {
            service.users = [user];
            service.getUsername(user.iri)
                .subscribe(response => expect(response).toEqual(user.username), () => fail('Promise should have resolved'));
            tick();
        }));
        describe('if it has not been found before', function() {
            it('unless an error occurs', function() {
                service.getUsername('iri')
                    .subscribe(() => fail('Promise should have rejected'), response => {
                        expect(response).toEqual(error);
                        expect(utilStub.createHttpParams).toHaveBeenCalledWith({iri: 'iri'});
                    });
                const request = httpMock.expectOne(req => req.url === service.userPrefix + '/username' && req.method === 'GET');
                expect(request.request.params.get('iri')).toEqual('iri');
                request.flush('flush', { status: 400, statusText: error });
            });
            it('successfully', function() {
                const iri = user.iri;
                delete user.iri;
                service.users = [user];
                service.getUsername(iri)
                    .subscribe(response => {
                        expect(response).toEqual(user.username);
                        expect(user.iri).toEqual(iri);
                        expect(utilStub.createHttpParams).toHaveBeenCalledWith({iri: user.iri});
                    }, () => fail('Promise should have resolved'));
                const request = httpMock.expectOne(req => req.url === service.userPrefix + '/username' && req.method === 'GET');
                expect(request.request.params.get('iri')).toEqual(iri);
                request.flush(user.username);
            });
        });
    });
    describe('should add a user', function() {
        beforeEach(function() {
            spyOn(service, 'getUser').and.returnValue(of(user));
        });
        it('unless an error occurs', function() {
            service.addUser(user, 'pw')
                .subscribe(() => fail('Promise should have rejected'), response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne({url: service.userPrefix, method: 'POST'});
            expect(request.request.body instanceof FormData).toBeTrue();
            request.flush('flush', { status: 400, statusText: error });
        });
        it('successfully', function() {
            service.addUser(user, 'pw')
                .subscribe(() => {
                    expect(service.getUser).toHaveBeenCalledWith(user.username);
                }, () => fail('Promise should have resolved'));
            const request = httpMock.expectOne({url: service.userPrefix, method: 'POST'});
            expect(request.request.body instanceof FormData).toBeTrue();
            request.flush(200);
        });
    });
    describe('should retrieve a user', function() {
        it('unless an error occurs', function() {
            service.getUser('user')
                .subscribe(() => fail('Promise should have rejected'), response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne({url: service.userPrefix + '/user', method: 'GET'});
            request.flush('flush', { status: 400, statusText: error });
        });
        describe('successfully and update the users list if', function() {
            beforeEach(function() {
                spyOn(service, 'getUserObj').and.returnValue(user);
            });
            it('the user was already retrieved', function() {
                const copyUser = Object.assign({}, user);
                delete copyUser.firstName;
                service.users = [copyUser];
                service.getUser(user.username)
                    .subscribe(response => {
                        expect(response.iri).toEqual(user.iri);
                        expect(service.users.length).toEqual(1);
                        expect(service.users[0]).toEqual(user);
                    }, () => fail('Promise should have resolved'));
                const request = httpMock.expectOne({url: service.userPrefix + '/' + user.username, method: 'GET'});
                request.flush(userRdf);
            });
            it('the user has not been retrieved', function() {
                service.getUser(user.username)
                    .subscribe(response => {
                        expect(response.iri).toEqual(user.iri);
                        expect(service.users.length).toEqual(1);
                        expect(service.users[0]).toEqual(user);
                    }, () => fail('Promise should have resolved'));
                const request = httpMock.expectOne({url: service.userPrefix + '/' + user.username, method: 'GET'});
                request.flush(userRdf);
            });
        });
    });
    describe('should update a user', function() {
        beforeEach(function() {
            service.users = [user];
            this.newUser = Object.assign({}, user);
            this.newUser.firstName = 'NEW';
        });
        it('unless an error occurs', function() {
            service.updateUser(user.username, this.newUser)
                .subscribe(() => fail('Promise should have rejected'), response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne({url: service.userPrefix + '/' + user.username, method: 'PUT'});
            expect(request.request.body).toEqual(this.newUser.jsonld);
            request.flush('flush', { status: 400, statusText: error });
        });
        it('successfully', function() {
            service.updateUser(user.username, this.newUser)
                .subscribe(() => {
                    expect(service.users).toContain(this.newUser);
                }, () => fail('Promise should have resolved'));
            const request = httpMock.expectOne({url: service.userPrefix + '/' + user.username, method: 'PUT'});
            expect(request.request.body).toEqual(this.newUser.jsonld);
            request.flush(200);
        });
    });
    describe('should change a user password', function() {
        it('unless an error occurs', function() {
            service.changePassword(user.username, 'currentPassword', 'newPassword')
                .subscribe(() => fail('Promise should have rejected'), response => {
                    expect(response).toEqual({error: '', errorMessage: error, errorDetails: []});
                    expect(utilStub.createHttpParams).toHaveBeenCalledWith({currentPassword: 'currentPassword', newPassword: 'newPassword'});
                });
            const request = httpMock.expectOne(req => req.url === service.userPrefix + '/' + user.username + '/password' && req.method === 'POST');
            expect(request.request.params.get('currentPassword')).toEqual('currentPassword');
            expect(request.request.params.get('newPassword')).toEqual('newPassword');
            request.flush({error: '', errorMessage: error, errorDetails: []}, { status: 400, statusText: error});
        });
        it('successfully', function() {
            service.changePassword(user.username, 'currentPassword', 'newPassword')
                .subscribe(() => {
                    expect(utilStub.createHttpParams).toHaveBeenCalledWith({currentPassword: 'currentPassword', newPassword: 'newPassword'});
                });
            const request = httpMock.expectOne(req => req.url === service.userPrefix + '/' + user.username + '/password' && req.method === 'POST');
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
                    expect(utilStub.createHttpParams).toHaveBeenCalledWith({newPassword: 'newPassword'});
                });
            const request = httpMock.expectOne(req => req.url === service.userPrefix + '/' + user.username + '/password' && req.method === 'PUT');
            expect(request.request.params.get('newPassword')).toEqual('newPassword');
            request.flush('flush', { status: 400, statusText: error });
        });
        it('successfully', function() {
            service.resetPassword(user.username, 'newPassword')
                .subscribe(() => {
                    expect(utilStub.createHttpParams).toHaveBeenCalledWith({newPassword: 'newPassword'});
                }, () => fail('Promise should have resolved'));
            const request = httpMock.expectOne(req => req.url === service.userPrefix + '/' + user.username + '/password' && req.method === 'PUT');
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
            const request = httpMock.expectOne({url: service.userPrefix + '/' + user.username, method: 'DELETE'});
            request.flush('flush', { status: 400, statusText: error });
        });
        it('with the passed username', function() {
            service.deleteUser(user.username)
                .subscribe(() => {
                    expect(service.users).not.toContain(user);
                    expect(group.members).not.toContain(user.username);
                }, () => fail('Promise should have resolved'));
            const request = httpMock.expectOne({url: service.userPrefix + '/' + user.username, method: 'DELETE'});
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
                    expect(utilStub.createHttpParams).toHaveBeenCalledWith({ roles });
                });
            const request = httpMock.expectOne(req => req.url === service.userPrefix + '/' + user.username + '/roles' && req.method === 'PUT');
            expect(request.request.params.getAll('roles')).toEqual(roles);
            request.flush('flush', { status: 400, statusText: error });
        });
        it('using the passed parameters', function() {
            const originalRoles = user.roles;
            service.addUserRoles(user.username, roles)
                .subscribe(() => {
                    expect(user.roles).toEqual(originalRoles.concat(roles));
                    expect(utilStub.createHttpParams).toHaveBeenCalledWith({ roles });
                }, () => fail('Promise should have resolved'));
            const request = httpMock.expectOne(req => req.url === service.userPrefix + '/' + user.username + '/roles' && req.method === 'PUT');
            expect(request.request.params.getAll('roles')).toEqual(roles);
            request.flush(200);
        });
    });
    describe('should remove a role from a user', function() {
        beforeEach(function() {
            user.roles = ['role'];
            service.users = [user];
        });
        it('unless an error occurs', function() {
            service.deleteUserRole(user.username, 'role')
                .subscribe(() => fail('Promise should have rejected'), response => {
                    expect(response).toEqual(error);
                    expect(utilStub.createHttpParams).toHaveBeenCalledWith({ role: 'role' });
                });
            const request = httpMock.expectOne(req => req.url === service.userPrefix + '/' + user.username + '/roles' && req.method === 'DELETE');
            expect(request.request.params.get('role')).toEqual('role');
            request.flush('flush', { status: 400, statusText: error });
        });
        it('using the passed parameters', function() {
            service.deleteUserRole(user.username, 'role')
                .subscribe(() => {
                    expect(user.roles).toEqual([]);
                    expect(utilStub.createHttpParams).toHaveBeenCalledWith({ role: 'role' });
                }, () => fail('Promise should have resolved'));
            const request = httpMock.expectOne(req => req.url === service.userPrefix + '/' + user.username + '/roles' && req.method === 'DELETE');
            expect(request.request.params.get('role')).toEqual('role');
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
                    expect(utilStub.createHttpParams).toHaveBeenCalledWith({ group: group.title });
                });
            const request = httpMock.expectOne(req => req.url === service.userPrefix + '/' + user.username + '/groups' && req.method === 'PUT');
            expect(request.request.params.get('group')).toEqual(group.title);
            request.flush('flush', { status: 400, statusText: error });
        });
        it('using the passed parameters', function() {
            service.addUserGroup(user.username, group.title)
                .subscribe(() => {
                    expect(group.members).toContain(user.username);
                    expect(utilStub.createHttpParams).toHaveBeenCalledWith({ group: group.title });
                }, () => fail('Promise should have resolved'));
            const request = httpMock.expectOne(req => req.url === service.userPrefix + '/' + user.username + '/groups' && req.method === 'PUT');
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
                    expect(utilStub.createHttpParams).toHaveBeenCalledWith({ group: group.title });
                });
            const request = httpMock.expectOne(req => req.url === service.userPrefix + '/' + user.username + '/groups' && req.method === 'DELETE');
            expect(request.request.params.get('group')).toEqual(group.title);
            request.flush('flush', { status: 400, statusText: error });
        });
        it('using the passed parameters', function() {
            service.deleteUserGroup(user.username, group.title)
                .subscribe(() => {
                    expect(group.members).not.toContain(user.username);
                    expect(utilStub.createHttpParams).toHaveBeenCalledWith({ group: group.title });
                }, () => fail('Promise should have resolved'));
            const request = httpMock.expectOne(req => req.url === service.userPrefix + '/' + user.username + '/groups' && req.method === 'DELETE');
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
            const request = httpMock.expectOne({url: service.groupPrefix + '/' + group.title, method: 'GET'});
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
                const request = httpMock.expectOne({url: service.groupPrefix + '/' + group.title, method: 'GET'});
                request.flush(groupRdf);
            });
            it('the group has not been retrieved', function() {
                service.getGroup(group.title)
                    .subscribe(response => {
                        expect(response.iri).toEqual(group.iri);
                        expect(service.groups.length).toEqual(1);
                        expect(service.groups[0]).toEqual(group);
                    }, () => fail('Promise should have resolved'));
                const request = httpMock.expectOne({url: service.groupPrefix + '/' + group.title, method: 'GET'});
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
            const request = httpMock.expectOne({url: service.groupPrefix + '/' + group.title, method: 'PUT'});
            expect(request.request.body).toEqual(this.newGroup.jsonld);
            request.flush('flush', { status: 400, statusText: error });
        });
        it('successfully', function() {
            service.updateGroup(group.title, this.newGroup)
                .subscribe(() => {
                    expect(service.groups).toContain(this.newGroup);
                }, () => fail('Promise should have resolved'));
            const request = httpMock.expectOne({url: service.groupPrefix + '/' + group.title, method: 'PUT'});
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
            const request = httpMock.expectOne({url: service.groupPrefix + '/' + group.title, method: 'DELETE'});
            request.flush('flush', { status: 400, statusText: error });
    });
        it('with the passed title', function() {
            service.deleteGroup(group.title)
                .subscribe(() => {
                    expect(service.groups).not.toContain(group);
                }, () => fail('Promise should have resolved'));
            const request = httpMock.expectOne({url: service.groupPrefix + '/' + group.title, method: 'DELETE'});
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
                    expect(utilStub.createHttpParams).toHaveBeenCalledWith({ roles });
                });
            const request = httpMock.expectOne(req => req.url === service.groupPrefix + '/' + group.title + '/roles' && req.method === 'PUT');
            expect(request.request.params.getAll('roles')).toEqual(roles);
            request.flush('flush', { status: 400, statusText: error });
        });
        it('using the passed parameters', function() {
            const originalRoles = group.roles;
            service.addGroupRoles(group.title, roles)
                .subscribe(() => {
                    expect(group.roles).toEqual(originalRoles.concat(roles));
                    expect(utilStub.createHttpParams).toHaveBeenCalledWith({ roles });
                }, () => fail('Promise should have resolved'));
            const request = httpMock.expectOne(req => req.url === service.groupPrefix + '/' + group.title + '/roles' && req.method === 'PUT');
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
                    expect(utilStub.createHttpParams).toHaveBeenCalledWith({ role: 'role' });
                });
            const request = httpMock.expectOne(req => req.url === service.groupPrefix + '/' + group.title + '/roles' && req.method === 'DELETE');
            expect(request.request.params.get('role')).toEqual('role');
            request.flush('flush', { status: 400, statusText: error });
        });
        it('using the passed parameters', function() {
            service.deleteGroupRole(group.title, 'role')
                .subscribe(() => {
                    expect(group.roles).toEqual([]);
                    expect(utilStub.createHttpParams).toHaveBeenCalledWith({ role: 'role' });
                }, () => fail('Promise should have resolved'));
            const request = httpMock.expectOne(req => req.url === service.groupPrefix + '/' + group.title + '/roles' && req.method === 'DELETE');
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
            const request = httpMock.expectOne({url: service.groupPrefix + '/' + group.title + '/users', method: 'GET'});
            request.flush('flush', { status: 400, statusText: error });
        });
        it('successfully', function() {
            service.getGroupUsers(group.title)
                .subscribe(response => {
                    expect(response).toEqual([userRdf]);
                }, () => fail('Promise should have resolved'));
            const request = httpMock.expectOne({url: service.groupPrefix + '/' + group.title + '/users', method: 'GET'});
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
                    expect(utilStub.createHttpParams).toHaveBeenCalledWith({ users });
                });
            const request = httpMock.expectOne(req => req.url === service.groupPrefix + '/' + group.title + '/users' && req.method === 'PUT');
            expect(request.request.params.getAll('users')).toEqual(users);
            request.flush('flush', { status: 400, statusText: error });
        });
        it('successfully', function() {
            const originalMembers = group.members;
            service.addGroupUsers(group.title, users)
                .subscribe(() => {
                    expect(group.members).toEqual(originalMembers.concat(users));
                    expect(utilStub.createHttpParams).toHaveBeenCalledWith({ users });
                }, () => fail('Promise should have resolved'));
            const request = httpMock.expectOne(req => req.url === service.groupPrefix + '/' + group.title + '/users' && req.method === 'PUT');
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
                    expect(utilStub.createHttpParams).toHaveBeenCalledWith({ user: user.username });
                });
            const request = httpMock.expectOne(req => req.url === service.groupPrefix + '/' + group.title + '/users' && req.method === 'DELETE');
            expect(request.request.params.get('user')).toEqual(user.username);
            request.flush('flush', { status: 400, statusText: error });
        });
        it('successfully', function() {
            service.deleteGroupUser(group.title, user.username)
                .subscribe(() => {
                    expect(group.members).toEqual([]);
                    expect(utilStub.createHttpParams).toHaveBeenCalledWith({ user: user.username });
                }, () => fail('Promise should have resolved'));
            const request = httpMock.expectOne(req => req.url === service.groupPrefix + '/' + group.title + '/users' && req.method === 'DELETE');
            expect(request.request.params.get('user')).toEqual(user.username);
            request.flush(200);
        });
    });
    describe('should test whether a user is an admin', function() {
        it('based on user roles', function() {
            user.roles.push('admin');
            service.users = [user];
            expect(service.isAdmin(user.username)).toBeTrue();

            user.roles = [];
            expect(service.isAdmin(user.username)).toBeFalse();
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
    it('should determine whether a user is external', function() {
        expect(service.isExternalUser(userRdf)).toBeFalse();
        userRdf['@type'] = [USER + 'User', USER + 'ExternalUser'];
        expect(service.isExternalUser(userRdf)).toBeTrue();
        userRdf['@type'] = [USER + 'User'];
        expect(service.isExternalUser(userRdf)).toBeFalse();
        userRdf['@type'] = [USER + 'Group'];
        expect(service.isExternalUser(userRdf)).toBeFalse();
    });
    it('should determine whether a group is external', function() {
        expect(service.isExternalGroup(groupRdf)).toBeFalse();
        groupRdf['@type'] = [USER + 'Group', USER + 'ExternalGroup'];
        expect(service.isExternalGroup(groupRdf)).toBeTrue();
        groupRdf['@type'] = [USER + 'Group'];
        expect(service.isExternalGroup(groupRdf)).toBeFalse();
        groupRdf['@type'] = [USER + 'User'];
        expect(service.isExternalGroup(groupRdf)).toBeFalse();
    });
    describe('getUserDisplay should return the correct value', function() {
        it('when there is a first and last', function() {
            expect(service.getUserDisplay(user)).toEqual(user.firstName + ' ' + user.lastName);
        });
        it('when there is not a first or last but there is a username', function() {
            user.firstName = '';
            user.lastName = '';
            expect(service.getUserDisplay(user)).toEqual(user.username);
        });
        it('when there is not a first, last, or username', function() {
            user.username = '';
            user.firstName = '';
            user.lastName = '';
            expect(service.getUserDisplay(user)).toEqual('[Not Available]');
        });
    });
    it('should create a user object', function() {
        utilStub.getBeautifulIRI.and.callFake(x => x);
        utilStub.getPropertyId.and.returnValue('email');
        utilStub.getPropertyValue.and.callFake((obj, prop) => {
            if (prop === FOAF + 'firstName') {
                return 'first name';
            } else if (prop === FOAF + 'lastName') {
                return 'last name';
            } else if (prop === USER + 'username') {
                return 'username';
            } else {
                return '';
            }
        });
        spyOn(service, 'isExternalUser').and.returnValue(false);
        userRdf[USER + 'hasUserRole'] = [{'@id': 'role'}];
        const result = service.getUserObj(userRdf);
        expect(result.jsonld).toEqual(userRdf);
        expect(result.external).toEqual(false);
        expect(result.iri).toEqual(userRdf['@id']);
        expect(result.username).toEqual('username');
        expect(result.firstName).toEqual('first name');
        expect(result.lastName).toEqual('last name');
        expect(result.email).toEqual('email');
        expect(result.roles).toEqual(['role']);
    });
    it('should create a group object', function() {
        utilStub.getBeautifulIRI.and.callFake(x => x);
        utilStub.getDctermsValue.and.callFake((obj, prop) => {
            if (prop === 'title') {
                return 'title';
            } else if (prop === 'description') {
                return 'description';
            } else {
                return '';
            }
        });
        spyOn(service, 'isExternalGroup').and.returnValue(false);
        groupRdf[USER + 'hasGroupRole'] = [{'@id': 'role'}];
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
