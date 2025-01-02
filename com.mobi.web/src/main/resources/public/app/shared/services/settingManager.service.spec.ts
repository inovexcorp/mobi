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
import { TestBed } from '@angular/core/testing';
import { MockProvider } from 'ng-mocks';

import { ProgressSpinnerService } from '../components/progress-spinner/services/progressSpinner.service';
import { ToastService } from './toast.service';
import { SETTING } from '../../prefixes';
import { JSONLDObject } from '../models/JSONLDObject.interface';
import { RESTError } from '../models/RESTError.interface';
import { SettingManagerService } from './settingManager.service';

describe('Setting Manager service', function() {
    let service: SettingManagerService;
    let httpMock: HttpTestingController;
    let progressSpinnerStub: jasmine.SpyObj<ProgressSpinnerService>;

    const error = 'error message';
    const errorObj: RESTError = { error: '', errorMessage: error, errorDetails: [] };
    const prefType = 'https://mobi.com/ontologies/setting#TestPreferenceType';
    const prefGroup = 'https://mobi.com/ontologies/setting#TestPreferenceGroup';
    const appSettingType = 'https://mobi.com/ontologies/setting#TestApplicationSettingType';
    const appSettingGroup = 'https://mobi.com/ontologies/setting#TestApplicationSettingGroup';

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ HttpClientTestingModule ],
            providers: [
                SettingManagerService,
                MockProvider(ProgressSpinnerService),
                MockProvider(ToastService),
            ]
        });

        service = TestBed.inject(SettingManagerService);
        httpMock = TestBed.inject(HttpTestingController) as jasmine.SpyObj<HttpTestingController>;
        progressSpinnerStub = TestBed.inject(ProgressSpinnerService) as jasmine.SpyObj<ProgressSpinnerService>;

        progressSpinnerStub.trackedRequest.and.callFake((ob) => ob);
    });

    afterEach(function() {
        service = null;
        httpMock = null;
        progressSpinnerStub = null;
    });

    describe('should retrieve a list of user preferences', function() {
        beforeEach(function() {
            this.url = service.prefix;
        });
        it('unless an error occurs', function() {
            service.getUserPreferences()
                .subscribe(() =>  fail('Observable should have rejected'), response => {
                    expect(response).toBe(error);
                });
            const request = httpMock.expectOne(req => req.url === this.url && req.method === 'GET');
            request.flush('flush', { status: 400, statusText: error });
        });
        it('successfully', function() {
            service.getUserPreferences()
                .subscribe((response: { [key: string]: JSONLDObject[] }) => {
                    expect(response).toEqual({'type': [{'@id': 'test'}]});
                }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne(req => req.url === this.url && req.method === 'GET');
            request.flush({'type': [{'@id': 'test'}]});
        });
    });
    describe('should get a preference by type', function() {
        beforeEach(function() {
            this.url = `${service.prefix}/types/${encodeURIComponent(prefType)}`;
        });
        it('unless an error occurs', function() {
            service.getUserPreferenceByType(prefType)
                .subscribe(() => {
                    fail('Observable should have rejected');
                }, response => {
                    expect(response).toBe(error);
                });
            const request = httpMock.expectOne(req => req.url === this.url && req.method === 'GET');
            request.flush('flush', { status: 400, statusText: error });

        });
        it('successfully', function() {
            service.getUserPreferenceByType(prefType)
                .subscribe((response: JSONLDObject[]) => {
                    expect(response).toEqual([{'@id': 'test'}]);
                }, () => {
                    fail('Observable should have resolved');
                });
            const request = httpMock.expectOne(req => req.url === this.url && req.method === 'GET');
            request.flush([{'@id': 'test'}]);
        });
    });
    describe('should update a preference', function() {
        beforeEach(function() {
            this.newRecord = {};
            this.url = `${service.prefix}/1234`;
        });
        it('unless an error occurs', function() {
            service.updateUserPreference('1234', prefType, this.newRecord)
                .subscribe(() => fail('Observable should have rejected'),
                    response => expect(response).toEqual(errorObj));
            const request = httpMock.expectOne(req => req.url === this.url && req.method === 'PUT');
            request.flush(errorObj, { status: 400, statusText: error });
        });
        it('successfully', function() {
            service.updateUserPreference('1234', prefType, this.newRecord)
                .subscribe(() => expect(true).toBeTrue(),
                    () => fail('Observable should have resolved'));
            const request = httpMock.expectOne(req => req.url === this.url && req.method === 'PUT');
            expect(request.request.params.get('subType')).toEqual(prefType);
            expect(request.request.params.get('type')).toEqual(`${SETTING}Preference`);
            request.flush(200);
        });
    });
    describe('should create a preference', function() {
        beforeEach(function() {
            this.newRecord = {};
            this.url = service.prefix;
        });
        it('unless an error occurs', function() {
            service.createUserPreference(prefType, this.newRecord)
                .subscribe(() => fail('Observable should have rejected'),
                    response => expect(response).toEqual(errorObj));
            const request = httpMock.expectOne(req => req.url === this.url && req.method === 'POST');
            expect(request.request.params.get('subType')).toEqual(prefType);
            expect(request.request.params.get('type')).toEqual(`${SETTING}Preference`);
            request.flush(errorObj, { status: 400, statusText: error });
        });
        it('successfully', function() {
            service.createUserPreference(prefType, this.newRecord)
                .subscribe(() => expect(true).toBeTrue(),
                    () => fail('Observable should have resolved'));
            const request = httpMock.expectOne(req => req.url === this.url && req.method === 'POST');
            request.flush('newId');
        });
    });
    describe('should retrieve a list preference groups', function() {
        beforeEach(function() {
            this.url = `${service.prefix}/groups`;
        });
        it('unless an error occurs', function() {
            service.getPreferenceGroups()
                .subscribe(() => {
                    fail('Observable should have rejected');
                }, (response) => {
                    expect(response).toBe(error);
                });
            const request = httpMock.expectOne(req => req.url === this.url && req.method === 'GET');
            request.flush('flush', { status: 400, statusText: error });
        });
        it('successfully', function() {
            service.getPreferenceGroups()
                .subscribe(response => {
                    expect(response).toEqual([{'@id': 'test'}]);
                }, () => {
                    fail('Observable should have resolved');
                });
            const request = httpMock.expectOne(req => req.url === this.url && req.method === 'GET');
            request.flush([{'@id': 'test'}]);
        });
    });
    describe('should retrieve a list of preference definitions', function() {
        beforeEach(function() {
            this.url = `${service.prefix}/groups/${encodeURIComponent(prefGroup)}/definitions`;
        });
        it('unless an error occurs', function() {
            service.getPreferenceDefinitions(prefGroup)
                .subscribe(() => {
                    fail('Observable should have rejected');
                }, response => {
                    expect(response).toBe(error);
                });
            const request = httpMock.expectOne(req => req.url === this.url && req.method === 'GET');
            request.flush('flush', { status: 400, statusText: error });
            
        });
        it('successfully', function() {
            service.getPreferenceDefinitions(prefGroup)
                .subscribe(response => {
                    expect(response).toEqual([{'@id': 'test'}]);
                }, () => {
                    fail('Observable should have resolved');
                });
            const request = httpMock.expectOne(req => req.url === this.url && req.method === 'GET');
            request.flush([{'@id': 'test'}]);
        });
    });
    describe('should retrieve a list of application settings', function() {
        beforeEach(function() {
            this.url = service.prefix;
        });
        it('unless an error occurs', function() {
            service.getApplicationSettings()
                .subscribe(() => {
                    fail('Observable should have rejected');
                }, response => {
                    expect(response).toBe(error);
                });
            const request = httpMock.expectOne(req => req.url === this.url && req.method === 'GET');
            request.flush('flush', { status: 400, statusText: error });
            
        });
        it('successfully', function() {
            service.getApplicationSettings()
                .subscribe(response => {
                    expect(response).toEqual({'type': [{'@id': 'test'}]});
                }, () => {
                    fail('Observable should have resolved');
                });
            const request = httpMock.expectOne(req => req.url === this.url && req.method === 'GET');
            request.flush({'type': [{'@id': 'test'}]});
        });
    });
    describe('should get an application setting by type', function() {
        beforeEach(function() {
            this.url = `${service.prefix}/types/${encodeURIComponent(appSettingType)}`;
        });
        it('unless an error occurs', function() {
            service.getApplicationSettingByType(appSettingType)
                .subscribe(() => {
                    fail('Observable should have rejected');
                }, response => {
                    expect(response).toBe(error);
                });
            const request = httpMock.expectOne(req => req.url === this.url && req.method === 'GET'); 
            request.flush('flush', { status: 400, statusText: error });
            
        });
        it('successfully', function() {
            service.getApplicationSettingByType(appSettingType)
                .subscribe(response => {
                    expect(response).toEqual([{'@id': 'test'}]);
                }, () => {
                    fail('Observable should have resolved');
                });
            const request = httpMock.expectOne(req => req.url === this.url && req.method === 'GET'); 
            request.flush([{'@id': 'test'}]);
        });
    });
    describe('should update an application setting', function() {
        beforeEach(function() {
            this.newRecord = {};
            this.url = `${service.prefix}/1234`;
        });
        it('unless an error occurs', function() {
            service.updateApplicationSetting('1234', appSettingType, this.newRecord)
                .subscribe(() => fail('Observable should have rejected'),
                    response => expect(response).toEqual(errorObj));
            const request = httpMock.expectOne(req => req.url === this.url && req.method === 'PUT');
            request.flush(errorObj, { status: 400, statusText: error });
        });
        it('successfully', function() {
            service.updateApplicationSetting('1234', appSettingType, this.newRecord)
                .subscribe(() => expect(true).toBeTrue(),
                        () => fail('Observable should have resolved'));
            const request = httpMock.expectOne(req => req.url === this.url && req.method === 'PUT');
            expect(request.request.params.get('subType')).toEqual(appSettingType);
            expect(request.request.params.get('type')).toEqual(service.appSettingType.iri);
            request.flush(200);
        });
    });
    describe('should create an application setting', function() {
        beforeEach(function() {
            this.newRecord = {};
            this.url = service.prefix;
        });
        it('unless an error occurs', function() {
            service.createApplicationSetting(appSettingType, this.newRecord)
                .subscribe(() => fail('Observable should have rejected'),
                    response => expect(response).toEqual(errorObj));
            const request = httpMock.expectOne(req => req.url === this.url && req.method === 'POST');
            request.flush(errorObj, { status: 400, statusText: error });
        });
        it('successfully', function() {
            service.createApplicationSetting(appSettingType, this.newRecord)
                .subscribe(() => expect(true).toBeTrue(),
                    () => fail('Observable should have resolved'));
            const request = httpMock.expectOne(req => req.url === this.url && req.method === 'POST');
            expect(request.request.params.get('subType')).toEqual(appSettingType);
            expect(request.request.params.get('type')).toEqual(service.appSettingType.iri);
            request.flush(200);
        });
    });
    describe('should retrieve a list of application setting groups', function() {
        beforeEach(function() {
            this.url = `${service.prefix}/groups`;
        });
        it('unless an error occurs', function() {
            service.getApplicationSettingGroups()
                .subscribe(() => {
                    fail('Observable should have rejected');
                }, response => {
                    expect(response).toBe(error);
                });
            const request = httpMock.expectOne(req => req.url === this.url && req.method === 'GET');
            request.flush('flush', { status: 400, statusText: error });
        });
        it('successfully', function() {
            service.getApplicationSettingGroups()
                .subscribe(response => {
                    expect(response).toEqual([{'@id': 'test'}]);
                }, () => {
                    fail('Observable should have resolved');
                });
            const request = httpMock.expectOne(req => req.url === this.url && req.method === 'GET');
            request.flush([{'@id': 'test'}]);
        });
    });
    describe('should retrieve a list of application setting definitions', function() {
        beforeEach(function() {
            this.url = `${service.prefix}/groups/${encodeURIComponent(appSettingGroup)}/definitions`;
        });
        it('unless an error occurs', function() {
            service.getApplicationSettingDefinitions(appSettingGroup)
                .subscribe(() => {
                    fail('Observable should have rejected');
                }, response => {
                    expect(response).toBe(error);
                });
            const request = httpMock.expectOne(req => req.url === this.url && req.method === 'GET');
            request.flush('flush', { status: 400, statusText: error });
            
        });
        it('successfully', function() {
            service.getApplicationSettingDefinitions(appSettingGroup)
                .subscribe(response => {
                    expect(response).toEqual([{'@id': 'test'}]);
                }, () => {
                    fail('Observable should have resolved');
                });
            const request = httpMock.expectOne(req => req.url === this.url && req.method === 'GET');
            request.flush([{'@id': 'test'}]);
        });
    });
});
