/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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
describe('Prov Manager service', function() {
    var $httpBackend, $httpParamSerializer, scope, provManagerSvc, $q, utilSvc, httpSvc;

    beforeEach(function() {
        module('shared');
        mockUtil();
        mockPrefixes();
        injectRestPathConstant();
        mockHttpService();

        inject(function(provManagerService, _$httpBackend_, _$httpParamSerializer_, _$rootScope_, _$q_, _utilService_, _httpService_) {
            provManagerSvc = provManagerService;
            $httpBackend = _$httpBackend_;
            $httpParamSerializer = _$httpParamSerializer_;
            scope = _$rootScope_;
            $q = _$q_;
            utilSvc = _utilService_;
            httpSvc = _httpService_;
        });

        utilSvc.paginatedConfigToParams.and.callFake(_.identity);
    });

    afterEach(function() {
        $httpBackend = null;
        $httpParamSerializer = null;
        scope = null;
        provManagerSvc = null;
        $q = null;
        utilSvc = null;
        httpSvc = null;
    });

    describe('should retrieve a list of Activities', function() {
        beforeEach(function() {
            this.id = 'id';
            this.config = { limit: 10, offset: 0 };
        });
        describe('with an id', function() {
            it('unless an error occurs', function() {
                httpSvc.get.and.returnValue($q.reject({statusText: 'Error Message'}));
                provManagerSvc.getActivities({}, this.id)
                    .then(function() {
                        fail('Promise should have rejected');
                    });
                scope.$apply();
                expect(httpSvc.get).toHaveBeenCalledWith('/mobirest/provenance-data', {params: {}}, this.id);
                expect(utilSvc.rejectError).toHaveBeenCalledWith({statusText: 'Error Message'});
            });
            it('with all config passed', function() {
                httpSvc.get.and.returnValue($q.when({data: {}}));
                provManagerSvc.getActivities(this.config, this.id)
                    .then(function(response) {
                        expect(response.data).toEqual({});
                    }, function() {
                        fail('Promise should have resolved');
                    });
                scope.$apply();
                expect(httpSvc.get).toHaveBeenCalledWith('/mobirest/provenance-data', {params: this.config}, this.id);
            });
            it('without any config', function() {
                httpSvc.get.and.returnValue($q.when({data: {}}));
                provManagerSvc.getActivities({}, this.id)
                    .then(function(response) {
                        expect(response.data).toEqual({});
                    }, function() {
                        fail('Promise should have resolved');
                    });
                scope.$apply();
                expect(httpSvc.get).toHaveBeenCalledWith('/mobirest/provenance-data', {params: {}}, this.id);
            });
        });
        describe('without an id', function() {
            it('unless an error occurs', function() {
                $httpBackend.whenGET('/mobirest/provenance-data').respond(400, null, null, 'Error Message');
                provManagerSvc.getActivities({})
                    .then(function() {
                        fail('Promise should have rejected');
                    });
                flushAndVerify($httpBackend);
                expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: 'Error Message'}));
            });
            it('with all config passed', function() {
                var params = $httpParamSerializer(this.config);
                $httpBackend.whenGET('/mobirest/provenance-data?' + params).respond(200, {});
                provManagerSvc.getActivities(this.config)
                    .then(function(response) {
                        expect(response.data).toEqual({});
                    }, function() {
                        fail('Promise should have resolved');
                    });
                flushAndVerify($httpBackend);
            });
            it('without any config', function() {
                $httpBackend.whenGET('/mobirest/provenance-data').respond(200, {});
                provManagerSvc.getActivities({})
                    .then(function(response) {
                        expect(response.data).toEqual({});
                    }, function() {
                        fail('Promise should have resolved');
                    });
                flushAndVerify($httpBackend);
            });
        });
    });
});
