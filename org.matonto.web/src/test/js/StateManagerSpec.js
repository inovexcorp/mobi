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
describe('State Manager service', function() {
    var $httpBackend, stateManagerSvc, deferred, scope, uuidSvc, $httpParamSerializer;
    var state = {
        '@id': 'http://matonto.org/new-state',
        '@type': 'http://matonto.org/state'
    }
    var stateId = 'id';
    var application = 'app';
    var subjects = ['subject1', 'subject2'];
    var states = ['state1', 'state2'];
    var recordId = 'recordId';
    var branchId = 'branchId';
    var commitId = 'commitId';
    var ontologyState = {
        [prefixes.ontologyState + 'record']: [{'@id': recordId}]
    }

    beforeEach(function() {
        module('stateManager');
        mockPrefixes();
        module(function($provide) {
            $provide.service('uuid', function() {
                this.v4 = jasmine.createSpy('v4').and.returnValue('');
            });
        });
        inject(function(stateManagerService, _$httpBackend_, _$q_, _$rootScope_, _uuid_, _$httpParamSerializer_) {
            $httpBackend = _$httpBackend_;
            stateManagerSvc = stateManagerService;
            deferred = _$q_.defer();
            scope = _$rootScope_;
            uuidSvc = _uuid_;
            $httpParamSerializer = _$httpParamSerializer_;
        });
    });

    function flushAndVerify() {
        $httpBackend.flush();
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    }

    describe('getStates', function() {
        it('without parameters', function() {
            $httpBackend.whenGET('/matontorest/states?').respond(200, states);
            stateManagerSvc.getStates().then(function(response) {
                expect(response).toEqual(states);
            });
            flushAndVerify();
        });
        it('with application and no subjects', function() {
            var params = $httpParamSerializer({
                application: application
            });
            $httpBackend.whenGET('/matontorest/states?' + params).respond(200, states);
            stateManagerSvc.getStates({application: application}).then(function(response) {
                expect(response).toEqual(states);
            });
            flushAndVerify();
        });
        it('with application and subjects', function() {
            var params = $httpParamSerializer({
                application: application,
                subjects: subjects
            });
            $httpBackend.whenGET('/matontorest/states?' + params).respond(200, states);
            stateManagerSvc.getStates({application: application, subjects: subjects}).then(function(response) {
                expect(response).toEqual(states);
            });
            flushAndVerify();
        });
        it('with no application and subjects', function() {
            var params = $httpParamSerializer({
                subjects: subjects
            });
            $httpBackend.whenGET('/matontorest/states?' + params).respond(200, states);
            stateManagerSvc.getStates({subjects: subjects}).then(function(response) {
                expect(response).toEqual(states);
            });
            flushAndVerify();
        });
    });

    describe('createState', function() {
        it('with no application', function() {
            $httpBackend.expectPOST('/matontorest/states', function(data) {
                return _.isEqual(data, JSON.stringify(state));
            }, function(headers) {
                return headers['Content-Type'] === undefined;
            }).respond(200, stateId);
            stateManagerSvc.createState(state).then(function() {
                expect(stateManagerSvc.states.length).toBe(1);
                expect(stateManagerSvc.states[0]).toEqual({id: stateId, model: state});
            });
            flushAndVerify();
        });
        it('with application', function() {
            $httpBackend.expectPOST('/matontorest/states?application=' + application, function(data) {
                return _.isEqual(data, JSON.stringify(state));
            }, function(headers) {
                return headers['Content-Type'] === undefined;
            }).respond(200, stateId);
            stateManagerSvc.createState(state, application).then(function() {
                expect(stateManagerSvc.states.length).toBe(1);
                expect(stateManagerSvc.states[0]).toEqual({id: stateId, model: state});
            });
            flushAndVerify();
        });
    });

    it('getState hits the correct endpoint', function() {
        $httpBackend.expectGET('/matontorest/states/' + encodeURIComponent(stateId)).respond(200, states[0]);
        stateManagerSvc.getState(stateId).then(function(response) {
            expect(response).toEqual(states[0]);
        });
        flushAndVerify();
    });

    it('updateState hits the correct endpoint', function() {
        stateManagerSvc.states = [{id: stateId, model: 'old-model'}];
        $httpBackend.expectPUT('/matontorest/states/' + encodeURIComponent(stateId), function(data) {
            return _.isEqual(data, JSON.stringify(state));
        }).respond(200, '');
        stateManagerSvc.updateState(stateId, state).then(function() {
            expect(stateManagerSvc.states.length).toBe(1);
            expect(stateManagerSvc.states[0]).toEqual([{id: stateId, model: state}]);
        });
        flushAndVerify();
    });

    it('deleteState hits the correct endpoint', function() {
        stateManagerSvc.states = [{id: stateId, model: 'old-model'}];
        $httpBackend.expectDELETE('/matontorest/states/' + encodeURIComponent(stateId)).respond(200, '');
        stateManagerSvc.deleteState(stateId).then(function() {
            expect(stateManagerSvc.states.length).toBe(0);
        });
        flushAndVerify();
    });

    describe('initialize calls the correct method and sets the correct value', function() {
        beforeEach(function() {
            spyOn(stateManagerSvc, 'getStates').and.returnValue(deferred.promise);
            stateManagerSvc.initialize();
        });
        it('when resolved', function() {
            deferred.resolve(states);
            scope.$apply();
            expect(stateManagerSvc.states).toEqual(states);
        });
        it('when rejected', function() {
            spyOn(console, 'log');
            deferred.reject('');
            scope.$apply();
            expect(console.log).toHaveBeenCalledWith('Problem getting states');
        });
    });

    it('createOntologyState calls the correct method', function() {
        spyOn(stateManagerSvc, 'createState');
        stateManagerSvc.createOntologyState(recordId, branchId, commitId);
        expect(uuidSvc.v4).toHaveBeenCalled();
        expect(stateManagerSvc.createState).toHaveBeenCalledWith(jasmine.any(Object), 'ontology-editor');
    });

    describe('getOntologyStateByRecordId', function() {
        it('when state is not present', function() {
            var result = stateManagerSvc.getOntologyStateByRecordId(recordId);
            expect(result).toEqual({});
        });
        it('when state is present', function() {
            stateManagerSvc.states = [{id: stateId, model: ontologyState}];
            var result = stateManagerSvc.getOntologyStateByRecordId(recordId);
            expect(result).toEqual(ontologyState);
        });
    });

    it('updateOntologyState calls the correct method', function() {
        spyOn(stateManagerSvc, 'updateState');
        spyOn(stateManagerSvc, 'getOntologyStateByRecordId').and.returnValue({
            id: stateId,
            model: ontologyState
        });
        stateManagerSvc.updateOntologyState(recordId, branchId, commitId);
        expect(stateManagerSvc.updateState).toHaveBeenCalledWith(stateId, jasmine.any(Object));
    });

    it('deleteOntologyState calls the correct method', function() {
        spyOn(stateManagerSvc, 'deleteState');
        spyOn(stateManagerSvc, 'getOntologyStateByRecordId').and.returnValue({
            id: stateId,
            model: ontologyState
        });
        stateManagerSvc.deleteOntologyState(recordId);
        expect(stateManagerSvc.deleteState).toHaveBeenCalledWith(stateId);
    });
});