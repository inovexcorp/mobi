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
describe('Login Manager service', function() {
    var $httpBackend, loginManagerSvc, catalogManagerSvc, catalogStateSvc, ontologyManagerSvc, ontologyStateSvc, userManagerSvc, stateManagerSvc, state, timeout, $q, params, datasetManagerSvc;

    beforeEach(function() {
        module('loginManager');
        mockCatalogManager();
        mockCatalogState();
        mockUserManager();
        mockOntologyManager();
        mockOntologyState();
        mockStateManager();
        mockOntologyState();
        mockDatasetManager();
        injectRestPathConstant();

        module(function($provide) {
            $provide.service('$state', function() {
                this.go = jasmine.createSpy('go');
            });
        });

        inject(function(loginManagerService, _$httpBackend_, _$state_, _$timeout_, _$q_, _catalogManagerService_, _catalogStateService_, _ontologyManagerService_, _ontologyStateService_, _userManagerService_, _stateManagerService_, _datasetManagerService_) {
            loginManagerSvc = loginManagerService;
            catalogStateSvc = _catalogStateService_;
            catalogManagerSvc = _catalogManagerService_;
            ontologyManagerSvc = _ontologyManagerService_;
            ontologyStateSvc = _ontologyStateService_;
            userManagerSvc = _userManagerService_;
            stateManagerSvc = _stateManagerService_;
            $httpBackend = _$httpBackend_;
            state = _$state_;
            timeout = _$timeout_;
            $q = _$q_;
            datasetManagerSvc = _datasetManagerService_;
        });
    });

    describe('should log into an account', function() {
        beforeEach(function() {
            params = {
                password: 'password',
                username: 'user'
            };
        });
        it('unless the credentials are wrong', function(done) {
            $httpBackend.expectGET('/mobirest/user/login' + createQueryString(params)).respond(401, {});
            loginManagerSvc.login(params.username, params.password).then(function(response) {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toBe('This email/password combination is not correct.');
                done();
            });
            $httpBackend.flush();
        });
        it('unless an error occurs', function(done) {
            $httpBackend.expectGET('/mobirest/user/login' + createQueryString(params)).respond(400, {});
            loginManagerSvc.login(params.username, params.password).then(function(response) {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toBe('An error has occured. Please try again later.');
                done();
            });
            $httpBackend.flush();
        });
        it('unless something else went wrong', function(done) {
            $httpBackend.expectGET('/mobirest/user/login' + createQueryString(params)).respond(201, {});
            loginManagerSvc.login(params.username, params.password).then(function(response) {
                expect(response).not.toBe(true);
                expect(state.go).not.toHaveBeenCalled();
                expect(loginManagerSvc.currentUser).toBeFalsy();
                done();
            });
            $httpBackend.flush();
        });
        it('unless the account is anonymous', function(done) {
            $httpBackend.expectGET('/mobirest/user/login' + createQueryString(params)).respond(200, {scope: 'self anon'});
            loginManagerSvc.login(params.username, params.password).then(function(response) {
                expect(response).not.toBe(true);
                expect(state.go).not.toHaveBeenCalled();
                expect(loginManagerSvc.currentUser).toBeFalsy();
                done();
            });
            $httpBackend.flush();
        });
        it('if everything was passed correctly', function(done) {
            $httpBackend.expectGET('/mobirest/user/login' + createQueryString(params)).respond(200, {sub: params.username});
            loginManagerSvc.login(params.username, params.password).then(function(response) {
                expect(response).toBe(true);
                expect(state.go).toHaveBeenCalledWith('root.home');
                expect(loginManagerSvc.currentUser).toBe(params.username);
                done();
            });
            $httpBackend.flush();
        });
    });
    it('should log a user out', function() {
        $httpBackend.expectGET('/mobirest/user/logout').respond(200, {});
        loginManagerSvc.logout();
        $httpBackend.flush();
        expect(loginManagerSvc.currentUser).toBe('');
        expect(state.go).toHaveBeenCalledWith('login');
    });
    describe('should get the current login', function() {
        it('unless an error occurs', function(done) {
            $httpBackend.expectGET('/mobirest/user/current').respond(400, {});
            loginManagerSvc.getCurrentLogin().then(function(response) {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toEqual({});
                done();
            });
            $httpBackend.flush();
        });
        it('unless something else went wrong', function(done) {
            $httpBackend.expectGET('/mobirest/user/current').respond(201, {});
            loginManagerSvc.getCurrentLogin().then(function(response) {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toEqual({});
                done();
            });
            $httpBackend.flush();
        });
        it('successfully', function(done) {
            $httpBackend.expectGET('/mobirest/user/current').respond(200, {});
            loginManagerSvc.getCurrentLogin().then(function(response) {
                expect(response).toEqual({});
                done();
            });
            $httpBackend.flush();
        });
    });
    describe('should correctly test authentication', function() {
        it('unless an error happened', function(done) {
            spyOn(loginManagerSvc, 'getCurrentLogin').and.returnValue($q.reject({}));
            loginManagerSvc.isAuthenticated().then(function(response) {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(loginManagerSvc.currentUser).toBe('');
                expect(response).toEqual({});
                expect(state.go).toHaveBeenCalledWith('login');
                done();
            });
            timeout.flush();
        });
        it('unless no one is logged in', function(done) {
            spyOn(loginManagerSvc, 'getCurrentLogin').and.returnValue($q.resolve({scope: 'self anon'}));
            loginManagerSvc.isAuthenticated().then(function(response) {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(loginManagerSvc.currentUser).toBe('');
                expect(response).toEqual({scope: 'self anon'});
                expect(state.go).toHaveBeenCalledWith('login');
                done();
            });
            timeout.flush();
        });
        it('if a user is logged in', function(done) {
            spyOn(loginManagerSvc, 'getCurrentLogin').and.returnValue($q.resolve({sub: 'user'}));
            loginManagerSvc.isAuthenticated().then(function(response) {
                expect(loginManagerSvc.currentUser).toBe('user');
                expect(catalogManagerSvc.initialize).toHaveBeenCalled();
                expect(catalogStateSvc.initialize).toHaveBeenCalled();
                expect(ontologyManagerSvc.initialize).toHaveBeenCalled();
                expect(ontologyStateSvc.initialize).toHaveBeenCalled();
                expect(userManagerSvc.initialize).toHaveBeenCalled();
                expect(stateManagerSvc.initialize).toHaveBeenCalled();
                expect(datasetManagerSvc.initialize).toHaveBeenCalled();
                expect(state.go).not.toHaveBeenCalled();
                done();
            });
            timeout.flush();
        });
    });
});
