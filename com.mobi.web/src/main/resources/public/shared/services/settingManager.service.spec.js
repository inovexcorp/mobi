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
import {
    mockUtil,
    mockPrefixes,
    injectRestPathConstant,
    flushAndVerify
} from '../../../../../test/js/Shared';

describe('Setting Manager service', function() {
    var settingManagerSvc, $q, $httpBackend, $httpParamSerializer, utilSvc, prefixes;

    beforeEach(function() {
        angular.mock.module('shared');
        mockUtil();
        mockPrefixes();
        injectRestPathConstant();

        inject(function(settingManagerService, _$q_, _$httpBackend_, _$httpParamSerializer_, _utilService_, _prefixes_) {
            settingManagerSvc = settingManagerService;
            $q = _$q_;
            $httpBackend = _$httpBackend_;
            $httpParamSerializer = _$httpParamSerializer_;
            utilSvc = _utilService_;
            prefixes = _prefixes_;
        });

        utilSvc.rejectError.and.returnValue($q.reject('Error Message'));
        this.policy = {PolicyId: 'id'};
        this.preferenceConfig = {
            type: prefixes.setting + 'Preference'
        };
        this.applicationSettingConfig = {
            type: prefixes.setting + 'ApplicationSetting'
        }
        this.baseParams = $httpParamSerializer(this.preferenceConfig);
        this.applicationSettingParams = $httpParamSerializer(this.applicationSettingConfig);
    });

    afterEach(function() {
        settingManagerSvc = null;
        $q = null;
        $httpBackend = null;
        $httpParamSerializer = null;
        utilSvc = null;
        prefixes = null;
    });

    describe('should retrieve a list of user preferences', function() {
        it('unless an error occurs', function() {
            $httpBackend.whenGET('/mobirest/settings?' + this.baseParams).respond(400, null, null, 'Error Message');
            settingManagerSvc.getUserPreferences()
                .then(function(value) {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toBe('Error Message');
                });
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({
                status: 400,
                statusText: 'Error Message'
            }));
        });
        it('successfully', function() {
            $httpBackend.whenGET('/mobirest/settings?' + this.baseParams).respond(200, {});
            settingManagerSvc.getUserPreferences()
                .then(function(response) {
                    expect(response.data).toEqual({});
                }, function() {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
    });
    describe('should get a preference by type', function() {
        it('unless an error occurs', function() {
            $httpBackend.whenGET('/mobirest/settings/types/' + encodeURIComponent('https://mobi.com/ontologies/setting#TestPreferenceType') + '?' + this.baseParams).respond(400, null, null, 'Error Message');
            settingManagerSvc.getUserPreferenceByType('https://mobi.com/ontologies/setting#TestPreferenceType')
                .then(function(value) {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toBe('Error Message');
                });
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({
                status: 400,
                statusText: 'Error Message'
            }));
        });
        it('successfully', function() {
            $httpBackend.whenGET('/mobirest/settings/types/' + encodeURIComponent('https://mobi.com/ontologies/setting#TestPreferenceType') + '?' + this.baseParams).respond(200, {});
            settingManagerSvc.getUserPreferenceByType('https://mobi.com/ontologies/setting#TestPreferenceType')
                .then(function(response) {
                    expect(response.data).toEqual({});
                }, function() {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
    });
    describe('should update a preference', function() {
        beforeEach(function() {
            this.newRecord = {};
            this.url = '/mobirest/settings/' + '1234';
            this.preferenceConfig = {
                type: prefixes.setting + 'Preference',
                subType: 'https://mobi.com/ontologies/setting#TestPreferenceType'
            };
        });
        it('unless an error occurs', function() {
            var params = $httpParamSerializer(this.preferenceConfig);
            $httpBackend.expectPUT(this.url + '?' + params, this.newRecord).respond(400, null, null, 'Error Message');
            settingManagerSvc.updateUserPreference('1234', 'https://mobi.com/ontologies/setting#TestPreferenceType', this.newRecord).then(() => fail('Promise should have rejected'),
                    response => expect(response).toEqual('Error Message'));
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: 'Error Message'}));
        });
        it('successfully', function() {
            var params = $httpParamSerializer(this.preferenceConfig);
            $httpBackend.expectPUT(this.url + '?' + params, this.newRecord).respond(200, {});
            var self = this;
            settingManagerSvc.updateUserPreference('1234', 'https://mobi.com/ontologies/setting#TestPreferenceType', this.newRecord)
                .then(response => expect(response.data).toEqual({}), response => fail('Promise should have resolved'));
            flushAndVerify($httpBackend);
        });
    });
    describe('should create a preference', function() {
        beforeEach(function() {
            this.newRecord = {};
            this.url = '/mobirest/settings';
            this.preferenceConfig = {
                type: prefixes.setting + 'Preference',
                subType: 'https://mobi.com/ontologies/setting#TestPreferenceType'
            };
        });
        it('unless an error occurs', function() {
            var params = $httpParamSerializer(this.preferenceConfig);
            $httpBackend.expectPOST(this.url + '?' + params, this.newRecord).respond(400, null, null, 'Error Message');
            settingManagerSvc.createUserPreference('https://mobi.com/ontologies/setting#TestPreferenceType', this.newRecord).then(() => fail('Promise should have rejected'),
                    response => expect(response).toEqual('Error Message'));
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: 'Error Message'}));
        });
        it('successfully', function() {
            var params = $httpParamSerializer(this.preferenceConfig);
            $httpBackend.expectPOST(this.url + '?' + params, this.newRecord).respond(200, {});
            settingManagerSvc.createUserPreference('https://mobi.com/ontologies/setting#TestPreferenceType', this.newRecord)
                .then(response => expect(response.data).toEqual({}), response => fail('Promise should have resolved'));
            flushAndVerify($httpBackend);
        });
    });
    describe('should retrieve a list preference groups', function() {
        it('unless an error occurs', function() {
            $httpBackend.whenGET('/mobirest/settings/groups?' + this.baseParams).respond(400, null, null, 'Error Message');
            settingManagerSvc.getPreferenceGroups()
                .then(function(value) {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toBe('Error Message');
                });
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({
                status: 400,
                statusText: 'Error Message'
            }));
        });
        it('successfully', function() {
            $httpBackend.whenGET('/mobirest/settings/groups?' + this.baseParams).respond(200, {});
            settingManagerSvc.getPreferenceGroups()
                .then(function(response) {
                    expect(response.data).toEqual({});
                }, function() {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
    });
    describe('should retrieve a list of preference definitions', function() {
        beforeEach(function() {
            this.testPrefGroup = 'https://mobi.com/ontologies/setting#TestPreferenceGroup';
        });
        it('unless an error occurs', function() {
            $httpBackend.whenGET('/mobirest/settings/groups/' + encodeURIComponent(this.testPrefGroup) + '/definitions?' + this.baseParams).respond(400, null, null, 'Error Message');
            settingManagerSvc.getPreferenceDefinitions(this.testPrefGroup)
                .then(function(value) {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toBe('Error Message');
                });
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({
                status: 400,
                statusText: 'Error Message'
            }));
        });
        it('successfully', function() {
            $httpBackend.whenGET('/mobirest/settings/groups/' + encodeURIComponent(this.testPrefGroup) + '/definitions?' + this.baseParams).respond(200, {});
            settingManagerSvc.getPreferenceDefinitions(this.testPrefGroup)
                .then(function(response) {
                    expect(response.data).toEqual({});
                }, function() {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
    });
    describe('should retrieve a list of application settings', function() {
        it('unless an error occurs', function() {
            $httpBackend.whenGET('/mobirest/settings?' + this.applicationSettingParams).respond(400, null, null, 'Error Message');
            settingManagerSvc.getApplicationSettings()
                .then(function(value) {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toBe('Error Message');
                });
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({
                status: 400,
                statusText: 'Error Message'
            }));
        });
        it('successfully', function() {
            $httpBackend.whenGET('/mobirest/settings?' + this.applicationSettingParams).respond(200, {});
            settingManagerSvc.getApplicationSettings()
                .then(function(response) {
                    expect(response.data).toEqual({});
                }, function() {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
    });
    describe('should get an application setting by type', function() {
        it('unless an error occurs', function() {
            $httpBackend.whenGET('/mobirest/settings/types/' + encodeURIComponent('https://mobi.com/ontologies/setting#TestApplicationSettingType') + '?' + this.applicationSettingParams).respond(400, null, null, 'Error Message');
            settingManagerSvc.getApplicationSettingByType('https://mobi.com/ontologies/setting#TestApplicationSettingType')
                .then(function(value) {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toBe('Error Message');
                });
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({
                status: 400,
                statusText: 'Error Message'
            }));
        });
        it('successfully', function() {
            $httpBackend.whenGET('/mobirest/settings/types/' + encodeURIComponent('https://mobi.com/ontologies/setting#TestApplicationSettingType') + '?' + this.applicationSettingParams).respond(200, {});
            settingManagerSvc.getApplicationSettingByType('https://mobi.com/ontologies/setting#TestApplicationSettingType')
                .then(function(response) {
                    expect(response.data).toEqual({});
                }, function() {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
    });
    describe('should update an application setting', function() {
        beforeEach(function() {
            this.newRecord = {};
            this.url = '/mobirest/settings/' + '1234';
            this.applicationSettingConfig = {
                type: prefixes.setting + 'ApplicationSetting',
                subType: 'https://mobi.com/ontologies/setting#TestApplicationSettingType'
            };
        });
        it('unless an error occurs', function() {
            var params = $httpParamSerializer(this.applicationSettingConfig);
            $httpBackend.expectPUT(this.url + '?' + params, this.newRecord).respond(400, null, null, 'Error Message');
            settingManagerSvc.updateApplicationSetting('1234', 'https://mobi.com/ontologies/setting#TestApplicationSettingType', this.newRecord).then(() => fail('Promise should have rejected'),
                    response => expect(response).toEqual('Error Message'));
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: 'Error Message'}));
        });
        it('successfully', function() {
            var params = $httpParamSerializer(this.applicationSettingConfig);
            $httpBackend.expectPUT(this.url + '?' + params, this.newRecord).respond(200, {});
            var self = this;
            settingManagerSvc.updateApplicationSetting('1234', 'https://mobi.com/ontologies/setting#TestApplicationSettingType', this.newRecord)
                .then(response => expect(response.data).toEqual({}), response => fail('Promise should have resolved'));
            flushAndVerify($httpBackend);
        });
    });
    describe('should create an application setting', function() {
        beforeEach(function() {
            this.newRecord = {};
            this.url = '/mobirest/settings';
            this.applicationSettingConfig = {
                type: prefixes.setting + 'ApplicationSetting',
                subType: 'https://mobi.com/ontologies/setting#TestApplicationSettingType'
            };
        });
        it('unless an error occurs', function() {
            var params = $httpParamSerializer(this.applicationSettingConfig);
            $httpBackend.expectPOST(this.url + '?' + params, this.newRecord).respond(400, null, null, 'Error Message');
            settingManagerSvc.createApplicationSetting('https://mobi.com/ontologies/setting#TestApplicationSettingType', this.newRecord).then(() => fail('Promise should have rejected'),
                    response => expect(response).toEqual('Error Message'));
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: 'Error Message'}));
        });
        it('successfully', function() {
            var params = $httpParamSerializer(this.applicationSettingConfig);
            $httpBackend.expectPOST(this.url + '?' + params, this.newRecord).respond(200, {});
            settingManagerSvc.createApplicationSetting('https://mobi.com/ontologies/setting#TestApplicationSettingType', this.newRecord)
                .then(response => expect(response.data).toEqual({}), response => fail('Promise should have resolved'));
            flushAndVerify($httpBackend);
        });
    });
    describe('should retrieve a list of application setting groups', function() {
        it('unless an error occurs', function() {
            $httpBackend.whenGET('/mobirest/settings/groups?' + this.applicationSettingParams).respond(400, null, null, 'Error Message');
            settingManagerSvc.getApplicationSettingGroups()
                .then(function(value) {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toBe('Error Message');
                });
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({
                status: 400,
                statusText: 'Error Message'
            }));
        });
        it('successfully', function() {
            $httpBackend.whenGET('/mobirest/settings/groups?' + this.applicationSettingParams).respond(200, {});
            settingManagerSvc.getApplicationSettingGroups()
                .then(function(response) {
                    expect(response.data).toEqual({});
                }, function() {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
    });
    describe('should retrieve a list of application setting definitions', function() {
        beforeEach(function() {
            this.testApplicationSettingGroup = 'https://mobi.com/ontologies/setting#TestApplicationSettingGroup';
        });
        it('unless an error occurs', function() {
            $httpBackend.whenGET('/mobirest/settings/groups/' + encodeURIComponent(this.testApplicationSettingGroup) + '/definitions?' + this.applicationSettingParams).respond(400, null, null, 'Error Message');
            settingManagerSvc.getApplicationSettingDefinitions(this.testApplicationSettingGroup)
                .then(function(value) {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toBe('Error Message');
                });
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({
                status: 400,
                statusText: 'Error Message'
            }));
        });
        it('successfully', function() {
            $httpBackend.whenGET('/mobirest/settings/groups/' + encodeURIComponent(this.testApplicationSettingGroup) + '/definitions?' + this.applicationSettingParams).respond(200, {});
            settingManagerSvc.getApplicationSettingDefinitions(this.testApplicationSettingGroup)
                .then(function(response) {
                    expect(response.data).toEqual({});
                }, function() {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
    });
});
