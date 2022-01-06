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
import { ShapesGraphManagerService } from './shapesGraphManager.service';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HelperService } from './helper.service';
import { configureTestSuite } from 'ng-bullet';
import { TestBed } from '@angular/core/testing';
import { cleanStylesFromDOM, mockUtil } from '../../../../../test/ts/Shared';
import { RdfUpload } from '../models/rdfUpload.interface';
import { VersionedRdfUploadResponse } from '../models/versionedRdfUploadResponse.interface';
import { RdfDownload } from '../models/rdfDownload.interface';
import { RdfUpdate } from '../models/rdfUpdate.interface';

describe('Shapes Graph Manager service', function() {
    let service: ShapesGraphManagerService;
    let utilStub;
    let httpMock: HttpTestingController;
    let helper: HelperService;
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
    let downloadParams: any;

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [ HttpClientTestingModule ],
            providers: [
                ShapesGraphManagerService,
                HelperService,
                { provide: 'utilService', useClass: mockUtil }
            ]
        });
    });

    beforeEach(function() {
        service = TestBed.get(ShapesGraphManagerService);
        utilStub = TestBed.get('utilService');
        httpMock = TestBed.get(HttpTestingController);
        helper = TestBed.get(HelperService);

        spyOn(helper, 'createHttpParams').and.callThrough();
        utilStub.rejectErrorObject.and.callFake(() => Promise.reject(error));
        rdfDownload = {
            recordId: 'record1',
            branchId: 'branch1',
            commitId: 'commit1',
            rdfFormat: 'turtle',
            fileName: file.name
        };
        downloadParams = {
            branchId: 'branch1',
            commitId: 'commit1',
            rdfFormat: 'turtle',
            fileName: 'filename',
            applyInProgressCommit: false
        };
    });

    afterEach(function() {
        cleanStylesFromDOM();
        service = null;
        utilStub = null;
        httpMock = null;
        helper = null;
    });

    afterEach(() => {
        httpMock.verify();
    });

    describe('should create a shapes graph record', function() {
        it('unless an error occurs', function(done) {
            service.createShapesGraphRecord(rdfUpload)
                .then(() => fail('Promise should have rejected'), response => {
                    expect(response).toEqual(error);
                    expect(utilStub.rejectErrorObject).toHaveBeenCalledWith(jasmine.objectContaining({status: 400, statusText: error}));
                    done();
                }).catch(done.fail);
            const request = httpMock.expectOne({url: service.prefix, method: 'POST'});
            request.flush('flush', { status: 400, statusText: error });
        });

        it('successfully', function(done) {
            spyOn<any>(service, 'getVersionedRdfUpload').and.returnValue(uploadResponse);
            service.createShapesGraphRecord(rdfUpload)
                .then(response => {
                    expect(response).toEqual(uploadResponse);
                    done();
                }, () => fail('Promise should have resolved')).catch(done.fail);
            const request = httpMock.expectOne({url: service.prefix, method: 'POST'});
            request.flush([uploadResponse]);
        });
    });

    describe('should upload changes to a shapes graph record', function() {
        it('unless an error occurs', function(done) {
            service.uploadChanges(rdfUpdate)
                .then(() => fail('Promise should have rejected'), response => {
                    expect(response).toEqual(error);
                    expect(utilStub.rejectErrorObject).toHaveBeenCalledWith(jasmine.objectContaining({status: 400, statusText: error}));
                    done();
                }).catch(done.fail);
            const request = httpMock.expectOne({url: service.prefix + '/' + encodeURIComponent(rdfUpdate.recordId), method: 'PUT'});
            request.flush('flush', { status: 400, statusText: error });
        });

        it('successfully', function(done) {
            service.uploadChanges(rdfUpdate)
                .then(response => {
                    expect(response.status).toEqual(200);
                    done();
                }, () => fail('Promise should have resolved')).catch(done.fail);
            const request = httpMock.expectOne({url: service.prefix + '/' + encodeURIComponent(rdfUpdate.recordId), method: 'PUT'});
            request.flush([uploadResponse]);
        });
    });

    describe('should delete changes on a shapes graph record', function() {
        it('unless an error occurs', function(done) {
            service.deleteShapesGraphRecord(rdfUpdate.recordId)
                .then(() => fail('Promise should have rejected'), response => {
                    expect(response).toEqual(error);
                    expect(utilStub.rejectErrorObject).toHaveBeenCalledWith(jasmine.objectContaining({status: 400, statusText: error}));
                    done();
                }).catch(done.fail);
            const request = httpMock.expectOne({url: service.prefix + '/' + encodeURIComponent(rdfUpdate.recordId), method: 'DELETE'});
            request.flush('flush', { status: 400, statusText: error });
        });
        it('successfully', function(done) {
            service.deleteShapesGraphRecord(rdfUpdate.recordId)
                .then(response => {
                    expect(response).toEqual([]);
                    done();
                }, () => fail('Promise should have resolved')).catch(done.fail);
            const request = httpMock.expectOne({url: service.prefix + '/' + encodeURIComponent(rdfUpdate.recordId), method: 'DELETE'});
            request.flush([]);
        });
    });

    describe('should download a shapes graph record', function() {
        it('with all fields set', function() {
            service.downloadShapesGraph(rdfDownload);

            expect(helper.createHttpParams).toHaveBeenCalledWith(downloadParams);
            expect(utilStub.startDownload).toHaveBeenCalledWith(service.prefix + '/' + encodeURIComponent(rdfDownload.recordId)
                + '?' + 'branchId=branch1&commitId=commit1&rdfFormat=turtle&fileName=filename&applyInProgressCommit=false');
        });

        it('with rdfFormat not set', function() {
            rdfDownload.rdfFormat = undefined;
            downloadParams.rdfFormat = 'jsonld';
            service.downloadShapesGraph(rdfDownload);

            expect(helper.createHttpParams).toHaveBeenCalledWith(downloadParams);
            expect(utilStub.startDownload).toHaveBeenCalledWith(service.prefix + '/' + encodeURIComponent(rdfDownload.recordId)
                + '?' + 'branchId=branch1&commitId=commit1&rdfFormat=jsonld&fileName=filename&applyInProgressCommit=false');
        });

        it('with fileName not set', function() {
            rdfDownload.fileName = undefined;
            downloadParams.fileName = 'shapesGraph';
            service.downloadShapesGraph(rdfDownload);

            expect(helper.createHttpParams).toHaveBeenCalledWith(downloadParams);
            expect(utilStub.startDownload).toHaveBeenCalledWith(service.prefix + '/' + encodeURIComponent(rdfDownload.recordId)
                + '?' + 'branchId=branch1&commitId=commit1&rdfFormat=turtle&fileName=shapesGraph&applyInProgressCommit=false');
        });
    });
});
