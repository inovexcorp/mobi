/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2023 iNovex Information Systems, Inc.
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
import { HttpClientTestingModule, HttpTestingController, TestRequest } from "@angular/common/http/testing";
import { fakeAsync, TestBed, tick } from "@angular/core/testing";
import { configureTestSuite } from "ng-bullet";
import { MockProvider } from "ng-mocks";
import { of, throwError } from "rxjs";
import { ProgressSpinnerService } from "../components/progress-spinner/services/progressSpinner.service";
import { JSONLDObject } from "../models/JSONLDObject.interface";
import { State } from "../models/state.interface";
import { StateManagerService } from "./stateManager.service";
import { UtilService } from "./util.service";


describe('State Manager service', function() {
    let service: StateManagerService;
    let utilStub: jasmine.SpyObj<UtilService>;
    let httpMock: HttpTestingController;

    const state1JSONLDObject: JSONLDObject = {
        '@id':'id1', '@type': ['http://mobi.com/state']
    };
    const state1: State = {
        'id': 'http://mobi.com/new-state1',
        'model': [state1JSONLDObject]
    };
    const state2JSONLDObject: JSONLDObject = {
        '@id':'id2', 
        '@type': ['http://mobi.com/state2']
    };
    const state2: State = {
        'id': 'http://mobi.com/new-state2',
        'model': [state2JSONLDObject]
    };
    
    const application = 'app';
    const subjects = ['subject1', 'subject2'];
    const states: State[] = [state1, state2];

    const error = 'Error Message';

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [ HttpClientTestingModule ],
            providers: [
                StateManagerService,
                MockProvider(ProgressSpinnerService),
                MockProvider(UtilService),
            ]
        });
    });

    beforeEach(function() {
        service = TestBed.get(StateManagerService);
        utilStub = TestBed.get(UtilService);
        httpMock = TestBed.get(HttpTestingController);
        
        utilStub.createHttpParams.and.callThrough();
        utilStub.rejectErrorObject.and.callFake(() => Promise.reject(error));
        utilStub.rejectError.and.callFake(() => Promise.reject(error));
        utilStub.trackedRequest.and.callFake((ob) => ob);
        utilStub.handleError.and.callFake(error => {
            if (error.status === 0) {
                return throwError('');
            } else {
                return throwError(error.statusText || 'Something went wrong. Please try again later.');
            }
        });
    });
    afterEach(() => {
        httpMock.verify();
    });

    describe('initialize calls the correct method and sets the correct value', function() {
        it('when resolved', fakeAsync(function() {
            spyOn(service, 'getStates').and.returnValue(of(states));
            service.initialize().subscribe();
            tick();
            expect(service.states).toEqual(states);
        }));
        it('when rejected', fakeAsync(function() {
            spyOn(service, 'getStates').and.returnValue(throwError(''));
            service.initialize().subscribe();
            tick();
            expect(utilStub.createErrorToast).toHaveBeenCalled();
            expect(service.states).toEqual([]);
        }));
    });
    describe('getStates', function() {
        it('without parameters', function() {
            service.getStates()
                .subscribe((states: State[]) => {
                    expect(states).toEqual([]);
                });
            const request: TestRequest = httpMock.expectOne({url: service.prefix, method: 'GET'});
            request.flush([]);
            expect(utilStub.createHttpParams).toHaveBeenCalledWith({applicationId: '', subjects: []});
        });
        it('with application and no subjects', function() {
            service.getStates('applicationId')
                .subscribe((states: State[]) => {
                    expect(states).toEqual([]);
                });
            const request: TestRequest = httpMock.expectOne({url: service.prefix, method: 'GET'});
            request.flush([]);
            expect(utilStub.createHttpParams).toHaveBeenCalledWith({applicationId: 'applicationId', subjects: []});
        });
        it('with application and subjects', function() {
            service.getStates('applicationId', subjects)
                .subscribe((states: State[]) => {
                    expect(states).toEqual([]);
                });
            const request: TestRequest = httpMock.expectOne({url: service.prefix, method: 'GET'});
            request.flush([]);
            expect(utilStub.createHttpParams).toHaveBeenCalledWith({applicationId: 'applicationId', subjects: subjects});
        });
        it('with no application and subjects', function() {
            service.getStates('', subjects)
                .subscribe((states: State[]) => {
                    expect(states).toEqual([]);
                });
            const request: TestRequest = httpMock.expectOne({url: service.prefix, method: 'GET'});
            request.flush([]);
            expect(utilStub.createHttpParams).toHaveBeenCalledWith({applicationId: '', subjects: subjects});
        });
    });
    describe('createState', function() {
        it('with no application', function() {
            service.createState(state1.model).subscribe(() => {},() => fail('Observable should not fail'));;
            
            const request: TestRequest = httpMock.expectOne({url: service.prefix, method: 'POST'});
            request.flush(state1.id);

            expect(service.states.length).toBe(1);
            expect(service.states[0]).toEqual({id: state1.id, model: state1.model});
            expect(utilStub.createHttpParams).toHaveBeenCalledWith({});
        });
        it('with application', function() {
            service.createState(state1.model, application).subscribe(() => {},() => fail('Observable should not fail'));;
            const request: TestRequest = httpMock.expectOne({url: service.prefix, method: 'POST'});
            request.flush(state1.id);

            expect(service.states.length).toBe(1);
            expect(service.states[0]).toEqual({id: state1.id, model: state1.model});
            expect(utilStub.createHttpParams).toHaveBeenCalledWith({application: 'app'});
        });
    });
    it('getState hits the correct endpoint', function() {
        service.getState('state1')
            .subscribe((state: State) => {
                expect(state).toEqual(state1);
            });
        const request: TestRequest = httpMock.expectOne({url: service.prefix + '/' + 'state1' , method: 'GET'});
        request.flush(state1);
    });
    it('updateState hits the correct endpoint', function() {
        service.states = [{id: state1.id, model: state1.model}];
        service.updateState(state1.id, state2.model).subscribe(() => {},() => fail('Observable should not fail'));

        const request: TestRequest = httpMock.expectOne({url: service.prefix + '/' + encodeURIComponent(state1.id) , method: 'PUT'});
        request.flush(state2);

        expect(service.states.length).toBe(1);
        expect(service.states[0]).toEqual({id: state1.id, model: state2.model});
    });
    it('deleteState hits the correct endpoint', function() {
        service.states = [{id: state1.id, model: state1.model}];
        service.deleteState(state1.id).subscribe(() => {},() => fail('Observable should not fail'));

        const request: TestRequest = httpMock.expectOne({url: service.prefix + '/' + encodeURIComponent(state1.id) , method: 'DELETE'});
        request.flush(state1);
        expect(service.states.length).toBe(0);
    });
});
