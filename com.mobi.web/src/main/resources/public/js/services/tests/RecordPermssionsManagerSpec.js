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
    var analyticManagerSvc, scope, $httpBackend, $httpParamSerializer, $q;

    beforeEach(function() {
        module('recordPermissionsManager');
        mockUtil();
        injectRestPathConstant();
        mockPrefixes();

        inject(function(recordPermissionsService, _$rootScope_, _$httpBackend_, _$httpParamSerializer_, _$q_) {
            recordPermissionsSvc = recordPermissionsService;
            scope = _$rootScope_;
            $httpBackend = _$httpBackend_;
            $httpParamSerializer = _$httpParamSerializer_;
            $q = _$q_;
        });

        utilSvc.rejectError.and.returnValue($q.reject('Error Message'));
        this.policy = {PolicyId: 'id'};
    });

    afterEach(function() {
        analyticManagerSvc = null;
        scope = null;
        $httpBackend = null;
        $httpParamSerializer = null
        $q = null;
    });

    describe('should retrieve a policy', function() {
        it('unless an error occurs', function() {
            $httpBackend.whenGET('/mobirest/policies/' + this.policy.PolicyId).respond(400, null, null, 'Error Message');
            recordPermissionsSvc.getPolicy(this.policy.PolicyId)
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
            $httpBackend.whenGET('/mobirest/policies/' + this.policy.PolicyId).respond(200, this.policy);
            recordPermissionsSvc.getPolicy(this.policy.PolicyId)
                .then(function(response) {
                    expect(response).toEqual(this.policy);
                }.bind(this), function() {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
    });
    describe('should update a policy', function() {
        it('unless an error occurs', function() {
            $httpBackend.whenPUT('/mobirest/policies/' + this.policy.PolicyId,
                function(data) {
                    return _.isEqual(data, JSON.stringify(this.policy));
                }.bind(this)).respond(400, null, null, 'Error Message');
            recordPermissionsSvc.updatePolicy(this.policy)
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
            $httpBackend.whenPUT('/mobirest/policies/' + this.policy.PolicyId,
                function(data) {
                    return _.isEqual(data, JSON.stringify(this.policy));
                }.bind(this)).respond(200);
            recordPermissionsSvc.updatePolicy(this.policy)
                .then(_.noop, function() {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
    });
});
