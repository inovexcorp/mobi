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
describe('Record Permissions service', function() {
    var recordPermissionsSvc, utilSvc, scope, $httpBackend, $httpParamSerializer, $q;

    beforeEach(function() {
        module('recordPermissionsManager');
        mockUtil();
        injectRestPathConstant();
        mockPrefixes();

        inject(function(recordPermissionsManagerService, _utilService_,  _$rootScope_, _$httpBackend_, _$httpParamSerializer_, _$q_) {
            recordPermissionsSvc = recordPermissionsManagerService;
            utilSvc = _utilService_;
            scope = _$rootScope_;
            $httpBackend = _$httpBackend_;
            $httpParamSerializer = _$httpParamSerializer_;
            $q = _$q_;
        });

        utilSvc.rejectError.and.returnValue($q.reject('Error Message'));
        this.policyId = 'id';
        this.policy = {};
    });

    afterEach(function() {
        analyticManagerSvc = null;
        scope = null;
        $httpBackend = null;
        $httpParamSerializer = null
        $q = null;
    });

    describe('should retrieve a record policy json representation', function() {
        it('unless an error occurs', function() {
            $httpBackend.whenGET('/mobirest/record-permissions/' + this.policyId).respond(400, null, null, 'Error Message');
            recordPermissionsSvc.getRecordPolicy(this.policyId)
                .then(function() {
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
            $httpBackend.whenGET('/mobirest/record-permissions/' + this.policyId).respond(200, this.policy);
            recordPermissionsSvc.getRecordPolicy(this.policyId)
                .then(function(response) {
                    expect(response).toEqual(this.policy);
                }.bind(this), function() {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
    });
    describe('should update a record policy with the json representation', function() {
        it('unless an error occurs', function() {
            $httpBackend.whenPUT('/mobirest/record-permissions/' + this.policyId,
                function(data) {
                    return _.isEqual(data, JSON.stringify(this.policy));
                }.bind(this)).respond(400, null, null, 'Error Message');
            recordPermissionsSvc.updateRecordPolicy(this.policyId, this.policy)
                .then(function() {
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
        it('when resolved', function() {
            $httpBackend.whenPUT('/mobirest/record-permissions/' + this.policyId,
                function(data) {
                    return _.isEqual(data, JSON.stringify(this.policy));
                }.bind(this)).respond(200);
            recordPermissionsSvc.updateRecordPolicy(this.policyId, this.policy)
                .then(_.noop, function() {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
    });
});
