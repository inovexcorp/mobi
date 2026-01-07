/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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

import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MockProvider } from 'ng-mocks';

import { ProgressSpinnerService } from '../components/progress-spinner/services/progressSpinner.service';
import { RecordPermissionsManagerService } from './recordPermissionsManager.service';

describe('Record Permissions service', function() {
    let service: RecordPermissionsManagerService;
    let httpMock: HttpTestingController;
    let progressSpinnerStub: jasmine.SpyObj<ProgressSpinnerService>;

    const error = 'Error Message';
    let recordId: string;
    let policy;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ HttpClientTestingModule ],
            providers: [
                RecordPermissionsManagerService,
                MockProvider(ProgressSpinnerService),
            ]
        });

        service = TestBed.inject(RecordPermissionsManagerService);
        httpMock = TestBed.inject(HttpTestingController) as jasmine.SpyObj<HttpTestingController>;
        progressSpinnerStub = TestBed.inject(ProgressSpinnerService) as jasmine.SpyObj<ProgressSpinnerService>;

        progressSpinnerStub.track.and.callFake((ob) => ob);
        recordId = 'id';
    });

    afterEach(() => {
        service = null;
        httpMock.verify();
        recordId = null;
    });
    describe('should retrieve a record policy json representation', function() {
        it('unless an error occurs', function() {
            service.getRecordPolicy(recordId)
                .subscribe(() => fail('Promise should have rejected'), (response) => expect(response).toBe('Error Message'));
            const request = httpMock.expectOne({url: `/mobirest/record-permissions/${recordId}`, method: 'GET'});
            request.flush('flush', { status: 400, statusText: error });
        });
        it('successfully', function() {
            service.getRecordPolicy(recordId)
                .subscribe((response) => expect(response).toEqual({}), () => fail('Promise should have resolved'));
            const request = httpMock.expectOne({url: `/mobirest/record-permissions/${recordId}`, method: 'GET'});
            request.flush({});
        });
    });
    describe('should update a record policy with the json representation', function() {
        it('unless an error occurs', function() {
            service.updateRecordPolicy(recordId, policy)
                .subscribe(() => fail('Promise should have rejected'), (response) => expect(response).toBe('Error Message'));

            const request = httpMock.expectOne({url: `/mobirest/record-permissions/${recordId}`, method: 'PUT'});
            request.flush('flush', { status: 400, statusText: error });
        });
        it('when resolved', function() {
            service.updateRecordPolicy(recordId, policy)
                .subscribe(() => {
                    expect(true).toBeTrue();
                },() => fail('Promise should have resolved'));
            const request = httpMock.expectOne({url: `/mobirest/record-permissions/${recordId}`, method: 'PUT'});
            request.flush(null);
        });
    });
});
