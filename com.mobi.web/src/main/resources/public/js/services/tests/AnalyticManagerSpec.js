/*-
 * #%L
 * com.mobi.web
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
describe('Analytic Manager service', function() {
    var analyticManagerSvc, scope, $httpBackend, $httpParamSerializer, utilSvc, $q;

    beforeEach(function() {
        module('analyticManager');
        mockUtil();
        injectRestPathConstant();

        inject(function(analyticManagerService, _$rootScope_, _utilService_, _$httpBackend_, _$httpParamSerializer_, _$q_) {
            analyticManagerSvc = analyticManagerService;
            scope = _$rootScope_;
            utilSvc = _utilService_;
            $httpBackend = _$httpBackend_;
            $httpParamSerializer = _$httpParamSerializer_;
            $q = _$q_;
        });

        utilSvc.rejectError.and.returnValue($q.reject('Error Message'));
    });

    afterEach(function() {
        analyticManagerSvc = null;
        scope = null;
        $httpBackend = null;
        $httpParamSerializer = null
        utilSvc = null;
        $q = null;
    });

    describe('should set the correct initial state when getConfigurationTypes', function() {
        it('resolves', function() {
            var types = ['type1', 'type2'];
            spyOn(analyticManagerSvc, 'getConfigurationTypes').and.returnValue($q.when(types));
            analyticManagerSvc.initialize()
                .then(_.noop, function(response) {
                    fail('Promise should have resolved');
                });
            scope.$apply();
            expect(analyticManagerSvc.configurationTypes).toEqual(types);
        });
        it('rejects', function() {
            spyOn(analyticManagerSvc, 'getConfigurationTypes').and.returnValue($q.reject());
            analyticManagerSvc.initialize()
                .then(function(response) {
                    fail('Promise should have rejected');
                });
            scope.$apply();
            expect(analyticManagerSvc.configurationTypes).toEqual([]);
        });
    });
    describe('should get the IRIs for all record types when GET', function() {
        it('succeeds', function() {
            $httpBackend.whenGET('/mobirest/analytics/configuration-types').respond(200, []);
            analyticManagerSvc.getConfigurationTypes()
                .then(function(value) {
                    expect(value).toEqual([]);
                }, function(response) {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
        it('fails', function() {
            $httpBackend.whenGET('/mobirest/analytics/configuration-types').respond(400, null, null, 'Error Message');
            analyticManagerSvc.getConfigurationTypes()
                .then(function(value) {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toBe('Error Message');
                });
            flushAndVerify($httpBackend);
        });
    });
    describe('should create a new analytic', function() {
        beforeEach(function() {
            this.url = '/mobirest/analytics';
            this.analyticConfig = {
                type: 'Type',
                title: 'Title',
                description: 'Description',
                keywords: ['keyword0', 'keyword1'],
                json: '{}'
            };
        });
        it('unless an error occurs', function() {
            $httpBackend.expectPOST(this.url,
                function(data) {
                    return data instanceof FormData;
                }).respond(400, null, null, 'Error Message');
            analyticManagerSvc.createAnalytic(this.analyticConfig)
                .then(function() {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toBe('Error Message');
                });
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: 'Error Message'}));
        });
        it('with a description and keywords', function() {
            $httpBackend.expectPOST(this.url,
                function(data) {
                    return data instanceof FormData;
                }).respond(200, 'id');
            analyticManagerSvc.createAnalytic(this.analyticConfig)
                .then(function(response) {
                    expect(response).toBe('id');
                }, function(response) {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
        it('without a description or keywords', function() {
            delete this.analyticConfig.description;
            delete this.analyticConfig.keywords;
            $httpBackend.expectPOST(this.url,
                function(data) {
                    return data instanceof FormData;
                }).respond(200, 'id');
            analyticManagerSvc.createAnalytic(this.analyticConfig)
                .then(function(response) {
                    expect(response).toBe('id');
                }, function(response) {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
    });
    describe('should retrieve an AnalyticRecord', function() {
        it('unless an error occurs', function() {
            utilSvc.rejectError.and.returnValue($q.reject('error'));
            $httpBackend.whenGET('/mobirest/analytics/recordId').respond(400, null, null, 'error');
            analyticManagerSvc.getAnalytic('recordId')
                .then(function() {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toBe('error');
                });
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({
                status: 400,
                statusText: 'error'
            }));
        });
        it('when resolved', function() {
            $httpBackend.whenGET('/mobirest/analytics/recordId').respond(200, {});
            analyticManagerSvc.getAnalytic('recordId')
                .then(function(response) {
                    expect(response).toEqual({});
                }, function() {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
    });
    describe('should update an AnalyticRecord', function() {
        beforeEach(function() {
            this.url = '/mobirest/analytics/recordId';
            this.analyticConfig = {
                analyticRecordId: 'recordId',
                type: 'Type',
                json: '{}'
            };
        });
        it('unless an error occurs', function() {
            $httpBackend.whenPUT(this.url,
                function(data) {
                    return data instanceof FormData;
                }).respond(400, null, null, 'Error Message');
            analyticManagerSvc.updateAnalytic(this.analyticConfig)
                .then(function() {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toBe('Error Message');
                });
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: 'Error Message'}));
        });
        it('when resolved', function() {
            $httpBackend.whenPUT(this.url,
                function(data) {
                    return data instanceof FormData;
                }).respond(200);
            analyticManagerSvc.updateAnalytic(this.analyticConfig)
                .then(function(response) {
                    expect(response).toEqual(jasmine.objectContaining({
                        status: 200
                    }));
                }, function() {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
    });
});
