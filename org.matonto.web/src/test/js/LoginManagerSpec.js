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
    var loginManagerSvc, $httpBackend, state, scope, $q, analyticManagerSvc, analyticStateSvc, catalogManagerSvc, catalogStateSvc, datasetManagerSvc, datasetStateSvc, delimitedManagerSvc, discoverStateSvc, mapperStateSvc, ontologyManagerSvc, ontologyStateSvc, sparqlManagerSvc, stateManagerSvc, userManagerSvc, userStateSvc;

    beforeEach(function() {
        module('loginManager');
        mockAnalyticManager();
        mockAnalyticState();
        mockCatalogManager();
        mockCatalogState();
        mockDatasetManager();
        mockDatasetState();
        mockDelimitedManager();
        mockDiscoverState();
        mockMapperState();
        mockOntologyManager();
        mockOntologyState();
        mockSparqlManager();
        mockStateManager();
        mockUserManager();
        mockUserState();
        injectRestPathConstant();

        module(function($provide) {
            $provide.service('$state', function() {
                this.go = jasmine.createSpy('go');
            });
        });

        inject(function(loginManagerService, _$httpBackend_, _$state_, _$rootScope_, _$q_, _analyticManagerService_, _analyticStateService_, _catalogManagerService_, _catalogStateService_, _datasetManagerService_, _datasetStateService_, _delimitedManagerService_, _discoverStateService_, _mapperStateService_, _ontologyManagerService_, _ontologyStateService_, _sparqlManagerService_, _stateManagerService_, _userManagerService_, _userStateService_) {
            loginManagerSvc = loginManagerService;
            $httpBackend = _$httpBackend_;
            state = _$state_;
            scope = _$rootScope_;
            $q = _$q_;
            analyticManagerSvc = _analyticManagerService_;
            analyticStateSvc = _analyticStateService_;
            catalogManagerSvc = _catalogManagerService_;
            catalogStateSvc = _catalogStateService_;
            datasetManagerSvc = _datasetManagerService_;
            datasetStateSvc = _datasetStateService_;
            delimitedManagerSvc = _delimitedManagerService_;
            discoverStateSvc = _discoverStateService_;
            mapperStateSvc = _mapperStateService_;
            ontologyManagerSvc = _ontologyManagerService_;
            ontologyStateSvc = _ontologyStateService_;
            sparqlManagerSvc = _sparqlManagerService_;
            stateManagerSvc = _stateManagerService_;
            userManagerSvc = _userManagerService_;
            userStateSvc = _userStateService_;
        });
    });

    describe('should log into an account', function() {
        beforeEach(function() {
            this.params = {
                password: 'password',
                username: 'user'
            };
        });
        it('unless the credentials are wrong', function() {
            $httpBackend.expectGET('/mobirest/user/login' + createQueryString(this.params)).respond(401, {});
            loginManagerSvc.login(this.params.username, this.params.password).then(function(response) {
                fail('Promise should have rejected');
            }, function(response) {
                expect(response).toBe('This email/password combination is not correct.');
            });
            flushAndVerify($httpBackend);
        });
        it('unless an error occurs', function() {
            $httpBackend.expectGET('/mobirest/user/login' + createQueryString(this.params)).respond(400, {});
            loginManagerSvc.login(this.params.username, this.params.password).then(function(response) {
                fail('Promise should have rejected');
            }, function(response) {
                expect(response).toBe('An error has occured. Please try again later.');
            });
            flushAndVerify($httpBackend);
        });
        it('unless something else went wrong', function() {
            $httpBackend.expectGET('/mobirest/user/login' + createQueryString(this.params)).respond(201, {});
            loginManagerSvc.login(this.params.username, this.params.password).then(function(response) {
                expect(response).not.toBe(true);
                expect(state.go).not.toHaveBeenCalled();
                expect(loginManagerSvc.currentUser).toBeFalsy();
            });
            flushAndVerify($httpBackend);
        });
        it('unless the account is anonymous', function() {
            $httpBackend.expectGET('/mobirest/user/login' + createQueryString(this.params)).respond(200, {scope: 'self anon'});
            loginManagerSvc.login(this.params.username, this.params.password).then(function(response) {
                expect(response).not.toBe(true);
                expect(state.go).not.toHaveBeenCalled();
                expect(loginManagerSvc.currentUser).toBeFalsy();
            });
            flushAndVerify($httpBackend);
        });
        it('if everything was passed correctly', function() {
            var params = this.params;
            $httpBackend.expectGET('/mobirest/user/login' + createQueryString(params)).respond(200, {sub: params.username});
            loginManagerSvc.login(params.username, params.password).then(function(response) {
                expect(response).toBe(true);
                expect(state.go).toHaveBeenCalledWith('root.home');
                expect(loginManagerSvc.currentUser).toBe(params.username);
            });
            flushAndVerify($httpBackend);
        });
    });
    it('should log a user out', function() {
        $httpBackend.expectGET('/mobirest/user/logout').respond(200, {});
        loginManagerSvc.logout();
        flushAndVerify($httpBackend);
        expect(analyticStateSvc.reset).toHaveBeenCalled();
        expect(catalogStateSvc.reset).toHaveBeenCalled();
        expect(datasetStateSvc.reset).toHaveBeenCalled();
        expect(delimitedManagerSvc.reset).toHaveBeenCalled();
        expect(discoverStateSvc.reset).toHaveBeenCalled();
        expect(mapperStateSvc.initialize).toHaveBeenCalled();
        expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
        expect(ontologyManagerSvc.reset).toHaveBeenCalled();
        expect(ontologyStateSvc.reset).toHaveBeenCalled();
        expect(sparqlManagerSvc.reset).toHaveBeenCalled();
        expect(userStateSvc.reset).toHaveBeenCalled();
        expect(loginManagerSvc.currentUser).toBe('');
        expect(state.go).toHaveBeenCalledWith('login');
    });
    describe('should get the current login', function() {
        it('unless an error occurs', function() {
            $httpBackend.expectGET('/mobirest/user/current').respond(400, {});
            loginManagerSvc.getCurrentLogin().then(function(response) {
                fail('Promise should have rejected');
            }, function(response) {
                expect(response).toEqual({});
            });
            flushAndVerify($httpBackend);
        });
        it('unless something else went wrong', function() {
            $httpBackend.expectGET('/mobirest/user/current').respond(201, {});
            loginManagerSvc.getCurrentLogin().then(function(response) {
                fail('Promise should have rejected');
            }, function(response) {
                expect(response).toEqual({});
            });
            flushAndVerify($httpBackend);
        });
        it('successfully', function() {
            $httpBackend.expectGET('/mobirest/user/current').respond(200, {});
            loginManagerSvc.getCurrentLogin().then(function(response) {
                expect(response).toEqual({});
            });
            flushAndVerify($httpBackend);
        });
    });
    describe('should correctly test authentication', function() {
        it('unless an error happened', function() {
            spyOn(loginManagerSvc, 'getCurrentLogin').and.returnValue($q.reject({}));
            loginManagerSvc.isAuthenticated().then(function(response) {
                fail('Promise should have rejected');
            }, function(response) {
                expect(loginManagerSvc.currentUser).toBe('');
                expect(response).toEqual({});
                expect(state.go).toHaveBeenCalledWith('login');
            });
            scope.$apply();
        });
        it('unless no one is logged in', function() {
            spyOn(loginManagerSvc, 'getCurrentLogin').and.returnValue($q.resolve({scope: 'self anon'}));
            loginManagerSvc.isAuthenticated().then(function(response) {
                fail('Promise should have rejected');
            }, function(response) {
                expect(loginManagerSvc.currentUser).toBe('');
                expect(response).toEqual({scope: 'self anon'});
                expect(state.go).toHaveBeenCalledWith('login');
            });
            scope.$apply();
        });
        it('if a user is logged in', function() {
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
            });
            scope.$apply();
        });
    });
});
