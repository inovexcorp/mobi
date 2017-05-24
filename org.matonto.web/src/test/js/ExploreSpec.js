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
describe('Explore Service', function() {
    var exploreSvc, $q, $httpBackend, utilSvc;

    beforeEach(function() {
        module('explore');
        mockUtil();
        mockDiscoverState();

        inject(function(exploreService, _$q_, _$httpBackend_, _utilService_) {
            exploreSvc = exploreService;
            $q = _$q_;
            $httpBackend = _$httpBackend_;
            utilSvc = _utilService_;
        });
    });

    function flushAndVerify() {
        $httpBackend.flush();
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    }
    
    describe('getClassDetails calls the correct functions when GET /matontorest/explorable-datasets/{recordId}/class-details', function() {
        it('succeeds', function() {
            var data = [{prop: 'data'}];
            $httpBackend.expectGET('/matontorest/explorable-datasets/recordId/class-details').respond(200, data);
            exploreSvc.getClassDetails('recordId')
                .then(function(response) {
                    expect(response).toEqual(data);
                }, function() {
                    fail('Should have been resolved.');
                });
            flushAndVerify();
        });
        it('fails', function() {
            $httpBackend.expectGET('/matontorest/explorable-datasets/recordId/class-details').respond(400, null, null, 'error');
            exploreSvc.getClassDetails('recordId')
                .then(function() {
                    fail('Should have been rejected.');
                }, function(response) {
                    expect(response).toBe('error');
                });
            flushAndVerify();
        });
    });
    
    describe('getClassInstanceDetails calls the correct functions when GET /matontorest/explorable-datasets/{recordId}/classes/{classId}/instance-details', function() {
        it('succeeds', function() {
            var data = [{}];
            var headers = {};
            $httpBackend.expectGET('/matontorest/explorable-datasets/recordId/classes/classId/instance-details?limit=99&offset=0').respond(200, data, headers);
            exploreSvc.getClassInstanceDetails('recordId', 'classId')
                .then(function(response) {
                    expect(response).toEqual(jasmine.objectContaining({
                        data: data,
                        status: 200
                    }));
                }, function() {
                    fail('Should have been resolved.');
                });
             flushAndVerify();
        });
        it('fails', function() {
            $httpBackend.expectGET('/matontorest/explorable-datasets/recordId/classes/classId/instance-details?limit=99&offset=0').respond(400, null, null, 'error');
            exploreSvc.getClassInstanceDetails('recordId', 'classId')
                .then(function() {
                    fail('Should have been rejected.');
                }, function(response) {
                    expect(response).toBe('error');
                });
             flushAndVerify();
        });
    });
    
    describe('createPagedResultsObject should return the correct paged object when the headers of the response', function() {
        var response;
        var nextLink = 'http://example.com/next';
        var prevLink = 'http://example.com/prev';
        beforeEach(function() {
            response = {
                data: ['data'],
                headers: jasmine.createSpy('headers').and.returnValue({
                    'x-total-count': 10,
                    link: 'link'
                })
            };
            utilSvc.parseLinks.and.returnValue({next: nextLink, prev: prevLink});
        });
        it('has link', function() {
            var result = exploreSvc.createPagedResultsObject(response);
            expect(result.data).toEqual(['data']);
            expect(response.headers).toHaveBeenCalled();
            expect(result.total).toBe(10);
            expect(utilSvc.parseLinks).toHaveBeenCalledWith('link');
            expect(result.links.next).toBe(nextLink);
            expect(result.links.prev).toBe(prevLink);
        });
        it('does not have link', function() {
            response.headers = jasmine.createSpy('headers').and.returnValue({
                'x-total-count': 10
            });
            var result = exploreSvc.createPagedResultsObject(response);
            expect(result.data).toEqual(['data']);
            expect(response.headers).toHaveBeenCalled();
            expect(result.total).toBe(10);
            expect(utilSvc.parseLinks).not.toHaveBeenCalled();
            expect(_.has(result, 'links')).toBe(false);
        });
    });
});
