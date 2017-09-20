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
describe('Analytic Manager service', function() {
    var analyticManagerSvc, scope, $httpBackend, utilSvc, $q;

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

    describe('should set the correct initial state when getConfigurationTypes', function() {
        it('resolves', function() {
            var types = ['type1', 'type2'];
            spyOn(analyticManagerSvc, 'getConfigurationTypes').and.returnValue($q.when(this.types));
            analyticManagerSvc.initialize().then(function(response) {
                expect(analyticManagerSvc.configurationTypes).toEqual(types);
            }, function(response) {
                fail('Promise should have resolved');
            });
        });
        it('rejects', function() {
            spyOn(analyticManagerSvc, 'getConfigurationTypes').and.returnValue($q.reject());
            analyticManagerSvc.initialize().then(function(response) {
                fail('Promise should have rejected');
            }, function() {
                expect(true).toBe(true);
            });
            scope.$apply();
        });
    });
    describe('should get the IRIs for all record types when GET', function() {
        it('succeeds', function() {
            $httpBackend.whenGET('/mobirest/analytics/configuration-types').respond(200, []);
            analyticManagerSvc.getConfigurationTypes().then(function(value) {
                expect(value).toEqual([]);
            }, function(response) {
                fail('Promise should have resolved');
            });
            flushAndVerify($httpBackend);
        });
        it('fails', function() {
            $httpBackend.whenGET('/mobirest/analytics/configuration-types').respond(400);
            analyticManagerSvc.getConfigurationTypes().then(function(value) {
                fail('Promise should have rejected');
            }, function(response) {
                expect(true).toBe(true);
            });
            flushAndVerify($httpBackend);
        });
    });
    describe('should create a new analytic', function() {
        var url = '/mobirest/analytics';
        var analyticConfig = {
            type: 'Type',
            title: 'Title',
            description: 'Description',
            keywords: ['keyword0', 'keyword1']
        };
        it('unless an error occurs', function() {
            $httpBackend.expectPOST(url,
                function(data) {
                    return data instanceof FormData;
                }).respond(400, null, null, 'Error Message');
            analyticManagerSvc.createAnalytic(analyticConfig).then(function() {
                fail('Promise should have rejected');
            }, function(response) {
                expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: 'Error Message'}));
                expect(response).toBe('Error Message');
            });
            flushAndVerify($httpBackend);
        });
        it('with a description and keywords', function() {
            $httpBackend.expectPOST(url,
                function(data) {
                    return data instanceof FormData;
                }).respond(200, 'id');
            analyticManagerSvc.createAnalytic(analyticConfig).then(function(response) {
                expect(response).toBe('id');
            }, function(response) {
                fail('Promise should have resolved');
            });
            flushAndVerify($httpBackend);
        });
        it('without a description or keywords', function() {
            delete analyticConfig.description;
            delete analyticConfig.keywords;
            $httpBackend.expectPOST(url,
                function(data) {
                    return data instanceof FormData;
                }).respond(200, 'id');
            analyticManagerSvc.createAnalytic(analyticConfig).then(function(response) {
                expect(response).toBe('id');
            }, function(response) {
                fail('Promise should have resolved');
            });
            flushAndVerify($httpBackend);
        });
    });
});
