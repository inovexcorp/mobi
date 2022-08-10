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
    injectRestPathConstant,
    flushAndVerify
} from '../../../../../test/js/Shared';

describe('Explore Service', function() {
    var exploreServiceStub, $q, $httpBackend, utilServiceStub;

    beforeEach(function() {
        angular.mock.module('discover');
        mockUtil();
        injectRestPathConstant();

        inject(function(exploreService, _$q_, _$httpBackend_, _utilService_) {
            exploreServiceStub = exploreService;
            $q = _$q_;
            $httpBackend = _$httpBackend_;
            utilServiceStub = _utilService_;
        });

        utilServiceStub.rejectError.and.returnValue($q.reject('error'));
    });

    afterEach(function() {
        exploreServiceStub = null;
        $q = null;
        $httpBackend = null;
        utilServiceStub = null;
    });

    describe('getClassDetails calls the correct functions when GET /mobirest/explorable-datasets/{recordId}/class-details', function() {
        it('succeeds', function() {
            var data = [{prop: 'data'}];
            $httpBackend.expectGET('/mobirest/explorable-datasets/recordId/class-details').respond(200, data);
            exploreServiceStub.getClassDetails('recordId')
                .then(function(response) {
                    expect(response).toEqual(data);
                }, function() {
                    fail('Should have been resolved.');
                });
            flushAndVerify($httpBackend);
        });
        it('fails', function() {
            $httpBackend.expectGET('/mobirest/explorable-datasets/recordId/class-details').respond(400, null, null, 'error');
            exploreServiceStub.getClassDetails('recordId')
                .then(function() {
                    fail('Should have been rejected.');
                }, function(response) {
                    expect(response).toBe('error');
                });
            flushAndVerify($httpBackend);
            expect(utilServiceStub.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({
                status: 400,
                statusText: 'error'
            }));
        });
    });

    describe('getClassInstanceDetails calls the correct functions when GET /mobirest/explorable-datasets/{recordId}/classes/{classId}/instance-details', function() {
        it('succeeds', function() {
            var data = [{}];
            $httpBackend.expectGET('/mobirest/explorable-datasets/recordId/classes/classId/instance-details?limit=99&offset=0').respond(200, data);
            exploreServiceStub.getClassInstanceDetails('recordId', 'classId', {limit: 99, offset: 0})
                .then(function(response) {
                    expect(response).toEqual(jasmine.objectContaining({
                        data: data,
                        status: 200
                    }));
                }, function() {
                    fail('Should have been resolved.');
                });
             flushAndVerify($httpBackend);
        });
        it('fails', function() {
            $httpBackend.expectGET('/mobirest/explorable-datasets/recordId/classes/classId/instance-details?limit=99&offset=0').respond(400, null, null, 'error');
            exploreServiceStub.getClassInstanceDetails('recordId', 'classId', {limit: 99, offset: 0})
                .then(function() {
                    fail('Should have been rejected.');
                }, function(response) {
                    expect(response).toBe('error');
                });
             flushAndVerify($httpBackend);
             expect(utilServiceStub.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({
                 status: 400,
                 statusText: 'error'
             }));
        });
    });

    describe('getClassPropertyDetails calls the correct functions when GET /mobirest/explorable-datasets/{recordId}/classes/{classId}/property-details', function() {
        it('succeeds', function() {
            var data = [{}];
            $httpBackend.expectGET('/mobirest/explorable-datasets/recordId/classes/classId/property-details').respond(200, data);
            exploreServiceStub.getClassPropertyDetails('recordId', 'classId')
                .then(function(response) {
                    expect(response).toEqual(data);
                }, function() {
                    fail('Should have been resolved.');
                });
             flushAndVerify($httpBackend);
        });
        it('fails', function() {
            $httpBackend.expectGET('/mobirest/explorable-datasets/recordId/classes/classId/property-details').respond(400, null, null, 'error');
            exploreServiceStub.getClassPropertyDetails('recordId', 'classId')
                .then(function() {
                    fail('Should have been rejected.');
                }, function(response) {
                    expect(response).toBe('error');
                });
             flushAndVerify($httpBackend);
             expect(utilServiceStub.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({
                 status: 400,
                 statusText: 'error'
             }));
        });
    });

    describe('createInstance calls the correct functions when POST /mobirest/explorable-datasets/{recordId}/classes/{classId}/instances', function() {
        beforeEach(function() {
            this.json = {'@id': 'id'};
        });
        it('succeeds', function() {
            $httpBackend.expectPOST('/mobirest/explorable-datasets/recordId/instances', this.json).respond(200, 'instanceId');
            exploreServiceStub.createInstance('recordId', this.json)
                .then(function(response) {
                    expect(response).toEqual('instanceId');
                }, function() {
                    fail('Should have been resolved.');
                });
            flushAndVerify($httpBackend);
        });
        it('fails', function() {
            $httpBackend.expectPOST('/mobirest/explorable-datasets/recordId/instances', this.json).respond(400, null, null, 'error');
            exploreServiceStub.createInstance('recordId', this.json)
                .then(function() {
                    fail('Should have been rejected.');
                }, function(response) {
                    expect(response).toBe('error');
                });
            flushAndVerify($httpBackend);
            expect(utilServiceStub.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({
                status: 400,
                statusText: 'error'
            }));
        });
    });

    describe('getInstance calls the correct functions when GET /mobirest/explorable-datasets/{recordId}/classes/{classId}/instances/{instanceId}', function() {
        it('succeeds', function() {
            var data = {'@id': 'instanceId'};
            $httpBackend.expectGET('/mobirest/explorable-datasets/recordId/instances/instanceId').respond(200, data);
            exploreServiceStub.getInstance('recordId', 'instanceId')
                .then(function(response) {
                    expect(response).toEqual(data);
                }, function() {
                    fail('Should have been resolved.');
                });
            flushAndVerify($httpBackend);
        });
        it('fails', function() {
            $httpBackend.expectGET('/mobirest/explorable-datasets/recordId/instances/instanceId').respond(400, null, null, 'error');
            exploreServiceStub.getInstance('recordId', 'instanceId')
                .then(function() {
                    fail('Should have been rejected.');
                }, function(response) {
                    expect(utilServiceStub.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({
                        status: 400,
                        statusText: 'error'
                    }));
                    expect(response).toBe('error');
                });
            flushAndVerify($httpBackend);
        });
    });

    describe('updateInstance calls the correct functions when PUT /mobirest/explorable-datasets/{recordId}/classes/{classId}/instances/{instanceId}', function() {
        beforeEach(function() {
            this.newInstance = {'@id': 'instanceId', 'prop': 'property'};
        });
        it('succeeds', function() {
            $httpBackend.expectPUT('/mobirest/explorable-datasets/recordId/instances/instanceId', this.newInstance).respond(200);
            exploreServiceStub.updateInstance('recordId', 'instanceId', this.newInstance)
                .then(function(response) {
                    expect(response).toBeUndefined();
                }, function() {
                    fail('Should have been resolved.');
                });
            flushAndVerify($httpBackend);
        });
        it('fails', function() {
            $httpBackend.expectPUT('/mobirest/explorable-datasets/recordId/instances/instanceId', this.newInstance).respond(400, null, null, 'error');
            exploreServiceStub.updateInstance('recordId', 'instanceId', this.newInstance)
                .then(function() {
                    fail('Should have been rejected.');
                }, function(response) {
                    expect(response).toBe('error');
                });
            flushAndVerify($httpBackend);
            expect(utilServiceStub.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({
                status: 400,
                statusText: 'error'
            }));
        });
    });

    describe('deleteInstance calls the correct functions when DELETE /mobirest/explorable-datasets/{recordId}/classes/{classId}/instances/{instanceId}', function() {
        it('succeeds', function() {
            $httpBackend.expectDELETE('/mobirest/explorable-datasets/recordId/instances/instanceId', this.newInstance).respond(200);
            exploreServiceStub.deleteInstance('recordId', 'instanceId')
                .then(function(response) {
                    expect(response).toBeUndefined();
                }, function() {
                    fail('Should have been resolved.');
                });
            flushAndVerify($httpBackend);
        });
        it('fails', function() {
            $httpBackend.expectDELETE('/mobirest/explorable-datasets/recordId/instances/instanceId', this.newInstance).respond(400, null, null, 'error');
            exploreServiceStub.deleteInstance('recordId', 'instanceId')
                .then(function() {
                    fail('Should have been rejected.');
                }, function(response) {
                    expect(response).toBe('error');
                });
            flushAndVerify($httpBackend);
            expect(utilServiceStub.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({
                status: 400,
                statusText: 'error'
            }));
        });
    });

    describe('createPagedResultsObject should return the correct paged object when the headers of the response', function() {
        beforeEach(function() {
            this.nextLink = 'http://example.com/next';
            this.prevLink = 'http://example.com/prev';
            this.headers = jasmine.createSpy('headers').and.returnValue({
                'x-total-count': 10,
                link: 'link'
            });
            this.response = {
                data: ['data'],
                headers: this.headers
            };
            utilServiceStub.parseLinks.and.returnValue({next: this.nextLink, prev: this.prevLink});
        });
        it('has link', function() {
            var result = exploreServiceStub.createPagedResultsObject(this.response);
            expect(result.data).toEqual(['data']);
            expect(this.response.headers).toHaveBeenCalled();
            expect(result.total).toBe(10);
            expect(utilServiceStub.parseLinks).toHaveBeenCalledWith('link');
            expect(result.links.next).toBe(this.nextLink);
            expect(result.links.prev).toBe(this.prevLink);
        });
        it('does not have link', function() {
            this.response.headers = this.headers.and.returnValue({
                'x-total-count': 10
            });
            var result = exploreServiceStub.createPagedResultsObject(this.response);
            expect(result.data).toEqual(['data']);
            expect(this.response.headers).toHaveBeenCalled();
            expect(result.total).toBe(10);
            expect(utilServiceStub.parseLinks).not.toHaveBeenCalled();
            expect(_.has(result, 'links')).toBe(false);
        });
    });
});
