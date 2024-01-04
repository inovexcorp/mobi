/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2024 iNovex Information Systems, Inc.
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

import { JSONLDObject } from '../../shared/models/JSONLDObject.interface';
import { ClassDetails } from '../models/classDetails.interface';
import { InstanceDetails } from '../models/instanceDetails.interface';
import { PropertyDetails } from '../models/propertyDetails.interface';
import { ProgressSpinnerService } from '../../shared/components/progress-spinner/services/progressSpinner.service';
import { ExploreService } from './explore.service';

describe('Explore Service', function() {
    let service: ExploreService;
    let progressSpinnerStub: jasmine.SpyObj<ProgressSpinnerService>;
    let httpMock: HttpTestingController;
    const error = 'Error Message';
    const obj = {
        classIRI: '',
        classTitle: 'string',
        classDescription: 'string',
        instancesCount: 1,
        classExamples: ['1','2'],
        ontologyRecordTitle: 'string',
        deprecated: false
    };
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ HttpClientTestingModule ],
            providers: [
                ExploreService,
                MockProvider(ProgressSpinnerService),
            ]
        });
        service = TestBed.inject(ExploreService);
        httpMock = TestBed.inject(HttpTestingController) as jasmine.SpyObj<HttpTestingController>;
        progressSpinnerStub = TestBed.inject(ProgressSpinnerService) as jasmine.SpyObj<ProgressSpinnerService>;
        
        progressSpinnerStub.track.and.callFake((ob) => ob);
    });

    afterEach(function() {
        service = null;
        progressSpinnerStub = null;
    });
    describe('getClassDetails calls the correct functions when GET /mobirest/explorable-datasets/{recordId}/class-details', function() {
        it('succeeds', function() {
            const data: ClassDetails[]= [obj];
            const url = `${service.prefix}${encodeURIComponent('recordId')}/class-details`;
            service.getClassDetails('recordId')
                .subscribe(function(response) {
                    expect(response).toEqual(data);
                }, function() {
                    fail('Should have been resolved.');
                });
            const req = httpMock.expectOne({url, method: 'GET'});
            req.flush(data);
        });
        it('fails', function() {
            const url = `${service.prefix}${encodeURIComponent('recordId')}/class-details`;
            service.getClassDetails('recordId').subscribe(() => fail('Promise should have rejected'), response => {
                expect(response).toEqual(error);
            });
            const request = httpMock.expectOne({url, method: 'GET'});
            request.flush('flush', { status: 400, statusText: error });
        });
    });

    describe('getClassInstanceDetails calls the correct functions when GET /mobirest/explorable-datasets/{recordId}/classes/{classId}/instance-details', function() {
        it('succeeds', function() {
            const data: InstanceDetails[] = [
                {
                    instanceIRI: 'instanceIri',
                    title: 'title',
                    description: 'description'
                }
            ];
            const url = `${service.prefix}${encodeURIComponent('recordId')}/classes/${encodeURIComponent('classId')}/instance-details`;
            service.getClassInstanceDetails('recordId', 'classId', {limit: 99, offset: 0})
                .subscribe(function(response) {
                    expect(response.body).toEqual(data);
                }, function() {
                    fail('Should have been resolved.');
                });
                const request = httpMock.expectOne(req => req.url === url && req.method === 'GET');
                expect(request.request.params.get('limit')).toEqual('99');
                expect(request.request.params.get('offset')).toEqual('0');
                request.flush(data);
        });
        it('fails', function() {
            const url = `${service.prefix}${encodeURIComponent('recordId')}/classes/${encodeURIComponent('classId')}/instance-details`;
            service.getClassInstanceDetails('recordId', 'classId', {limit: 99, offset: 0})
                .subscribe(function() {
                    fail('Should have been rejected.');
                }, function(response) {
                    expect(response).toBe(error);
                });
                const request = httpMock.expectOne(req => req.url === url && req.method === 'GET');
                expect(request.request.params.get('limit')).toEqual('99');
                expect(request.request.params.get('offset')).toEqual('0');
                request.flush('flush', { status: 400, statusText: error });
        });
    });
    describe('getClassPropertyDetails calls the correct functions when GET /mobirest/explorable-datasets/{recordId}/classes/{classId}/property-details', function() {
        it('succeeds', function() {
            const data: PropertyDetails[] = [
                {
                    propertyIRI: 'iri',
                    type: 'type',
                    range: [],
                    restrictions: []
                }
            ];
            const url = `${service.prefix}${encodeURIComponent('recordId')}/classes/${encodeURIComponent('classId')}/property-details`;
            service.getClassPropertyDetails('recordId', 'classId')
                .subscribe(function(response) {
                    expect(response).toEqual(data);
                }, function() {
                    fail('Should have been resolved.');
                });
            const req = httpMock.expectOne({url, method: 'GET'});
            req.flush(data);
        });
        it('fails', function() {
            const url = `${service.prefix}${encodeURIComponent('recordId')}/classes/${encodeURIComponent('classId')}/property-details`;
            service.getClassPropertyDetails('recordId', 'classId')
                .subscribe(function() {
                    fail('Should have been rejected.');
                }, function(response) {
                    expect(response).toBe(error);
                });

            const request = httpMock.expectOne({url, method: 'GET'});
            request.flush('flush', { status: 400, statusText: error });
        });
    });
    describe('createInstance calls the correct functions when POST /mobirest/explorable-datasets/{recordId}/classes/{classId}/instances', function() {
        it('succeeds', function() {
            const data = 'data';
            const url = `${service.prefix}${encodeURIComponent('recordId')}/instances`;
            service.createInstance('recordId', [{'@id': 'id'}])
                .subscribe(function(response) {
                    expect(response).toEqual(data);
                }, function() {
                    fail('Should have been resolved.');
                });
            const req = httpMock.expectOne({url, method: 'POST'});
            req.flush(data);
        });
        it('fails', function() {
            const url = `${service.prefix}${encodeURIComponent('recordId')}/instances`;
            service.createInstance('recordId', [{'@id': 'id'}])
                .subscribe(function() {
                    fail('Should have been rejected.');
                }, function(response) {
                    expect(response).toBe(error);
                });

            const request = httpMock.expectOne({url, method: 'POST'});
            request.flush('flush', { status: 400, statusText: error });
        });
    });
    describe('getInstance calls the correct functions when GET /mobirest/explorable-datasets/{recordId}/classes/{classId}/instances/{instanceId}', function() {
        it('succeeds', function() {
            const data: JSONLDObject[] = [
                {
                  '@id': ''
                }
            ];
            const url = `${service.prefix}${encodeURIComponent('recordId')}/instances/${encodeURIComponent('instanceId')}`;
            service.getInstance('recordId', 'instanceId')
                .subscribe(function(response) {
                    expect(response).toEqual(data);
                }, function() {
                    fail('Should have been resolved.');
                });
            const req = httpMock.expectOne({url, method: 'GET'});
            req.flush(data);
        });
        it('fails', function() {
            const url = `${service.prefix}${encodeURIComponent('recordId')}/instances/${encodeURIComponent('instanceId')}`;
            service.getInstance('recordId', 'instanceId')
                .subscribe(function() {
                    fail('Should have been rejected.');
                }, function(response) {
                    expect(response).toBe(error);
                });

            const request = httpMock.expectOne({url, method: 'GET'});
            request.flush('flush', { status: 400, statusText: error });
        });
    });
    describe('updateInstance calls the correct functions when PUT /mobirest/explorable-datasets/{recordId}/classes/{classId}/instances/{instanceId}', function() {
        it('succeeds', function() {
            const url = `${service.prefix}${encodeURIComponent('recordId')}/instances/${encodeURIComponent('instanceId')}`;
            service.updateInstance('recordId', 'instanceId', [{'@id': 'id'}])
                .subscribe(function() {
                    expect(true).toBeTrue();
                }, function() {
                    fail('Should have been resolved.');
                });
            const req = httpMock.expectOne({url, method: 'PUT'});
            req.flush(200);
        });
        it('fails', function() {
            const url = `${service.prefix}${encodeURIComponent('recordId')}/instances/${encodeURIComponent('instanceId')}`;
            service.updateInstance('recordId', 'instanceId', [{'@id': 'id'}])
                .subscribe(function() {
                    fail('Should have been rejected.');
                }, function(response) {
                    expect(response).toBe(error);
                });

            const request = httpMock.expectOne({url, method: 'PUT'});
            request.flush('flush', { status: 400, statusText: error });
        });
    });
    describe('deleteInstance calls the correct functions when DELETE /mobirest/explorable-datasets/{recordId}/classes/{classId}/instances/{instanceId}', function() {
        it('succeeds', function() {
            const url = `${service.prefix}${encodeURIComponent('recordId')}/instances/${encodeURIComponent('instanceId')}`;
            service.deleteInstance('recordId', 'instanceId')
                .subscribe(function() {
                    expect(true).toBeTrue();
                }, function() {
                    fail('Should have been resolved.');
                });
            const req = httpMock.expectOne({url, method: 'DELETE'});
            req.flush(200);
        });
        it('fails', function() {
            const url = `${service.prefix}${encodeURIComponent('recordId')}/instances/${encodeURIComponent('instanceId')}`;
            service.deleteInstance('recordId', 'instanceId')
                .subscribe(function() {
                    fail('Should have been rejected.');
                }, function(response) {
                    expect(response).toBe(error);
                });

            const request = httpMock.expectOne({url, method: 'DELETE'});
            request.flush('flush', { status: 400, statusText: error });
        });
    });
});
