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
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { MockProvider } from 'ng-mocks';
import { of, throwError } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';

import { CatalogManagerService } from './catalogManager.service';
import { CatalogStateService } from './catalogState.service';
import { cleanStylesFromDOM } from '../../../test/ts/Shared';
import { DatasetManagerService } from './datasetManager.service';
import { DatasetStateService } from './datasetState.service';
import { DelimitedManagerService } from './delimitedManager.service';
import { DiscoverStateService } from './discoverState.service';
import { EntitySearchStateService } from '../../entity-search/services/entity-search-state.service';
import { FOAF, USER } from '../../prefixes';
import { MapperStateService } from './mapperState.service';
import { MergeRequestsStateService } from './mergeRequestsState.service';
import { OntologyManagerService } from './ontologyManager.service';
import { OntologyStateService } from './ontologyState.service';
import { ProgressSpinnerService } from '../components/progress-spinner/services/progressSpinner.service';
import { ProvManagerService } from './provManager.service';
import { ShapesGraphStateService } from './shapesGraphState.service';
import { StateManagerService } from './stateManager.service';
import { ToastService } from './toast.service';
import { User } from '../models/user.class';
import { UserManagerService } from './userManager.service';
import { UserStateService } from './userState.service';
import { YasguiService } from './yasgui.service';
import { LoginManagerService } from './loginManager.service';

