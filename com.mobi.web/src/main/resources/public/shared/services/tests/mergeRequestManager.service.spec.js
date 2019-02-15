/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2018 iNovex Information Systems, Inc.
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
describe('Merge Request Manager service', function() {
    var mergeRequestManagerSvc, $httpBackend, $httpParamSerializer, utilSvc, prefixes, $q, scope;

    beforeEach(function() {
        module('mergeRequestManager');
        mockPrefixes();
        mockUtil();
        mockPrefixes();
        injectRestPathConstant();

        inject(function(mergeRequestManagerService, _utilService_, _$httpBackend_, _$httpParamSerializer_, _prefixes_, _$q_, _$rootScope_) {
            mergeRequestManagerSvc = mergeRequestManagerService;
            utilSvc = _utilService_;
            $httpBackend = _$httpBackend_;
            $httpParamSerializer = _$httpParamSerializer_;
            prefixes = _prefixes_;
            $q = _$q_;
            scope = _$rootScope_;
        });

        utilSvc.rejectError.and.returnValue($q.reject('Error Message'));
    });

    afterEach(function() {
        mergeRequestManagerSvc = null;
        $httpBackend = null;
        $httpParamSerializer = null;
        utilSvc = null;
        prefixes = null;
        $q = null;
        scope = null;
    });

    describe('should get a list of merge requests', function() {
        beforeEach(function() {
            this.params = {};
        });
        it('unless an error occurs', function() {
            $httpBackend.expectGET('/mobirest/merge-requests').respond(400, null, null, 'Error Message');
            mergeRequestManagerSvc.getRequests(this.params)
                .then(() => fail('Promise should have rejected'), response => expect(response).toBe('Error Message'));
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({
                status: 400,
                statusText: 'Error Message'
            }));
        });
        it('without parameters', function() {
          $httpBackend.expectGET('/mobirest/merge-requests').respond(200, []);
          mergeRequestManagerSvc.getRequests(this.params)
              .then(response => expect(response).toEqual([]), () => fail('Promise should have resolved'));
          flushAndVerify($httpBackend);
        });
        it('with parameters', function() {
            this.params.accepted = false;
            this.params.ascending = false;
            this.params.sort = 'sort';
            $httpBackend.expectGET('/mobirest/merge-requests?' + $httpParamSerializer(this.params)).respond(200, []);
            mergeRequestManagerSvc.getRequests(this.params)
                .then(response  => expect(response).toEqual([]), () => fail('Promise should have resolved'));
            flushAndVerify($httpBackend);
        });
    });
    describe('should create a new merge request', function() {
        beforeEach(function() {
            this.requestConfig = {
                title: 'Title',
                description: 'Description',
                recordId: 'recordId',
                sourceBranchId: 'branch1',
                targetBranchId: 'branch2',
                assignees: ['user1', 'user2'],
                removeSource: true
            };
        });
        it('unless an error occurs', function() {
            $httpBackend.expectPOST('/mobirest/merge-requests', data => data instanceof FormData).respond(400, null, null, 'Error Message');
            mergeRequestManagerSvc.createRequest(this.requestConfig)
                .then(() => fail('Promise should have rejected'), response => expect(response).toBe('Error Message'));
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({
                status: 400,
                statusText: 'Error Message'
            }));
        });
        it('with a description and assignees', function() {
            $httpBackend.expectPOST('/mobirest/merge-requests', data => data instanceof FormData).respond(200, 'requestId');
            mergeRequestManagerSvc.createRequest(this.requestConfig)
                .then(response => expect(response).toBe('requestId'), () => fail('Promise should have resolved'));
            flushAndVerify($httpBackend);
        });
        it('without a description or assignees', function() {
            delete this.requestConfig.description;
            delete this.requestConfig.assignees;
            $httpBackend.expectPOST('/mobirest/merge-requests', data => data instanceof FormData).respond(200, 'requestId');
            mergeRequestManagerSvc.createRequest(this.requestConfig)
                .then(response => expect(response).toBe('requestId'), () => fail('Promise should have resolved'));
            flushAndVerify($httpBackend);
        });
    });
    describe('should get a single merge request', function() {
        beforeEach(function() {
            this.requestId = 'request';
        });
        it('unless an error occurs', function() {
            $httpBackend.expectGET('/mobirest/merge-requests/' + this.requestId).respond(400, null, null, 'Error Message');
            mergeRequestManagerSvc.getRequest(this.requestId)
                .then(() => fail('Promise should have rejected'), response => expect(response).toBe('Error Message'));
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({
                status: 400,
                statusText: 'Error Message'
            }));
        });
        it('successfully', function() {
          $httpBackend.expectGET('/mobirest/merge-requests/' + this.requestId).respond(200, {});
          mergeRequestManagerSvc.getRequest(this.requestId)
              .then(response => expect(response).toEqual({}), () => fail('Promise should have resolved'));
          flushAndVerify($httpBackend);
        });
    });
    describe('should remove a single merge request', function() {
        beforeEach(function() {
            this.requestId = 'request';
        });
        it('unless an error occurs', function() {
            $httpBackend.expectDELETE('/mobirest/merge-requests/' + this.requestId).respond(400, null, null, 'Error Message');
            mergeRequestManagerSvc.deleteRequest(this.requestId)
                .then(() => fail('Promise should have rejected'), response => expect(response).toBe('Error Message'));
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({
                status: 400,
                statusText: 'Error Message'
            }));
        });
        it('successfully', function() {
          $httpBackend.expectDELETE('/mobirest/merge-requests/' + this.requestId).respond(200, {});
          mergeRequestManagerSvc.deleteRequest(this.requestId)
              .then(_.noop, () => fail('Promise should have resolved'));
          flushAndVerify($httpBackend);
        });
    });
    describe('should accept a merge request', function() {
        beforeEach(function() {
            this.requestId = 'request';
        });
        it('unless an error occurs', function() {
            $httpBackend.expectPOST('/mobirest/merge-requests/' + this.requestId).respond(400, null, null, 'Error Message');
            mergeRequestManagerSvc.acceptRequest(this.requestId)
                .then(() => fail('Promise should have rejected'), response => expect(response).toBe('Error Message'));
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({
                status: 400,
                statusText: 'Error Message'
            }));
        });
        it('successfully', function() {
          $httpBackend.expectPOST('/mobirest/merge-requests/' + this.requestId).respond(200, '');
          mergeRequestManagerSvc.acceptRequest(this.requestId)
              .then(_.noop, () => fail('Promise should have resolved'));
          flushAndVerify($httpBackend);
        });
    });
    it('should determine whether a request is accepted', function() {
        expect(mergeRequestManagerSvc.isAccepted({'@type': []})).toEqual(false);
        expect(mergeRequestManagerSvc.isAccepted({'@type': [prefixes.mergereq + 'AcceptedMergeRequest']})).toEqual(true);
    });
    describe('should update a merge request', function() {
        beforeEach(function() {
            this.requestId = 'request';
            this.updatedRequest = {
                title: 'Title',
                description: 'Description',
                recordId: 'recordId',
                sourceBranchId: 'branch1',
                targetBranchId: 'branch2',
                assignees: ['user1', 'user2'],
                removeSource: true
            };
        });
        it('unless an error occurs', function() {
            $httpBackend.expectPUT('/mobirest/merge-requests/' + this.requestId, this.updatedRequest).respond(400, null, null, 'Error Message');
            mergeRequestManagerSvc.updateRequest(this.requestId, this.updatedRequest)
                .then(() => fail('Promise should have rejected'), response => expect(response).toBe('Error Message'));
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({
                status: 400,
                statusText: 'Error Message'
            }));
        });
        it('successfully', function() {
            $httpBackend.expectPUT('/mobirest/merge-requests/' + this.requestId, this.updatedRequest).respond(200, '');
            mergeRequestManagerSvc.updateRequest(this.requestId, this.updatedRequest)
                .then(_.noop, () => fail('Promise should have resolved'));
            flushAndVerify($httpBackend);
        });
    });
});
