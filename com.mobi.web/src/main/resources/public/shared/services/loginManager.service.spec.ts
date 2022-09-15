/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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
import { HttpParams } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { noop } from 'lodash';
import { configureTestSuite } from 'ng-bullet';
import { MockProvider } from 'ng-mocks';
import { of, throwError } from 'rxjs';

import { cleanStylesFromDOM } from '../../../../../test/ts/Shared';
import { ProgressSpinnerService } from '../components/progress-spinner/services/progressSpinner.service';
import { User } from '../models/user.interface';
import { CatalogManagerService } from './catalogManager.service';
import { CatalogStateService } from './catalogState.service';
import { DatasetManagerService } from './datasetManager.service';
import { DatasetStateService } from './datasetState.service';
import { DelimitedManagerService } from './delimitedManager.service';
import { DiscoverStateService } from './discoverState.service';
import { LoginManagerService } from './loginManager.service';
import { MapperStateService } from './mapperState.service';
import { MergeRequestsStateService } from './mergeRequestsState.service';
import { OntologyManagerService } from './ontologyManager.service';
import { OntologyStateService } from './ontologyState.service';
import { ShapesGraphStateService } from './shapesGraphState.service';
import { StateManagerService } from './stateManager.service';
import { UserManagerService } from './userManager.service';
import { UserStateService } from './userState.service';
import { UtilService } from './util.service';
import { YasguiService } from './yasgui.service';

