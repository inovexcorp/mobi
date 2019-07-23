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
describe('State Manager service', function() {
    var $httpBackend, stateManagerSvc, $q, scope, $httpParamSerializer, util;

    beforeEach(function() {
        module('shared');
        mockUtil();
        injectRestPathConstant();

        inject(function(stateManagerService, _$httpBackend_, _$q_, _$rootScope_, _$httpParamSerializer_, _utilService_) {
            stateManagerSvc = stateManagerService;
            $httpBackend = _$httpBackend_;
            $q = _$q_;
            scope = _$rootScope_;
            $httpParamSerializer = _$httpParamSerializer_;
            util = _utilService_;
        });

        this.state = {
            '@id': 'http://mobi.com/new-state',
            '@type': 'http://mobi.com/state'
        };
        this.stateId = 'id';
        this.application = 'app';
        this.subjects = ['subject1', 'subject2'];
        this.states = ['state1', 'state2'];
    });

    afterEach(function() {
        stateManagerSvc = null;
        $httpBackend = null;
        $q = null;
        scope = null;
        $httpParamSerializer = null;
        util = null;
    });

    describe('initialize calls the correct method and sets the correct value', function() {
        it('when resolved', function() {
            spyOn(stateManagerSvc, 'getStates').and.returnValue($q.when(this.states));
            stateManagerSvc.initialize();
            scope.$apply();
            expect(stateManagerSvc.states).toEqual(this.states);
        });
        it('when rejected', function() {
            spyOn(stateManagerSvc, 'getStates').and.returnValue($q.reject(''));
            stateManagerSvc.initialize();
            scope.$apply();
            expect(util.createErrorToast).toHaveBeenCalledWith('Problem getting states');
        });
    });
    describe('getStates', function() {
        it('without parameters', function() {
            $httpBackend.whenGET('/mobirest/states').respond(200, this.states);
            var self = this;
            stateManagerSvc.getStates()
                .then(function(response) {
                    expect(response).toEqual(self.states);
                });
            flushAndVerify($httpBackend);
        });
        it('with application and no subjects', function() {
            var params = $httpParamSerializer({
                application: this.application
            });
            $httpBackend.whenGET('/mobirest/states?' + params).respond(200, this.states);
            var self = this;
            stateManagerSvc.getStates({application: this.application})
                .then(function(response) {
                    expect(response).toEqual(self.states);
                });
            flushAndVerify($httpBackend);
        });
        it('with application and subjects', function() {
            var params = $httpParamSerializer({
                application: this.application,
                subjects: this.subjects
            });
            $httpBackend.whenGET('/mobirest/states?' + params).respond(200, this.states);
            var self = this;
            stateManagerSvc.getStates({application: this.application, subjects: this.subjects})
                .then(function(response) {
                    expect(response).toEqual(self.states);
                });
            flushAndVerify($httpBackend);
        });
        it('with no application and subjects', function() {
            var params = $httpParamSerializer({
                subjects: this.subjects
            });
            var self = this;
            $httpBackend.whenGET('/mobirest/states?' + params).respond(200, this.states);
            stateManagerSvc.getStates({subjects: this.subjects})
                .then(function(response) {
                    expect(response).toEqual(self.states);
                });
            flushAndVerify($httpBackend);
        });
    });
    describe('createState', function() {
        it('with no application', function() {
            var self = this;
            $httpBackend.expectPOST('/mobirest/states', function(data) {
                return _.isEqual(data, JSON.stringify(self.state));
            }, function(headers) {
                return headers['Content-Type'] === 'application/json';
            }).respond(200, this.stateId);
            stateManagerSvc.createState(this.state);
            flushAndVerify($httpBackend);
            expect(stateManagerSvc.states.length).toBe(1);
            expect(stateManagerSvc.states[0]).toEqual({id: this.stateId, model: this.state});
        });
        it('with application', function() {
            var self = this;
            $httpBackend.expectPOST('/mobirest/states?application=' + this.application, function(data) {
                return _.isEqual(data, JSON.stringify(self.state));
            }, function(headers) {
                return headers['Content-Type'] === 'application/json';
            }).respond(200, this.stateId);
            stateManagerSvc.createState(this.state, this.application);
            flushAndVerify($httpBackend);
            expect(stateManagerSvc.states.length).toBe(1);
            expect(stateManagerSvc.states[0]).toEqual({id: this.stateId, model: this.state});
        });
    });
    it('getState hits the correct endpoint', function() {
        $httpBackend.expectGET('/mobirest/states/' + encodeURIComponent(this.stateId)).respond(200, this.states[0]);
        var self = this;
        stateManagerSvc.getState(this.stateId)
            .then(function(response) {
                expect(response).toEqual(self.states[0]);
            });
        flushAndVerify($httpBackend);
    });
    it('updateState hits the correct endpoint', function() {
        stateManagerSvc.states = [{id: this.stateId, model: 'old-model'}];
        var self = this;
        $httpBackend.expectPUT('/mobirest/states/' + encodeURIComponent(this.stateId), function(data) {
            return _.isEqual(data, JSON.stringify(self.state));
        }).respond(200, '');
        stateManagerSvc.updateState(this.stateId, this.state);
        flushAndVerify($httpBackend);
        expect(stateManagerSvc.states.length).toBe(1);
        expect(stateManagerSvc.states[0]).toEqual({id: this.stateId, model: this.state});
    });
    it('deleteState hits the correct endpoint', function() {
        stateManagerSvc.states = [{id: this.stateId, model: 'old-model'}];
        $httpBackend.expectDELETE('/mobirest/states/' + encodeURIComponent(this.stateId)).respond(200, '');
        stateManagerSvc.deleteState(this.stateId);
        flushAndVerify($httpBackend);
        expect(stateManagerSvc.states.length).toBe(0);
    });
});
