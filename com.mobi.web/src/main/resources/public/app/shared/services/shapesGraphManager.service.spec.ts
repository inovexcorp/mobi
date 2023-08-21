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
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MockProvider } from 'ng-mocks';

import { cleanStylesFromDOM } from '../../../test/ts/Shared';
import { RdfUpload } from '../models/rdfUpload.interface';
import { VersionedRdfUploadResponse } from '../models/versionedRdfUploadResponse.interface';
import { RdfDownload } from '../models/rdfDownload.interface';
import { RdfUpdate } from '../models/rdfUpdate.interface';
import { ProgressSpinnerService } from '../components/progress-spinner/services/progressSpinner.service';
import { ShapesGraphManagerService } from './shapesGraphManager.service';

describe('Shapes Graph Manager service', function() {
    let service: ShapesGraphManagerService;
    let httpMock: HttpTestingController;
    let progressSpinnerStub: jasmine.SpyObj<ProgressSpinnerService>;

    const error = 'Error Message';
    const file: File = new File([''], 'filename', { type: 'text/html' });
    const rdfUpload: RdfUpload = {
        title: 'Record Name',
        description: 'Some description',
        keywords: ['keyword1', 'keyword2'],
        file: file
    };
    const rdfUpdate: RdfUpdate = {
        recordId: 'record1',
        file: file,
        branchId: 'branch1',
        commitId: 'commit1',
        replaceInProgressCommit: false
    };
    const uploadResponse: VersionedRdfUploadResponse = {
        shapesGraphId: 'shapesGraphId1',
        recordId: 'record1',
        branchId: 'branch1',
        commitId: 'commit1'
    };
    let rdfDownload: RdfDownload;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ HttpClientTestingModule ],
            providers: [
                ShapesGraphManagerService,
                MockProvider(ProgressSpinnerService),
            ]
        });

        service = TestBed.inject(ShapesGraphManagerService);
        httpMock = TestBed.inject(HttpTestingController) as jasmine.SpyObj<HttpTestingController>;
        progressSpinnerStub = TestBed.inject(ProgressSpinnerService) as jasmine.SpyObj<ProgressSpinnerService>;

        rdfDownload = {
            recordId: 'record1',
            branchId: 'branch1',
            commitId: 'commit1',
            rdfFormat: 'turtle',
            fileName: file.name
        };
        progressSpinnerStub.track.and.callFake((ob) => ob);
    });

    afterEach(function() {
        cleanStylesFromDOM();
        service = null;
        httpMock = null;
        progressSpinnerStub = null;
    });

    afterEach(() => {
        httpMock.verify();
    });

    describe('should create a shapes graph record', function() {
        it('unless an error occurs', function() {
            service.createShapesGraphRecord(rdfUpload)
                .subscribe(() => fail('Promise should have rejected'), response => {
                    expect(response).toEqual({
                        error: '',
                        errorMessage: error,
                        errorDetails: []
                    });
                });
            const request = httpMock.expectOne({url: service.prefix, method: 'POST'});
            request.flush('', { status: 400, statusText: error });
        });

        it('successfully', function() {
            service.createShapesGraphRecord(rdfUpload)
                .subscribe(response => {
                    expect(response).toEqual(uploadResponse);
                }, () => fail('Promise should have resolved'));
            const request = httpMock.expectOne({url: service.prefix, method: 'POST'});
            request.flush(uploadResponse);
        });
    });

    describe('should upload changes to a shapes graph record', function() {
        it('unless an error occurs', function() {
            service.uploadChanges(rdfUpdate)
                .subscribe(() => fail('Promise should have rejected'), response => {
                    expect(response).toEqual({
                        error: '',
                        errorMessage: error,
                        errorDetails: []
                    });
                });
            const request = httpMock.expectOne({url: `${service.prefix}/${encodeURIComponent(rdfUpdate.recordId)}`, method: 'PUT'});
            request.flush('', { status: 400, statusText: error });
        });

        it('successfully', function() {
            service.uploadChanges(rdfUpdate)
                .subscribe(response => {
                    expect(response.status).toEqual(200);
                }, () => fail('Promise should have resolved'));
            const request = httpMock.expectOne({url: `${service.prefix}/${encodeURIComponent(rdfUpdate.recordId)}`, method: 'PUT'});
            request.flush([uploadResponse]);
        });
    });

    describe('should delete changes on a shapes graph record', function() {
        it('unless an error occurs', function() {
            service.deleteShapesGraphRecord(rdfUpdate.recordId)
                .subscribe(() => fail('Promise should have rejected'), response => {
                    expect(response).toEqual({
                        error: '',
                        errorMessage: error,
                        errorDetails: []
                    });
                });
            const request = httpMock.expectOne({url: `${service.prefix}/${encodeURIComponent(rdfUpdate.recordId)}`, method: 'DELETE'});
            request.flush('', { status: 400, statusText: error });
        });
        it('successfully', function() {
            service.deleteShapesGraphRecord(rdfUpdate.recordId)
                .subscribe(() => {
                    expect(true).toBeTrue();
                }, () => fail('Promise should have resolved'));
            const request = httpMock.expectOne({url: `${service.prefix}/${encodeURIComponent(rdfUpdate.recordId)}`, method: 'DELETE'});
            request.flush(200);
        });
    });

    describe('should retrieve shapes graph content of a shapes graph record', function() {
        it('unless an error occurs', function() {
            service.getShapesGraphContent('record1', 'branch1', 'commit1')
                .subscribe(() => fail('Promise should have rejected'), response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne(req => req.method === 'GET' && req.url === `${service.prefix}/record1/content`);
            request.flush('flush', { status: 400, statusText: error });
        });
        it('successfully', function() {
            service.getShapesGraphContent('record1', 'branch1', 'commit1')
                .subscribe(response => {
                    expect(response).toEqual('content');
                }, () => fail('Promise should have resolved'));
            const request = httpMock.expectOne(req => req.method === 'GET' && req.url === `${service.prefix}/record1/content`);
            request.flush('content');
        });
    });

    describe('should download a shapes graph record', function() {
        beforeEach(function() {
            spyOn(window, 'open');
        });
        it('with all fields set', function() {
            service.downloadShapesGraph(rdfDownload);

            expect(window.open).toHaveBeenCalledWith(`${service.prefix}/${encodeURIComponent(rdfDownload.recordId)}?branchId=branch1&commitId=commit1&rdfFormat=turtle&fileName=filename&applyInProgressCommit=false`);
        });

        it('with rdfFormat not set', function() {
            rdfDownload.rdfFormat = undefined;
            service.downloadShapesGraph(rdfDownload);

            expect(window.open).toHaveBeenCalledWith(`${service.prefix}/${encodeURIComponent(rdfDownload.recordId)}?branchId=branch1&commitId=commit1&rdfFormat=jsonld&fileName=filename&applyInProgressCommit=false`);
        });

        it('with fileName not set', function() {
            rdfDownload.fileName = undefined;
            service.downloadShapesGraph(rdfDownload);

            expect(window.open).toHaveBeenCalledWith(`${service.prefix}/${encodeURIComponent(rdfDownload.recordId)}?branchId=branch1&commitId=commit1&rdfFormat=turtle&fileName=shapesGraph&applyInProgressCommit=false`);
        });
    });
});