describe('Login Manager service', function() {
    let service: LoginManagerService;
    let httpMock: HttpTestingController;
    let router: Router;
    let progressSpinnerStub: jasmine.SpyObj<ProgressSpinnerService>;
    let catalogManagerStub: jasmine.SpyObj<CatalogManagerService>;
    let catalogStateStub: jasmine.SpyObj<CatalogStateService>;
    let datasetManagerStub: jasmine.SpyObj<DatasetManagerService>;
    let datasetStateStub: jasmine.SpyObj<DatasetStateService>;
    let delimitedManagerStub: jasmine.SpyObj<DelimitedManagerService>;
    let discoverStateStub: jasmine.SpyObj<DiscoverStateService>;
    let mapperStateStub: jasmine.SpyObj<MapperStateService>;
    let mergeRequestsStateStub: jasmine.SpyObj<MergeRequestsStateService>;
    let ontologyManagerStub: jasmine.SpyObj<OntologyManagerService>;
    let ontologyStateStub: jasmine.SpyObj<OntologyStateService>;
    let shapesGraphStateStub: jasmine.SpyObj<ShapesGraphStateService>;
    let stateManagerStub: jasmine.SpyObj<StateManagerService>;
    let userManagerStub: jasmine.SpyObj<UserManagerService>;
    let userStateStub: jasmine.SpyObj<UserStateService>;
    let utilStub: jasmine.SpyObj<UtilService>;
    let yasguiStub: jasmine.SpyObj<YasguiService>;

    const error = 'Error Message';
    const user: User = {
        iri: 'userIRI',
        username: 'user',
        external: false,
        firstName: 'User',
        lastName: 'User',
        email: 'email@email.com',
        roles: []
    };

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [ HttpClientTestingModule, RouterTestingModule.withRoutes([]) ],
            providers: [
                LoginManagerService,
                MockProvider(ProgressSpinnerService),
                MockProvider(CatalogManagerService),
                MockProvider(CatalogStateService),
                MockProvider(DatasetManagerService),
                MockProvider(DatasetStateService),
                MockProvider(DelimitedManagerService),
                MockProvider(DiscoverStateService),
                MockProvider(MapperStateService),
                MockProvider(MergeRequestsStateService),
                MockProvider(OntologyManagerService),
                MockProvider(OntologyStateService),
                MockProvider(ShapesGraphStateService),
                MockProvider(StateManagerService),
                MockProvider(UserManagerService),
                MockProvider(UserStateService),
                MockProvider(UtilService),
                MockProvider(YasguiService)
            ]
        });
    });

    beforeEach(function() {
        service = TestBed.get(LoginManagerService);
        router = TestBed.get(Router);
        spyOn(router, 'navigate');
        progressSpinnerStub = TestBed.get(ProgressSpinnerService);
        httpMock = TestBed.get(HttpTestingController);
        catalogManagerStub = TestBed.get(CatalogManagerService);
        catalogStateStub = TestBed.get(CatalogStateService);
        datasetManagerStub = TestBed.get(DatasetManagerService);
        datasetStateStub = TestBed.get(DatasetStateService);
        delimitedManagerStub = TestBed.get(DelimitedManagerService);
        discoverStateStub = TestBed.get(DiscoverStateService);
        mapperStateStub = TestBed.get(MapperStateService);
        mergeRequestsStateStub = TestBed.get(MergeRequestsStateService);
        ontologyManagerStub = TestBed.get(OntologyManagerService);
        ontologyStateStub = TestBed.get(OntologyStateService);
        shapesGraphStateStub = TestBed.get(ShapesGraphStateService);
        stateManagerStub = TestBed.get(StateManagerService);
        userManagerStub = TestBed.get(UserManagerService);
        userStateStub = TestBed.get(UserStateService);
        utilStub = TestBed.get(UtilService);
        yasguiStub = TestBed.get(YasguiService);

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
        progressSpinnerStub.track.and.callFake((ob) => ob);
    });

    afterEach(function() {
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
        utilStub = null;
        yasguiStub = null;
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
            expect(request.request.params.get('username')).toEqual(params.username);
            expect(request.request.params.get('password')).toEqual(params.password);
        });
        it('unless the credentials are wrong', function() {
            service.login(params.username, params.password)
                .subscribe(() => fail('Observable should have rejected'), response => {
                    expect(response).toEqual('This email/password combination is not correct.');
                });

            const request = httpMock.expectOne(req => req.url === service.prefix && req.method === 'POST');
            request.flush('flush', { status: 401, statusText: error });
            expect(request.request.params.get('username')).toEqual(params.username);
            expect(request.request.params.get('password')).toEqual(params.password);
        });
        it('unless the account is anonymous', function() {
            userManagerStub.getUser.and.rejectWith(error);
            service.login(params.username, params.password)
                .subscribe(response => {
                    expect(response).toEqual(false);
                }, () => fail('Observable should have resolved'));

            const request = httpMock.expectOne(req => req.url === service.prefix && req.method === 'POST');
            request.flush('anon');
            expect(request.request.params.get('username')).toEqual(params.username);
            expect(request.request.params.get('password')).toEqual(params.password);
            expect(service.currentUser).toEqual('anon');
            expect(service.currentUserIRI).toBeFalsy();
        });
        it('successfully', fakeAsync(function() {
            userManagerStub.getUser.and.resolveTo(user);
            service.login(params.username, params.password)
                .subscribe(response => {
                    expect(response).toEqual(true);
                }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne(req => req.url === service.prefix && req.method === 'POST' );
            request.flush('user');
            expect(request.request.params.get('username')).toEqual(params.username);
            expect(request.request.params.get('password')).toEqual(params.password);

            tick();
            expect(router.navigate).toHaveBeenCalledWith(['/home']);
            expect(service.currentUser).toBe(user.username);
            expect(service.currentUserIRI).toBe(user.iri);
        }));
    });
    it('should log a user out', function() {
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
        expect(service.currentUser).toBe('');
        expect(service.currentUserIRI).toBe('');
        expect(router.navigate).toHaveBeenCalledWith(['/login']);
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
                userManagerStub.getUser.and.resolveTo(user);
            });
            it('and this is the first time the method is called', fakeAsync(function() {
                service.isAuthenticated()
                    .subscribe(noop, () => {
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
                expect(router.navigate).not.toHaveBeenCalled();
                expect(service.checkMergedAccounts).toHaveBeenCalledWith();
            }));
            it('and this is not the first time the method is called', fakeAsync(function() {
                service.weGood = true;
                service.isAuthenticated()
                    .subscribe(noop, () => {
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
                expect(router.navigate).not.toHaveBeenCalled();
                expect(service.checkMergedAccounts).toHaveBeenCalledWith();
            }));
        });
    });
});
