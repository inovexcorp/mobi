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
import { TestBed } from '@angular/core/testing';
import { configureTestSuite } from 'ng-bullet';
import { MockProvider } from 'ng-mocks';
import { throwError } from 'rxjs';

import { ProgressSpinnerService } from '../components/progress-spinner/services/progressSpinner.service';
import { UtilService } from './util.service';
import { SETTING } from '../../prefixes';
import { JSONLDObject } from '../models/JSONLDObject.interface';
import { SettingManagerService } from './settingManager.service';

describe('Setting Manager service', function() {
    let service: SettingManagerService;
    let utilStub: jasmine.SpyObj<UtilService>;
    let httpMock: HttpTestingController;
    let progressSpinnerStub: jasmine.SpyObj<ProgressSpinnerService>;

    const error = 'error message';

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [ HttpClientTestingModule ],
            providers: [
                SettingManagerService,
                MockProvider(ProgressSpinnerService),
                MockProvider(UtilService),
            ]
        });
    });

    beforeEach(function() {
        service = TestBed.get(SettingManagerService);
        utilStub = TestBed.get(UtilService);
        httpMock = TestBed.get(HttpTestingController);
        progressSpinnerStub = TestBed.get(ProgressSpinnerService);

        utilStub.trackedRequest.and.callFake((ob) => ob);
        utilStub.handleError.and.callFake(error => {
            if (error.status === 0) {
                return throwError('');
            } else {
                return throwError(error.statusText || 'Something went wrong. Please try again later.');
            }
        });
        progressSpinnerStub.track.and.callFake((ob) => ob);

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
    });

    afterEach(function() {
        service = null;
        utilStub = null;
        httpMock = null;
        progressSpinnerStub = null;
    });

    describe('should retrieve a list of user preferences', function() {
        it('unless an error occurs', function() {
            service.getUserPreferences()
                .subscribe(() =>  fail('Observable should have rejected'), response => {
                    expect(response).toBe(error);
                });
            const request = httpMock.expectOne(req => req.url === service.prefix && req.method === 'GET');
            request.flush('flush', { status: 400, statusText: error });
        });
        it('successfully', function() {
            service.getUserPreferences()
                .subscribe((response: { [key: string]: JSONLDObject[] }) => {
                    expect(response).toEqual({'type': [{'@id': 'test'}]});
                }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne(req => req.url === service.prefix && req.method === 'GET');
            request.flush({'type': [{'@id': 'test'}]});
        });
    });
    describe('should get a preference by type', function() {
        it('unless an error occurs', function() {
            service.getUserPreferenceByType('https://mobi.com/ontologies/setting#TestPreferenceType')
                .subscribe(() => {
                    fail('Observable should have rejected');
                }, response => {
                    expect(response).toBe(error);
                });
            const request = httpMock.expectOne(req => req.url === ('/mobirest/settings/types/' + encodeURIComponent('https://mobi.com/ontologies/setting#TestPreferenceType')) && req.method === 'GET');
            request.flush('flush', { status: 400, statusText: error });

        });
        it('successfully', function() {
            service.getUserPreferenceByType('https://mobi.com/ontologies/setting#TestPreferenceType')
                .subscribe((response: JSONLDObject[]) => {
                    expect(response).toEqual([{'@id': 'test'}]);
                }, () => {
                    fail('Observable should have resolved');
                });
            const request = httpMock.expectOne(req => req.url === ('/mobirest/settings/types/' + encodeURIComponent('https://mobi.com/ontologies/setting#TestPreferenceType')) && req.method === 'GET');
            request.flush([{'@id': 'test'}]);
        });
    });
    describe('should update a preference', function() {
        beforeEach(function() {
            this.newRecord = {};
            this.url = '/mobirest/settings/' + '1234';
            this.preferenceConfig = {
                type: SETTING + 'Preference',
                subType: 'https://mobi.com/ontologies/setting#TestPreferenceType'
            };
        });
        it('unless an error occurs', function() {
            service.updateUserPreference('1234', 'https://mobi.com/ontologies/setting#TestPreferenceType', this.newRecord)
                .subscribe(() => fail('Observable should have rejected'),
                    response => expect(response).toEqual(error));
            const request = httpMock.expectOne(req => req.url === this.url && req.method === 'PUT');
            expect(utilStub.createHttpParams).toHaveBeenCalledWith(this.preferenceConfig);
            request.flush('flush', { status: 400, statusText: error });
        });
        it('successfully', function() {
            service.updateUserPreference('1234', 'https://mobi.com/ontologies/setting#TestPreferenceType', this.newRecord)
                .subscribe(response => expect(response).toEqual({}),
                        () => fail('Observable should have resolved'));
            const request = httpMock.expectOne(req => req.url === this.url && req.method === 'PUT');
            expect(utilStub.createHttpParams).toHaveBeenCalledWith(this.preferenceConfig);
            expect(request.request.params.get('subType')).toEqual('https://mobi.com/ontologies/setting#TestPreferenceType');
            expect(request.request.params.get('type')).toEqual(SETTING + 'Preference');
            request.flush({});
        });
    });
    describe('should create a preference', function() {
        beforeEach(function() {
            this.newRecord = {};
            this.url = '/mobirest/settings';
            this.preferenceConfig = {
                type: SETTING + 'Preference',
                subType: 'https://mobi.com/ontologies/setting#TestPreferenceType'
            };
        });
        it('unless an error occurs', function() {
            service.createUserPreference('https://mobi.com/ontologies/setting#TestPreferenceType', this.newRecord)
                .subscribe(() => fail('Observable should have rejected'),
                    response => expect(response).toEqual(error));
            const request = httpMock.expectOne(req => req.url === this.url && req.method === 'POST');
            expect(utilStub.createHttpParams).toHaveBeenCalledWith(this.preferenceConfig);
            expect(request.request.params.get('subType')).toEqual('https://mobi.com/ontologies/setting#TestPreferenceType');
            expect(request.request.params.get('type')).toEqual(SETTING + 'Preference');
            request.flush('flush', { status: 400, statusText: error });
        });
        it('successfully', function() {
            service.createUserPreference('https://mobi.com/ontologies/setting#TestPreferenceType', this.newRecord)
                .subscribe(response => expect(response).toEqual({}),
                        () => fail('Observable should have resolved'));
            const request = httpMock.expectOne(req => req.url === this.url && req.method === 'POST');
            expect(utilStub.createHttpParams).toHaveBeenCalledWith(this.preferenceConfig);
            request.flush({});
        });
    });
    describe('should retrieve a list preference groups', function() {
        it('unless an error occurs', function() {
            service.getPreferenceGroups()
                .subscribe(() => {
                    fail('Observable should have rejected');
                }, (response) => {
                    expect(response).toBe(error);
                });
            const request = httpMock.expectOne(req => req.url === service.prefix + '/groups' && req.method === 'GET');
            request.flush('flush', { status: 400, statusText: error });
        });
        it('successfully', function() {
            service.getPreferenceGroups()
                .subscribe(response => {
                    expect(response).toEqual([{'@id': 'test'}]);
                }, () => {
                    fail('Observable should have resolved');
                });
            const request = httpMock.expectOne(req => req.url === service.prefix + '/groups' && req.method === 'GET');
            request.flush([{'@id': 'test'}]);
        });
    });
    describe('should retrieve a list of preference definitions', function() {
        beforeEach(function() {
            this.testPrefGroup = 'https://mobi.com/ontologies/setting#TestPreferenceGroup';
        });
        it('unless an error occurs', function() {
            service.getPreferenceDefinitions(this.testPrefGroup)
                .subscribe(() => {
                    fail('Observable should have rejected');
                }, response => {
                    expect(response).toBe(error);
                });
            const request = httpMock.expectOne(req => req.url === (service.prefix + '/groups/' + encodeURIComponent(this.testPrefGroup) + '/definitions') && req.method === 'GET');
            request.flush('flush', { status: 400, statusText: error });
            
        });
        it('successfully', function() {
            service.getPreferenceDefinitions(this.testPrefGroup)
                .subscribe(response => {
                    expect(response).toEqual([{'@id': 'test'}]);
                }, () => {
                    fail('Observable should have resolved');
                });
            const request = httpMock.expectOne(req => req.url === (service.prefix + '/groups/' + encodeURIComponent(this.testPrefGroup) + '/definitions') && req.method === 'GET');
            request.flush([{'@id': 'test'}]);
        });
    });
    describe('should retrieve a list of application settings', function() {
        it('unless an error occurs', function() {
            service.getApplicationSettings()
                .subscribe(() => {
                    fail('Observable should have rejected');
                }, response => {
                    expect(response).toBe(error);
                });
            const request = httpMock.expectOne(req => req.url === service.prefix && req.method === 'GET');
            request.flush('flush', { status: 400, statusText: error });
            
        });
        it('successfully', function() {
            service.getApplicationSettings()
                .subscribe(response => {
                    expect(response).toEqual({'type': [{'@id': 'test'}]});
                }, () => {
                    fail('Observable should have resolved');
                });
            const request = httpMock.expectOne(req => req.url === service.prefix && req.method === 'GET');
            request.flush({'type': [{'@id': 'test'}]});
        });
    });
    describe('should get an application setting by type', function() {
        it('unless an error occurs', function() {
            service.getApplicationSettingByType('https://mobi.com/ontologies/setting#TestApplicationSettingType')
                .subscribe(() => {
                    fail('Observable should have rejected');
                }, response => {
                    expect(response).toBe(error);
                });
            const request = httpMock.expectOne(req => req.url === ('/mobirest/settings/types/' + encodeURIComponent('https://mobi.com/ontologies/setting#TestApplicationSettingType')) && req.method === 'GET'); 
            request.flush('flush', { status: 400, statusText: error });
            
        });
        it('successfully', function() {
            service.getApplicationSettingByType('https://mobi.com/ontologies/setting#TestApplicationSettingType')
                .subscribe(response => {
                    expect(response).toEqual([{'@id': 'test'}]);
                }, () => {
                    fail('Observable should have resolved');
                });
            const request = httpMock.expectOne(req => req.url === ('/mobirest/settings/types/' + encodeURIComponent('https://mobi.com/ontologies/setting#TestApplicationSettingType')) && req.method === 'GET'); 
            request.flush([{'@id': 'test'}]);
        });
    });
    describe('should update an application setting', function() {
        beforeEach(function() {
            this.newRecord = {};
            this.url = '/mobirest/settings/' + '1234';
            this.applicationSettingConfig = {
                type: SETTING + 'ApplicationSetting',
                subType: 'https://mobi.com/ontologies/setting#TestApplicationSettingType'
            };
        });
        it('unless an error occurs', function() {
            service.updateApplicationSetting('1234', 'https://mobi.com/ontologies/setting#TestApplicationSettingType', this.newRecord)
                .subscribe(() => fail('Observable should have rejected'),
                    response => expect(response).toEqual(error));
            const request = httpMock.expectOne(req => req.url === this.url && req.method === 'PUT');
            request.flush('flush', { status: 400, statusText: error });
        });
        it('successfully', function() {
            service.updateApplicationSetting('1234', 'https://mobi.com/ontologies/setting#TestApplicationSettingType', this.newRecord)
                .subscribe(response => expect(response).toEqual({}),
                        () => fail('Observable should have resolved'));
            const request = httpMock.expectOne(req => req.url === this.url && req.method === 'PUT');
            expect(request.request.params.get('subType')).toEqual('https://mobi.com/ontologies/setting#TestApplicationSettingType');
            expect(request.request.params.get('type')).toEqual(service.appSettingType.iri);
            request.flush({});
        });
    });
    describe('should create an application setting', function() {
        beforeEach(function() {
            this.newRecord = {};
            this.url = '/mobirest/settings';
            this.applicationSettingConfig = {
                type: SETTING + 'ApplicationSetting',
                subType: 'https://mobi.com/ontologies/setting#TestApplicationSettingType'
            };
        });
        it('unless an error occurs', function() {
            service.createApplicationSetting('https://mobi.com/ontologies/setting#TestApplicationSettingType', this.newRecord)
                .subscribe(() => fail('Observable should have rejected'),
                    response => expect(response).toEqual(error));
            const request = httpMock.expectOne(req => req.url === this.url && req.method === 'POST');
            request.flush('flush', { status: 400, statusText: error });
        });
        it('successfully', function() {
            service.createApplicationSetting('https://mobi.com/ontologies/setting#TestApplicationSettingType', this.newRecord)
                .subscribe(response => expect(response).toEqual({}),
                        () => fail('Observable should have resolved'));
            const request = httpMock.expectOne(req => req.url === this.url && req.method === 'POST');
            request.flush({});
        });
    });
    describe('should retrieve a list of application setting groups', function() {
        it('unless an error occurs', function() {
            service.getApplicationSettingGroups()
                .subscribe(() => {
                    fail('Observable should have rejected');
                }, response => {
                    expect(response).toBe(error);
                });
            const request = httpMock.expectOne(req => req.url === service.prefix + '/groups' && req.method === 'GET');
            request.flush('flush', { status: 400, statusText: error });
        });
        it('successfully', function() {
            service.getApplicationSettingGroups()
                .subscribe(response => {
                    expect(response).toEqual([{'@id': 'test'}]);
                }, () => {
                    fail('Observable should have resolved');
                });
            const request = httpMock.expectOne(req => req.url === service.prefix + '/groups' && req.method === 'GET');
            request.flush([{'@id': 'test'}]);
        });
    });
    describe('should retrieve a list of application setting definitions', function() {
        beforeEach(function() {
            this.testApplicationSettingGroup = 'https://mobi.com/ontologies/setting#TestApplicationSettingGroup';
        });
        it('unless an error occurs', function() {
            service.getApplicationSettingDefinitions(this.testApplicationSettingGroup)
                .subscribe(() => {
                    fail('Observable should have rejected');
                }, response => {
                    expect(response).toBe(error);
                });
            const request = httpMock.expectOne(req => req.url === (service.prefix + '/groups/' + encodeURIComponent(this.testApplicationSettingGroup) + '/definitions') && req.method === 'GET');
            request.flush('flush', { status: 400, statusText: error });
            
        });
        it('successfully', function() {
            service.getApplicationSettingDefinitions(this.testApplicationSettingGroup)
                .subscribe(response => {
                    expect(response).toEqual([{'@id': 'test'}]);
                }, () => {
                    fail('Observable should have resolved');
                });
            const request = httpMock.expectOne(req => req.url === (service.prefix + '/groups/' + encodeURIComponent(this.testApplicationSettingGroup) + '/definitions') && req.method === 'GET');
            request.flush([{'@id': 'test'}]);
        });
    });
});
