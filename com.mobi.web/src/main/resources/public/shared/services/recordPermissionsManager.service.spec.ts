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

import { HttpParams } from "@angular/common/http";
import { HttpClientTestingModule, HttpTestingController } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { configureTestSuite } from "ng-bullet";
import { MockProvider } from "ng-mocks";
import { throwError } from "rxjs";
import { ProgressSpinnerService } from "../components/progress-spinner/services/progressSpinner.service";
import { RecordPermissionsManagerService } from "./recordPermissionsManager.service";
import { UtilService } from "./util.service";


describe('Record Permissions service', function() {
    let service: RecordPermissionsManagerService;
    let utilStub: jasmine.SpyObj<UtilService>;
    let httpMock: HttpTestingController;
    let progressSpinnerStub: jasmine.SpyObj<ProgressSpinnerService>

    const error = 'Error Message';
    let recordId: string;
    let policy;

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [ HttpClientTestingModule ],
            providers: [
                RecordPermissionsManagerService,
                MockProvider(ProgressSpinnerService),
                MockProvider(UtilService),
            ]
        });
    });

    beforeEach(function() {
        service = TestBed.get(RecordPermissionsManagerService);
        utilStub = TestBed.get(UtilService);
        httpMock = TestBed.get(HttpTestingController);
        progressSpinnerStub = TestBed.get(ProgressSpinnerService);

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
        progressSpinnerStub.track.and.callFake((ob) => ob);
        recordId = 'id';;
    });


    afterEach(() => {
        service = null;
        utilStub = null;
        httpMock.verify();
        recordId = null;
    });
    describe('should retrieve a record policy json representation', function() {
        it('unless an error occurs', function() {
            service.getRecordPolicy(recordId)
                .subscribe(() => fail('Promise should have rejected'), (response) => expect(response).toBe('Error Message'));
            const request = httpMock.expectOne({url: '/mobirest/record-permissions/' + recordId, method: 'GET'});
            request.flush('flush', { status: 400, statusText: error });
        });
        it('successfully', function() {
            service.getRecordPolicy(recordId)
                .subscribe((response) => expect(response).toEqual({}), () => fail('Promise should have resolved'));
            const request = httpMock.expectOne({url: '/mobirest/record-permissions/' + recordId, method: 'GET'});
            request.flush({});
        });
    });
    describe('should update a record policy with the json representation', function() {
        it('unless an error occurs', function() {
            service.updateRecordPolicy(recordId, policy)
                .subscribe(() => fail('Promise should have rejected'), (response) => expect(response).toBe('Error Message'));

            const request = httpMock.expectOne({url: '/mobirest/record-permissions/' + recordId, method: 'PUT'});
            request.flush('flush', { status: 400, statusText: error });
        });
        it('when resolved', function() {
            service.updateRecordPolicy(recordId, policy)
                .subscribe(()=>{},() => fail('Promise should have resolved'));
            const request = httpMock.expectOne({url: '/mobirest/record-permissions/' + recordId, method: 'PUT'});
            request.flush(null);
        });
    });
});
