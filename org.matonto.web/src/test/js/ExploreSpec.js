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

        inject(function(exploreService, _$q_, _$httpBackend_, _utilService_) {
            exploreSvc = exploreService;
            $q = _$q_;
            $httpBackend = _$httpBackend_;
            utilSvc = _utilService_;
        });
    });

    // function flushAndVerify() {
    //     $httpBackend.flush();
    //     $httpBackend.verifyNoOutstandingExpectation();
    //     $httpBackend.verifyNoOutstandingRequest();
    // }
    
    // describe('getInstancesDetails calls the correct functions when get exploration-datasets/{recordId}/instances-details', function() {
    //     it('is resolved', function() {
    //         var data = [{
    //             label: 'label',
    //             count: 1,
    //             examples: ['example1', 'example2'],
    //             overview: 'overview',
    //             ontologyId: 'ontologyId'
    //         }];
    //         $httpBackend.expectGET('/exploration-dataset/recordId/instances-details').respond(200, data);
    //         exploreSvc.getInstancesDetails('recordId')
    //             .then(function(response) {
    //                 expect(response).toEqual(data);
    //             }, function() {
    //                 fail('Should have been resolved.');
    //             });
    //          flushAndVerify();
    //     });
    //     it('is rejected', function() {
    //         $httpBackend.expectGET('/exploration-dataset/recordId/instances-details').respond(400, null, null, 'error');
    //         exploreSvc.getInstancesDetails('recordId')
    //             .then(function() {
    //                 fail('Should have been rejected.');
    //             }, function(response) {
    //                 expect(response).toBe('error');
    //             });
    //          flushAndVerify();
    //     });
    // });
    
    // describe('getInstances calls the correct functions when get exploration-datasets/{id}/instances?classId={classId}', function() {
    //     it('is resolved', function() {
    //         var data = [{}];
    //         var headers = {};
    //         $httpBackend.expectGET('/exploration-dataset/recordId/instances?classId=classId').respond(200, data, headers);
    //         exploreSvc.getClassInstances('recordId', 'classId')
    //             .then(function(response) {
    //                 TODO: update this expectation
    //                 expect(response).toEqual(data);
    //             }, function() {
    //                 fail('Should have been resolved.');
    //             });
    //          flushAndVerify();
    //     });
    //     it('is rejected', function() {
    //         $httpBackend.expectGET('/exploration-dataset/recordId/instances?classId=classId').respond(400, null, null, 'error');
    //         exploreSvc.getClassInstances('recordId', 'classId')
    //             .then(function() {
    //                 fail('Should have been rejected.');
    //             }, function(response) {
    //                 expect(response).toBe('error');
    //             });
    //          flushAndVerify();
    //     });
    // });
    
    it('createPagedResultsObject should return the correct paged object', function() {
        var response = {
            data: ['data'],
            headers: jasmine.createSpy('headers').and.returnValue({
                'x-total-count': 10,
                link: 'link'
            })
        };
        var nextLink = 'http://example.com/next';
        var prevLink = 'http://example.com/prev';
        utilSvc.parseLinks.and.returnValue({next: nextLink, prev: prevLink});
        var result = exploreSvc.createPagedResultsObject(response);
        expect(result.data).toEqual(['data']);
        expect(response.headers).toHaveBeenCalled();
        expect(result.total).toBe(10);
        expect(utilSvc.parseLinks).toHaveBeenCalledWith('link');
        expect(result.links.next).toBe(nextLink);
        expect(result.links.prev).toBe(prevLink);
    });
});
