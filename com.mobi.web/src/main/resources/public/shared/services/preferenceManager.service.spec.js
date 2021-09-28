import {
    mockUtil,
    mockPrefixes,
    injectRestPathConstant,
    flushAndVerify
} from '../../../../../test/js/Shared';

describe('Preference Manager service', function() {
    var preferenceManagerSvc, $q, $httpBackend, $httpParamSerializer, utilSvc, prefixes;

    beforeEach(function() {
        angular.mock.module('shared');
        mockUtil();
        mockPrefixes();
        injectRestPathConstant();

        inject(function(preferenceManagerService, _$q_, _$httpBackend_, _$httpParamSerializer_, _utilService_, _prefixes_) {
            preferenceManagerSvc = preferenceManagerService;
            $q = _$q_;
            $httpBackend = _$httpBackend_;
            $httpParamSerializer = _$httpParamSerializer_;
            utilSvc = _utilService_;
            prefixes = _prefixes_;
        });

        utilSvc.rejectError.and.returnValue($q.reject('Error Message'));
        this.policy = {PolicyId: 'id'};
        this.config = {
            type: prefixes.setting + 'Preference'
        };
        this.baseParams = $httpParamSerializer(this.config);
    });

    afterEach(function() {
        preferenceManagerSvc = null;
        $q = null;
        $httpBackend = null;
        $httpParamSerializer = null;
        utilSvc = null;
        prefixes = null;
    });

    describe('should retrieve a list of user preferences', function() {
        it('unless an error occurs', function() {
            $httpBackend.whenGET('/mobirest/settings?' + this.baseParams).respond(400, null, null, 'Error Message');
            preferenceManagerSvc.getUserPreferences()
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
            preferenceManagerSvc.getUserPreferences()
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
            this.config = {
                type: prefixes.setting + 'Preference',
                subType: 'https://mobi.com/ontologies/setting#TestPreferenceType'
            };
        });
        it('unless an error occurs', function() {
            var params = $httpParamSerializer(this.config);
            $httpBackend.expectPUT(this.url + '?' + params, this.newRecord).respond(400, null, null, 'Error Message');
            preferenceManagerSvc.updateUserPreference('1234', 'https://mobi.com/ontologies/setting#TestPreferenceType', this.newRecord).then(() => fail('Promise should have rejected'),
                    response => expect(response).toEqual('Error Message'));
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: 'Error Message'}));
        });
        it('successfully', function() {
            var params = $httpParamSerializer(this.config);
            $httpBackend.expectPUT(this.url + '?' + params, this.newRecord).respond(200, {});
            var self = this;
            preferenceManagerSvc.updateUserPreference('1234', 'https://mobi.com/ontologies/setting#TestPreferenceType', this.newRecord)
                .then(response => expect(response.data).toEqual({}), response => fail('Promise should have resolved'));
            flushAndVerify($httpBackend);
        });
    });
    describe('should create a preference', function() {
        beforeEach(function() {
            this.newRecord = {};
            this.url = '/mobirest/settings';
            this.config = {
                type: prefixes.setting + 'Preference',
                subType: 'https://mobi.com/ontologies/setting#TestPreferenceType'
            };
        });
        it('unless an error occurs', function() {
            var params = $httpParamSerializer(this.config);
            $httpBackend.expectPOST(this.url + '?' + params, this.newRecord).respond(400, null, null, 'Error Message');
            preferenceManagerSvc.createUserPreference('https://mobi.com/ontologies/setting#TestPreferenceType', this.newRecord).then(() => fail('Promise should have rejected'),
                    response => expect(response).toEqual('Error Message'));
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: 'Error Message'}));
        });
        it('successfully', function() {
            var params = $httpParamSerializer(this.config);
            $httpBackend.expectPOST(this.url + '?' + params, this.newRecord).respond(200, {});
            preferenceManagerSvc.createUserPreference('https://mobi.com/ontologies/setting#TestPreferenceType', this.newRecord)
                .then(response => expect(response.data).toEqual({}), response => fail('Promise should have resolved'));
            flushAndVerify($httpBackend);
        });
    });
    describe('should retrieve a list preference groups', function() {
        it('unless an error occurs', function() {
            $httpBackend.whenGET('/mobirest/settings/groups?' + this.baseParams).respond(400, null, null, 'Error Message');
            preferenceManagerSvc.getPreferenceGroups()
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
            preferenceManagerSvc.getPreferenceGroups()
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
            preferenceManagerSvc.getPreferenceDefinitions(this.testPrefGroup)
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
            preferenceManagerSvc.getPreferenceDefinitions(this.testPrefGroup)
                .then(function(response) {
                    expect(response.data).toEqual({});
                }, function() {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
    });
});