describe('Login Manager service', function() {
    let service: LoginManagerService;
    let httpMock: HttpTestingController;
    let catalogManagerStub: jasmine.SpyObj<CatalogManagerService>;
    let catalogStateStub: jasmine.SpyObj<CatalogStateService>;
    let datasetManagerStub: jasmine.SpyObj<DatasetManagerService>;
    let datasetStateStub: jasmine.SpyObj<DatasetStateService>;
    let delimitedManagerStub: jasmine.SpyObj<DelimitedManagerService>;
    let discoverStateStub: jasmine.SpyObj<DiscoverStateService>;
    let entitySearchStateStub: jasmine.SpyObj<EntitySearchStateService>;
    let mapperStateStub: jasmine.SpyObj<MapperStateService>;
    let mergeRequestsStateStub: jasmine.SpyObj<MergeRequestsStateService>;
    let ontologyManagerStub: jasmine.SpyObj<OntologyManagerService>;
    let ontologyStateStub: jasmine.SpyObj<OntologyStateService>;
    let progressSpinnerStub: jasmine.SpyObj<ProgressSpinnerService>;
    let provManagerStub: jasmine.SpyObj<ProvManagerService>;
    let router: Router;
    let shapesGraphStateStub: jasmine.SpyObj<ShapesGraphStateService>;
    let stateManagerStub: jasmine.SpyObj<StateManagerService>;
    let toastServiceStub: jasmine.SpyObj<ToastService>;
    let userManagerStub: jasmine.SpyObj<UserManagerService>;
    let userStateStub: jasmine.SpyObj<UserStateService>;
    let yasguiStub: jasmine.SpyObj<YasguiService>;
    
    const error = 'Error Message';
    const user: User = new User({
        '@id': 'userIRI',
        '@type': [`${USER}User`],
        [`${USER}username`]: [{ '@value': 'user' }],
        [`${FOAF}firstName`]: [{ '@value': 'User' }],
        [`${FOAF}lastName`]: [{ '@value': 'User' }],
        [`${FOAF}mbox`]: [{ '@id': 'email@email.com' }],
    });

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ 
                HttpClientTestingModule, 
                RouterTestingModule.withRoutes([])
            ],
            providers: [
                LoginManagerService,
                MockProvider(MatDialog),
                MockProvider(CatalogManagerService),
                MockProvider(CatalogStateService),
                MockProvider(DatasetManagerService),
                MockProvider(DatasetStateService),
                MockProvider(DelimitedManagerService),
                MockProvider(DiscoverStateService),
                MockProvider(EntitySearchStateService),
                MockProvider(MapperStateService),
                MockProvider(MergeRequestsStateService),
                MockProvider(OntologyManagerService),
                MockProvider(OntologyStateService),
                MockProvider(ProgressSpinnerService),
                MockProvider(ProvManagerService),
                MockProvider(ShapesGraphStateService),
                MockProvider(StateManagerService),
                MockProvider(ToastService),
                MockProvider(UserManagerService),
                MockProvider(UserStateService),
                MockProvider(YasguiService)
            ]
        });

        catalogManagerStub = TestBed.inject(CatalogManagerService) as jasmine.SpyObj<CatalogManagerService>;
        catalogStateStub = TestBed.inject(CatalogStateService) as jasmine.SpyObj<CatalogStateService>;
        datasetManagerStub = TestBed.inject(DatasetManagerService) as jasmine.SpyObj<DatasetManagerService>;
        datasetStateStub = TestBed.inject(DatasetStateService) as jasmine.SpyObj<DatasetStateService>;
        delimitedManagerStub = TestBed.inject(DelimitedManagerService) as jasmine.SpyObj<DelimitedManagerService>;
        discoverStateStub = TestBed.inject(DiscoverStateService) as jasmine.SpyObj<DiscoverStateService>;
        entitySearchStateStub = TestBed.inject(EntitySearchStateService) as jasmine.SpyObj<EntitySearchStateService>;
        httpMock = TestBed.inject(HttpTestingController) as jasmine.SpyObj<HttpTestingController>;
        mapperStateStub = TestBed.inject(MapperStateService) as jasmine.SpyObj<MapperStateService>;
        mergeRequestsStateStub = TestBed.inject(MergeRequestsStateService) as jasmine.SpyObj<MergeRequestsStateService>;
        ontologyManagerStub = TestBed.inject(OntologyManagerService) as jasmine.SpyObj<OntologyManagerService>;
        ontologyStateStub = TestBed.inject(OntologyStateService) as jasmine.SpyObj<OntologyStateService>;
        progressSpinnerStub = TestBed.inject(ProgressSpinnerService) as jasmine.SpyObj<ProgressSpinnerService>;
        progressSpinnerStub.track.and.callFake((ob) => ob);
        provManagerStub = TestBed.inject(ProvManagerService) as jasmine.SpyObj<ProvManagerService>;
        router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
        spyOn(router, 'navigate');
        shapesGraphStateStub = TestBed.inject(ShapesGraphStateService) as jasmine.SpyObj<ShapesGraphStateService>;
        stateManagerStub = TestBed.inject(StateManagerService) as jasmine.SpyObj<StateManagerService>;
        toastServiceStub = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;
        userManagerStub = TestBed.inject(UserManagerService) as jasmine.SpyObj<UserManagerService>;
        userStateStub = TestBed.inject(UserStateService) as jasmine.SpyObj<UserStateService>;
        yasguiStub = TestBed.inject(YasguiService) as jasmine.SpyObj<YasguiService>;

        service = TestBed.inject(LoginManagerService);
    });
    afterEach(function() {
        Object.defineProperty(document, 'cookie', {
            value: '',
            writable: true
        });
        cleanStylesFromDOM();
        service = null;
        httpMock = null;
        router = null;
        progressSpinnerStub = null;
        catalogManagerStub = null;
        catalogStateStub = null;
        datasetManagerStub = null;
        datasetStateStub = null;
        delimitedManagerStub = null;
        discoverStateStub = null;
        mapperStateStub = null;
        mergeRequestsStateStub = null;
        ontologyManagerStub = null;
        ontologyStateStub = null;
        shapesGraphStateStub = null;
        stateManagerStub = null;
        userManagerStub = null;
        userStateStub = null;
        yasguiStub = null;
        provManagerStub = null;
        entitySearchStateStub = null;
    });

    describe('should log into an account', function() {
        let params;
        beforeEach(function() {
            params = {
                password: 'password',
                username: 'user'
            };
        });
        it('unless an error occurs', function() {
            service.login(params.username, params.password)
                .subscribe(() => fail('Observable should have rejected'), response => {
                    expect(response).toEqual('An error has occurred. Please try again later.');
                });

            const request = httpMock.expectOne(req => req.url === service.prefix && req.method === 'POST');
            request.flush('flush', { status: 400, statusText: error });
            expect(request.request.body.get('username')).toEqual(params.username);
            expect(request.request.body.get('password')).toEqual(params.password);
        });
        it('unless the credentials are wrong', function() {
            service.login(params.username, params.password)
                .subscribe(() => fail('Observable should have rejected'), response => {
                    expect(response).toEqual('This email/password combination is not correct.');
                });

            const request = httpMock.expectOne(req => req.url === service.prefix && req.method === 'POST');
            request.flush('flush', { status: 401, statusText: error });
            expect(request.request.body.get('username')).toEqual(params.username);
            expect(request.request.body.get('password')).toEqual(params.password);
        });
        it('unless the account is anonymous', function() {
            userManagerStub.getUser.and.returnValue(throwError(error));
            service.login(params.username, params.password)
                .subscribe(response => {
                    expect(response).toEqual(false);
                }, () => fail('Observable should have resolved'));

            const request = httpMock.expectOne(req => req.url === service.prefix && req.method === 'POST');
            request.flush('anon');
            expect(request.request.body.get('username')).toEqual(params.username);
            expect(request.request.body.get('password')).toEqual(params.password);
            expect(service.currentUser).toEqual('anon');
            expect(service.currentUserIRI).toBeFalsy();
        });
        it('successfully', fakeAsync(function() {
            userManagerStub.getUser.and.returnValue(of(user));
            service.login(params.username, params.password)
                .subscribe(response => {
                    expect(response).toEqual(true);
                }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne(req => req.url === service.prefix && req.method === 'POST' );
            request.flush('user');
            expect(request.request.body.get('username')).toEqual(params.username);
            expect(request.request.body.get('password')).toEqual(params.password);

            tick();
            expect(router.navigate).toHaveBeenCalledWith(['/home']);
            expect(service.currentUser).toBe(user.username);
            expect(service.currentUserIRI).toBe(user.iri);
        }));
    });
    it('should log a user out', function() {
        service.currentUserIRI = 'urn:userIri';
        service.currentUser = 'username';
        const sub = service.loginManagerAction$.subscribe((event) => {
            expect(event.eventType).toEqual('LOGOUT');
            expect(event.payload).toEqual({currentUserIRI: 'urn:userIri', currentUser: 'username'});
        }, () => fail('Observable should have resolved'));
        service.logout();

        const request = httpMock.expectOne(req => req.url === service.prefix && req.method === 'DELETE');
        request.flush(200);

        expect(datasetStateStub.reset).toHaveBeenCalledWith();
        expect(delimitedManagerStub.reset).toHaveBeenCalledWith();
        expect(discoverStateStub.reset).toHaveBeenCalledWith();
        expect(mapperStateStub.initialize).toHaveBeenCalledWith();
        expect(mapperStateStub.resetEdit).toHaveBeenCalledWith();
        expect(mergeRequestsStateStub.reset).toHaveBeenCalledWith();
        expect(ontologyStateStub.reset).toHaveBeenCalledWith();
        expect(shapesGraphStateStub.reset).toHaveBeenCalledWith();
        expect(userStateStub.reset).toHaveBeenCalledWith();
        expect(catalogStateStub.reset).toHaveBeenCalledWith();
        expect(yasguiStub.reset).toHaveBeenCalledWith();
        expect(provManagerStub.reset).toHaveBeenCalledWith();
        expect(entitySearchStateStub.reset).toHaveBeenCalledWith();
        expect(service.currentUser).toBe('');
        expect(service.currentUserIRI).toBe('');
        expect(router.navigate).toHaveBeenCalledWith(['/login']);
        expect(service.weGood).toBe(false);
        sub.unsubscribe();
    });
    describe('should get the current login', function() {
        it('unless an error occurs', function() {
            service.getCurrentLogin()
                .subscribe(() => fail('Observable should have rejected'), response => {
                    expect(response).toEqual(error);
                });

            const request = httpMock.expectOne(req => req.url === service.prefix && req.method === 'GET');
            request.flush('flush', { status: 400, statusText: error });
        });
        it('successfully', function() {
            service.getCurrentLogin()
                .subscribe(response => {
                    expect(response).toEqual(''); 
                }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne(req => req.url === service.prefix && req.method === 'GET');
            request.flush('');
        });
    });
    describe('should correctly test authentication', function() {
        beforeEach(function() {
            stateManagerStub.initialize.and.returnValue(of(null));
            userManagerStub.initialize.and.resolveTo();
            catalogManagerStub.initialize.and.returnValue(of(null));
            datasetManagerStub.initialize.and.returnValue(of(null));
        });
        it('unless an error happened', fakeAsync(function() {
            spyOn(service, 'getCurrentLogin').and.returnValue(throwError('user'));
            spyOn(service, 'checkMergedAccounts').and.returnValue(false);
            service.isAuthenticated()
                .subscribe(result => {
                    expect(result).toBeFalse();
                }, () => {
                    fail('Observable should have resolved');
                });
            tick();
            expect(service.currentUser).toBe('');
            expect(service.currentUserIRI).toBe('');
            expect(service.checkMergedAccounts).not.toHaveBeenCalled();
        }));
        it('unless no one is logged in', fakeAsync(function() {
            spyOn(service, 'getCurrentLogin').and.returnValue(of(undefined));
            spyOn(service, 'checkMergedAccounts').and.returnValue(false);
            service.isAuthenticated()
                .subscribe(result => {
                    expect(result).toBeFalse();
                }, () => {
                    fail('Observable should have resolved');
                });
            tick();
            expect(service.currentUser).toBe('');
            expect(service.currentUserIRI).toBe('');
            expect(service.checkMergedAccounts).not.toHaveBeenCalled();
        }));
        describe('if a user is logged in', function() {
            beforeEach(function() {
                spyOn(service, 'getCurrentLogin').and.returnValue(of('user'));
                spyOn(service, 'checkMergedAccounts').and.returnValue(false);
                userManagerStub.getUser.and.returnValue(of(user));
            });
            it('and this is the first time the method is called', fakeAsync(function() {
                service.weGood = false;
                service.isAuthenticated()
                    .subscribe(() => {
                        expect(true).toBeTrue();
                    }, () => {
                        fail('Observable should have resolved');
                    });
                tick();
                expect(service.currentUser).toBe('user');
                expect(service.currentUserIRI).toBe('userIRI');
                expect(catalogManagerStub.initialize).toHaveBeenCalledWith();
                expect(catalogStateStub.initialize).toHaveBeenCalledWith();
                expect(ontologyManagerStub.initialize).toHaveBeenCalledWith();
                expect(ontologyStateStub.initialize).toHaveBeenCalledWith();
                expect(mergeRequestsStateStub.initialize).toHaveBeenCalledWith();
                expect(shapesGraphStateStub.initialize).toHaveBeenCalledWith();
                expect(userManagerStub.initialize).toHaveBeenCalledWith();
                expect(userManagerStub.getUser).toHaveBeenCalledWith('user');
                expect(stateManagerStub.initialize).toHaveBeenCalledWith();
                expect(datasetManagerStub.initialize).toHaveBeenCalledWith();
                expect(provManagerStub.initialize).toHaveBeenCalledWith();
                expect(router.navigate).not.toHaveBeenCalled();
                expect(service.checkMergedAccounts).toHaveBeenCalledWith();
            }));
            it('and this is not the first time the method is called', fakeAsync(function() {
                service.weGood = true;
                service.isAuthenticated()
                    .subscribe(() => {
                        expect(true).toBeTrue();
                    }, () => {
                        fail('Observable should have resolved');
                    });
                tick();
                expect(service.currentUser).toBe('user');
                expect(service.currentUserIRI).toBe('userIRI');
                expect(catalogManagerStub.initialize).not.toHaveBeenCalled();
                expect(catalogStateStub.initialize).not.toHaveBeenCalled();
                expect(ontologyManagerStub.initialize).not.toHaveBeenCalled();
                expect(ontologyStateStub.initialize).not.toHaveBeenCalled();
                expect(mergeRequestsStateStub.initialize).not.toHaveBeenCalled();
                expect(userManagerStub.getUser).toHaveBeenCalledWith('user');
                expect(userManagerStub.initialize).toHaveBeenCalledWith();
                expect(stateManagerStub.initialize).toHaveBeenCalledWith();
                expect(datasetManagerStub.initialize).not.toHaveBeenCalled();
                expect(provManagerStub.initialize).not.toHaveBeenCalledWith();
                expect(router.navigate).not.toHaveBeenCalled();
                expect(service.checkMergedAccounts).toHaveBeenCalledWith();
            }));
        });
    });
    describe('validateSession', () => {
        it('should return false and redirect if no token is present', (done) => {
            spyOn(service, 'getCookie').and.returnValue(null);
            spyOn(service, 'clearServiceStates');
    
            service.validateSession(true).subscribe((result) => {
                expect(result).toBeFalse();
                expect(toastServiceStub.createErrorToast).toHaveBeenCalledWith(service.NO_TOKEN_MESSAGE);
                expect(service.clearServiceStates).toHaveBeenCalled();
                expect(router.navigate).toHaveBeenCalledWith(['/login']);
                done();
            });
        });
        it('should return false and redirect if no token is present and should not show toast', (done) => {
            spyOn(service, 'getCookie').and.returnValue(null);
            spyOn(service, 'clearServiceStates');
    
            service.validateSession(false).subscribe((result) => {
                expect(result).toBeFalse();
                expect(toastServiceStub.createErrorToast).not.toHaveBeenCalledWith(service.NO_TOKEN_MESSAGE);
                expect(service.clearServiceStates).toHaveBeenCalled();
                expect(router.navigate).toHaveBeenCalledWith(['/login']);
                done();
            });
        });
        it('should return false and redirect if token is expired', (done) => {
            const expiredTokenPayload = { exp: (Date.now() / 1000) - 3600 }; // Token that expired
            spyOn(service, 'getCookie').and.returnValue('expired_token');
            spyOn(service, 'decodeToken').and.returnValue(expiredTokenPayload);
            spyOn(service, 'clearServiceStates');
        
            service.validateSession(true).subscribe((result) => {
                expect(result).toBeFalse();
                expect(toastServiceStub.createErrorToast).toHaveBeenCalledWith(service.TOKEN_EXPIRED_MESSAGE);
                expect(service.clearServiceStates).toHaveBeenCalled();
                expect(router.navigate).toHaveBeenCalledWith(['/login']);
                done();
            });
        });
        it('should return false and redirect if token is expired and should not show toast', (done) => {
            const expiredTokenPayload = { exp: (Date.now() / 1000) - 3600 }; // Token that expired
            spyOn(service, 'getCookie').and.returnValue('expired_token');
            spyOn(service, 'decodeToken').and.returnValue(expiredTokenPayload);
            spyOn(service, 'clearServiceStates');
        
            service.validateSession(false).subscribe((result) => {
                expect(result).toBeFalse();
                expect(toastServiceStub.createErrorToast).not.toHaveBeenCalledWith(service.TOKEN_EXPIRED_MESSAGE);
                expect(service.clearServiceStates).toHaveBeenCalled();
                expect(router.navigate).toHaveBeenCalledWith(['/login']);
                done();
            });
        });
        it('should return false and redirect if session is invalid', (done) => {
            const validTokenPayload = { exp: (Date.now() / 1000) + 3600 }; // Token that expires
            spyOn(service, 'getCookie').and.returnValue('valid_token');
            spyOn(service, 'decodeToken').and.returnValue(validTokenPayload);
            spyOn(service, 'isAuthenticated').and.returnValue(of(false));
            spyOn(service, 'clearServiceStates');
    
            service.validateSession(true).subscribe((result) => {
                expect(result).toBeFalse();
                expect(toastServiceStub.createErrorToast).toHaveBeenCalledWith(service.SESSION_INVALID_MESSAGE);
                expect(service.clearServiceStates).toHaveBeenCalled();
                expect(router.navigate).toHaveBeenCalledWith(['/login']);
                done();
            });
        });
        it('should return false and redirect if session is invalid and should not show toast', (done) => {
            const validTokenPayload = { exp: (Date.now() / 1000) + 3600 }; // Token that expires
            spyOn(service, 'getCookie').and.returnValue('valid_token');
            spyOn(service, 'decodeToken').and.returnValue(validTokenPayload);
            spyOn(service, 'isAuthenticated').and.returnValue(of(false));
            spyOn(service, 'clearServiceStates');
    
            service.validateSession(false).subscribe((result) => {
                expect(result).toBeFalse();
                expect(toastServiceStub.createErrorToast).not.toHaveBeenCalledWith(service.SESSION_INVALID_MESSAGE);
                expect(service.clearServiceStates).toHaveBeenCalled();
                expect(router.navigate).toHaveBeenCalledWith(['/login']);
                done();
            });
        });

        it('should return true if the token is valid and session is authenticated', (done) => {
            const validTokenPayload = { exp: (Date.now() / 1000) + 3600 }; // Token that expires in 1 hour
            spyOn(service, 'getCookie').and.returnValue('valid_token');
            spyOn(service, 'decodeToken').and.returnValue(validTokenPayload);
            spyOn(service, 'isAuthenticated').and.returnValue(of(true));
            spyOn(service, 'clearServiceStates');
    
            service.validateSession(true).subscribe((result) => {
                expect(result).toBeTrue();
                expect(toastServiceStub.createErrorToast).not.toHaveBeenCalled();
                expect(service.clearServiceStates).not.toHaveBeenCalled();
                expect(router.navigate).not.toHaveBeenCalled();
                done();
            });
        });
        it('should return true if the token is valid and session is authenticated and should not show toast', (done) => {
            const validTokenPayload = { exp: (Date.now() / 1000) + 3600 }; // Token that expires in 1 hour
            spyOn(service, 'getCookie').and.returnValue('valid_token');
            spyOn(service, 'decodeToken').and.returnValue(validTokenPayload);
            spyOn(service, 'isAuthenticated').and.returnValue(of(true));
            spyOn(service, 'clearServiceStates');
    
            service.validateSession(false).subscribe((result) => {
                expect(result).toBeTrue();
                expect(toastServiceStub.createErrorToast).not.toHaveBeenCalled();
                expect(service.clearServiceStates).not.toHaveBeenCalled();
                expect(router.navigate).not.toHaveBeenCalled();
                done();
            });
        });
    });
    describe('getCookie', () => {
        it('should return the value of a cookie if it exists', () => {
            const mockCookie = 'mobi_web_token=example_value';
            Object.defineProperty(document, 'cookie', {
              value: mockCookie,
              writable: true
            });
    
            const result = service.getCookie('mobi_web_token');
            expect(result).toBe('example_value');
        });
        it('should return null if the cookie does not exist', () => {
            Object.defineProperty(document, 'cookie', {
                value: 'other_cookie=value',
                writable: true
            });
    
            const result = service.getCookie('mobi_web_token');
            expect(result).toBeNull();
        });
        it('should decode a URL-encoded cookie value', () => {
            const mockCookie = 'mobi_web_token=example%20value';
            Object.defineProperty(document, 'cookie', {
                value: mockCookie,
                writable: true
            });
    
            const result = service.getCookie('mobi_web_token');
            expect(result).toBe('example value');
        });
        it('should return null if document.cookie is empty', () => {
            Object.defineProperty(document, 'cookie', {
                value: '',
                writable: true
            });
    
            const result = service.getCookie('mobi_web_token');
            expect(result).toBeNull();
        });
    });
    describe('deleteCookie', () => {
        it('should delete a cookie by setting the cookie value with a negative Max-Age', () => {
            Object.defineProperty(document, 'cookie', {
                value: 'mobi_web_token=; path=/;',
                writable: true
            });
            expect(document.cookie).toEqual('mobi_web_token=; path=/;');
            service.deleteCookie('mobi_web_token');
            expect(document.cookie).toEqual('mobi_web_token=; Max-Age=-99999999; path=/;');
        });
        it('should delete another cookie by name', () => {
            Object.defineProperty(document, 'cookie', {
                value: '',
                writable: true
            });
            service.deleteCookie('another_cookie');
            expect(document.cookie).toEqual('another_cookie=; Max-Age=-99999999; path=/;');
        });
    });
    describe('decodeToken', () => {
        it('should correctly decode a valid JWT token', () => {
            const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
                          'eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.' +
                          'SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
            const expectedPayload = {
              sub: '1234567890',
              name: 'John Doe',
              iat: 1516239022
            };
            const decoded = service.decodeToken(token);
            expect(decoded).toEqual(expectedPayload);
          });
          it('should return null for an invalid token', () => {
            const invalidToken = 'invalid.token';
        
            const decoded = service.decodeToken(invalidToken);
            expect(decoded).toBeNull();
          });
          it('should return null when token is malformed or corrupted', () => {
            const malformedToken = 'eyJhbGciOiJIUzI1NiJ9.this_is_not_base64...';
        
            const decoded = service.decodeToken(malformedToken);
            expect(decoded).toBeNull();
          });
          it('should return null when atob throws an error', () => {
            spyOn(window, 'atob').and.throwError('InvalidCharacterError');
            const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
                          'eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.' +
                          'SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
            
            const decoded = service.decodeToken(token);
            expect(decoded).toBeNull();
          });
    });
});
