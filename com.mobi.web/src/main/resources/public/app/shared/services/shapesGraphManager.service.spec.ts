/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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
import { HttpParams } from '@angular/common/http';
import { MockProvider } from 'ng-mocks';
import { of } from 'rxjs';
import { cloneDeep } from 'lodash';

import { cleanStylesFromDOM } from '../../../test/ts/Shared';
import { PolicyEnforcementService } from './policyEnforcement.service';
import { ProgressSpinnerService } from '../components/progress-spinner/services/progressSpinner.service';
import { RdfDownload } from '../models/rdfDownload.interface';
import { RdfUpdate } from '../models/rdfUpdate.interface';
import { RdfUpload } from '../models/rdfUpload.interface';
import { VersionedRdfUploadResponse } from '../models/versionedRdfUploadResponse.interface';
import { ShapesGraphManagerService } from './shapesGraphManager.service';

describe('Shapes Graph Manager service', function() {
    let service: ShapesGraphManagerService;
    let httpMock: HttpTestingController;
    let progressSpinnerStub: jasmine.SpyObj<ProgressSpinnerService>;
    let policyEnforcementStub: jasmine.SpyObj<PolicyEnforcementService>;

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
                MockProvider(PolicyEnforcementService)
            ]
        });

        service = TestBed.inject(ShapesGraphManagerService);
        httpMock = TestBed.inject(HttpTestingController) as jasmine.SpyObj<HttpTestingController>;
        progressSpinnerStub = TestBed.inject(ProgressSpinnerService) as jasmine.SpyObj<ProgressSpinnerService>;
        policyEnforcementStub = TestBed.inject(PolicyEnforcementService) as jasmine.SpyObj<PolicyEnforcementService>;
        policyEnforcementStub.permit = 'Permit';
        policyEnforcementStub.deny = 'Deny';
        policyEnforcementStub.evaluateRequest.and.returnValue(of(policyEnforcementStub.permit));

        rdfDownload = {
            recordId: 'record1',
            branchId: 'branch1',
            commitId: 'commit1',
            rdfFormat: 'turtle',
            fileName: file.name
        };
        progressSpinnerStub.track.and.callFake((ob) => ob);
        progressSpinnerStub.trackedRequest.and.callFake((ob) => ob);
    });

    afterEach(function() {
        cleanStylesFromDOM();
        service = null;
        httpMock = null;
        progressSpinnerStub = null;
        rdfDownload = null;
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
            const request = httpMock.expectOne(req => req.method === 'PUT' && req.url === `${service.prefix}/${encodeURIComponent(rdfUpdate.recordId)}`);
            expect((request.request.params).get('branchId').toString()).toEqual(rdfUpdate.branchId);
            expect((request.request.params).get('commitId').toString()).toEqual(rdfUpdate.commitId);
            expect((request.request.params).get('replaceInProgressCommit').toString()).toEqual(`${rdfUpdate.replaceInProgressCommit}`);
            request.flush('', { status: 400, statusText: error });
        });
        it('successfully with a file', function() {
            service.uploadChanges(rdfUpdate)
                .subscribe(response => {
                    expect(response.status).toEqual(200);
                }, () => fail('Promise should have resolved'));
            const request = httpMock.expectOne(req => req.method === 'PUT' && req.url === `${service.prefix}/${encodeURIComponent(rdfUpdate.recordId)}`);
            expect((request.request.params).get('branchId').toString()).toEqual(rdfUpdate.branchId);
            expect((request.request.params).get('commitId').toString()).toEqual(rdfUpdate.commitId);
            expect((request.request.params).get('replaceInProgressCommit').toString()).toEqual(`${rdfUpdate.replaceInProgressCommit}`);
            request.flush([uploadResponse]);
        });
        it('successfully with JSON-LD', function() {
          const rdfUpdateClone = cloneDeep(rdfUpdate);
          delete rdfUpdateClone.file;
          rdfUpdateClone.jsonld = {'@id': 'jsonld'};
          service.uploadChanges(rdfUpdateClone)
              .subscribe(response => {
                  expect(response.status).toEqual(200);
              }, () => fail('Promise should have resolved'));
          const request = httpMock.expectOne(req => req.method === 'PUT' && req.url === `${service.prefix}/${encodeURIComponent(rdfUpdateClone.recordId)}`);
          expect((request.request.params).get('branchId').toString()).toEqual(rdfUpdateClone.branchId);
          expect((request.request.params).get('commitId').toString()).toEqual(rdfUpdateClone.commitId);
          expect((request.request.params).get('replaceInProgressCommit').toString()).toEqual(`${rdfUpdateClone.replaceInProgressCommit}`);
          request.flush([uploadResponse]);
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
            const params = new HttpParams({
                fromObject: {
                    branchId: 'branch1',
                    commitId: 'commit1',
                    rdfFormat: 'turtle',
                    fileName: 'filename',
                    applyInProgressCommit: false
                }
            });
            service.downloadShapesGraph(rdfDownload);

            expect(window.open).toHaveBeenCalledWith(`${service.prefix}/${encodeURIComponent(rdfDownload.recordId)}?${params.toString()}`);
        });
        it('with rdfFormat not set', function() {
            const params = new HttpParams({
                fromObject: {
                    branchId: 'branch1',
                    commitId: 'commit1',
                    rdfFormat: 'jsonld',
                    fileName: 'filename',
                    applyInProgressCommit: false
                }
            });
            rdfDownload.rdfFormat = undefined;
            service.downloadShapesGraph(rdfDownload);

            expect(window.open).toHaveBeenCalledWith(`${service.prefix}/${encodeURIComponent(rdfDownload.recordId)}?${params.toString()}`);
        });
        it('with fileName not set', function() {
            const params = new HttpParams({
                fromObject: {
                    branchId: 'branch1',
                    commitId: 'commit1',
                    rdfFormat: 'turtle',
                    fileName: 'shapesGraph',
                    applyInProgressCommit: false
                }
            });
            rdfDownload.fileName = undefined;
            service.downloadShapesGraph(rdfDownload);

            expect(window.open).toHaveBeenCalledWith(`${service.prefix}/${encodeURIComponent(rdfDownload.recordId)}?${params.toString()}`);
        });
    });
    describe('should not download a shapes graph record when permission is denied', function() {
        beforeEach(function() {
            policyEnforcementStub.evaluateRequest.and.returnValue(of(policyEnforcementStub.deny));
            spyOn(window, 'open');
        });
        it('with all fields set', function() {
            service.downloadShapesGraph(rdfDownload);
            expect(window.open).not.toHaveBeenCalledWith();
        });
        it('with rdfFormat not set', function() {
            rdfDownload.rdfFormat = undefined;
            service.downloadShapesGraph(rdfDownload);

            expect(window.open).not.toHaveBeenCalledWith();
        });
        it('with fileName not set', function() {
            rdfDownload.fileName = undefined;
            service.downloadShapesGraph(rdfDownload);

            expect(window.open).not.toHaveBeenCalledWith();
        });
    });
    describe('should retrieve shapes graph iri of a shapes graph record', function() {
        it('unless an error occurs', function() {
            service.getShapesGraphIRI('record1', 'branch1', 'commit1')
                .subscribe(() => fail('Promise should have rejected'), response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne(req => req.method === 'GET' && req.url === `${service.prefix}/record1/id`);
            request.flush('flush', { status: 400, statusText: error });
        });
        it('successfully', function() {
            service.getShapesGraphIRI('record1', 'branch1', 'commit1')
                .subscribe(response => {
                    expect(response).toEqual('content');
                }, () => fail('Promise should have resolved'));
            const request = httpMock.expectOne(req => req.method === 'GET' && req.url === `${service.prefix}/record1/id`);
            request.flush('content');
        });
    });
    describe('should retrieve shapes graph imports of a shapes graph record', function() {
        it('unless an error occurs', function() {
            service.getShapesGraphImports('record1', 'branch1', 'commit1')
                .subscribe(() => fail('Promise should have rejected'), response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne(req => req.method === 'GET' && req.url === `${service.prefix}/record1/imports`);
            request.flush('flush', { status: 400, statusText: error });
        });
        it('successfully', function() {
            service.getShapesGraphImports('record1', 'branch1', 'commit1')
                .subscribe(response => {
                    expect(response).toEqual({importedOntologies:[], failedImports: []});
                }, () => fail('Promise should have resolved'));
            const request = httpMock.expectOne(req => req.method === 'GET' && req.url === `${service.prefix}/record1/imports`);
            request.flush({importedOntologies:[], failedImports: []});
        });
    });
});