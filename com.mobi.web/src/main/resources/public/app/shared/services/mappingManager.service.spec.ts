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
import { HttpParams } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MockPipe, MockProvider } from 'ng-mocks';
import { of } from 'rxjs';

import {
    cleanStylesFromDOM,
} from '../../../test/ts/Shared';
import { CamelCasePipe } from '../pipes/camelCase.pipe';
import { DELIM, MAPPINGS } from '../../prefixes';
import { JSONLDObject } from '../models/JSONLDObject.interface';
import { Mapping } from '../models/mapping.class';
import { PolicyEnforcementService } from './policyEnforcement.service';
import { ProgressSpinnerService } from '../components/progress-spinner/services/progressSpinner.service';
import { MappingManagerService } from './mappingManager.service';

describe('Mapping Manager service', function() {
    let service: MappingManagerService;
    let progressSpinnerStub: jasmine.SpyObj<ProgressSpinnerService>;
    let camelCaseStub: jasmine.SpyObj<CamelCasePipe>;
    let httpMock: HttpTestingController;
    let policyEnforcementStub: jasmine.SpyObj<PolicyEnforcementService>;

    const error = 'Error Message';
    const recordId = 'http://mobi.com/records/test';
    let mappingStub: jasmine.SpyObj<Mapping>;
    const emptyObj: JSONLDObject = {'@id': 'test'};
   
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ HttpClientTestingModule ],
            providers: [
                MappingManagerService,
                MockProvider(ProgressSpinnerService),
                MockProvider(PolicyEnforcementService),
                {provide: CamelCasePipe, useClass: MockPipe(CamelCasePipe)},
            ]
        });

        service = TestBed.inject(MappingManagerService);
        progressSpinnerStub = TestBed.inject(ProgressSpinnerService) as jasmine.SpyObj<ProgressSpinnerService>;
        camelCaseStub = TestBed.inject(CamelCasePipe) as jasmine.SpyObj<CamelCasePipe>;
        httpMock = TestBed.inject(HttpTestingController) as jasmine.SpyObj<HttpTestingController>;
        policyEnforcementStub = TestBed.inject(PolicyEnforcementService) as jasmine.SpyObj<PolicyEnforcementService>;
        policyEnforcementStub.deny = 'Deny';
        policyEnforcementStub.permit = 'Permit';
        policyEnforcementStub.evaluateRequest.and.returnValue(of(policyEnforcementStub.permit));

        mappingStub = jasmine.createSpyObj('Mapping', [
            'getJsonld',
            'getMappingEntity',
            'getAllClassMappings',
            'getAllDataMappings',
            'getAllObjectMappings',
            'addClassMapping',
            'getClassMapping',
            'hasClassMapping',
            'addDataPropMapping',
            'addObjectPropMapping',
            'getClassIdByMappingId'
        ]);
        
        progressSpinnerStub.track.and.callFake(ob => ob);
    });

    afterEach(function() {
        cleanStylesFromDOM();
        service = null;
        camelCaseStub = null;
        httpMock = null;
        mappingStub = null;
        policyEnforcementStub = null;
    });

    describe('should upload a mapping', function() {
        beforeEach(function () {
            this.url = service.prefix;
            this.recordConfig = {
                title: 'Title',
                description: 'description',
                keywords: ['A', 'B']
            };
        });
        it('unless an error occurs', function() {
            service.upload(this.recordConfig, [])
                .subscribe(() => fail('Observable should have errored'), response => {
                    expect(response).toBe(error);
                });
            const request = httpMock.expectOne({url: this.url, method: 'POST'});
            expect(request.request.body instanceof FormData).toBeTrue();
            request.flush('flush', { status: 400, statusText: error });
        });
        it('successfully', function() {
            service.upload(this.recordConfig, [])
                .subscribe(response => {
                    expect(response).toEqual(recordId);
                }, () => fail('Observable should have succeeded'));
            const request = httpMock.expectOne({url: this.url, method: 'POST'});
            expect(request.request.body instanceof FormData).toBeTrue();
            expect((request.request.body as FormData).get('title').toString()).toEqual(this.recordConfig.title);
            expect((request.request.body as FormData).get('description')).toEqual(this.recordConfig.description);
            expect((request.request.body as FormData).getAll('keywords')).toEqual(this.recordConfig.keywords);
            expect((request.request.body as FormData).get('jsonld')).toEqual('[]');
            request.flush(recordId);
        });
    });
    describe('should retrieve a mapping by id', function() {
        beforeEach(function() {
            this.url = `${service.prefix}/${encodeURIComponent(recordId)}`;
        });
        it('unless an error occurs', function() {
            service.getMapping(recordId)
                .subscribe(() => fail('Observable should have errored'), response => {
                    expect(response).toBe(error);
                });
            const request = httpMock.expectOne({url: this.url, method: 'GET'});
            request.flush('flush', { status: 400, statusText: error });
        });
        it('successfully', function() {
            service.getMapping(recordId)
                .subscribe(response => {
                    expect(response).toEqual([]);
                }, () => fail('Observable should have succeeded'));
            const request = httpMock.expectOne({url: this.url, method: 'GET'});
            request.flush([]);
        });
    });
    describe('should download a mapping by id with the', function() {
        beforeEach(function() {
            this.url = `${service.prefix}/${encodeURIComponent(recordId)}`;
            spyOn(window, 'open');
        });
        it('provided format', function() {
            const params = new HttpParams({
                fromObject: {
                    format: 'turtle',
                }
            });
            service.downloadMapping(recordId, 'turtle');
            expect(window.open).toHaveBeenCalledWith(`${this.url}?${params.toString()}`);
        });
        it('default format', function() {
            const params = new HttpParams({
                fromObject: {
                    format: 'jsonld',
                }
            });
            service.downloadMapping(recordId);
            expect(window.open).toHaveBeenCalledWith(`${this.url}?${params.toString()}`);
        });
    });
    describe('should not download a mapping by id with the', function() {
        beforeEach(function() {
            policyEnforcementStub.evaluateRequest.and.returnValue(of(policyEnforcementStub.deny));
            this.url = `${service.prefix}/${encodeURIComponent(recordId)}`;
            spyOn(window, 'open');
        });
        it('provided format when permission denied', function() {
            const params = new HttpParams({
                fromObject: {
                    format: 'turtle',
                }
            });
            service.downloadMapping(recordId, 'turtle');
            expect(window.open).not.toHaveBeenCalledWith(`${this.url}?${params.toString()}`);
        });
        it('default format when permission denied', function() {
            const params = new HttpParams({
                fromObject: {
                    format: 'jsonld',
                }
            });
            service.downloadMapping(recordId);
            expect(window.open).not.toHaveBeenCalledWith(`${this.url}?${params.toString()}`);
        });
    });
    describe('should delete a mapping by id', function() {
        beforeEach(function() {
            this.url = `${service.prefix}/${encodeURIComponent(recordId)}`;
        });
        it('unless an error occurs', function() {
            service.deleteMapping(recordId)
                .subscribe(() => fail('Observable should have errored'), response => {
                    expect(response).toBe(error);
                });
            const request = httpMock.expectOne({url: this.url, method: 'DELETE'});
            request.flush('flush', { status: 400, statusText: error });
        });
        it('successfully', function() {
            service.deleteMapping(recordId)
                .subscribe(() => {
                    expect(true).toBeTrue();
                }, () => fail('Observable should have succeeded'));
            const request = httpMock.expectOne({url: this.url, method: 'DELETE'});
            request.flush(200);
        });
    });
    it('should get the mapping IRI based on a title', function() {
        camelCaseStub.transform.and.returnValue('title');
        expect(service.getMappingId('title')).toEqual(`${MAPPINGS}title`);
        expect(camelCaseStub.transform).toHaveBeenCalledWith('title', 'class');
    });
    describe('should set the IRI template of a class mapping', function() {
        it('unless it does not exist in the mapping', function() {
            service.editIriTemplate(mappingStub, 'classId', 'test/', '${0}');
            expect(mappingStub.getClassMapping).toHaveBeenCalledWith('classId');
        });
        it('successfully', function() {
            const classMapping = Object.assign({}, emptyObj);
            mappingStub.getClassMapping.and.returnValue(classMapping);
            service.editIriTemplate(mappingStub, 'classId', 'test/', '${0}');
            expect(mappingStub.getClassMapping).toHaveBeenCalledWith('classId');
            expect(classMapping[`${DELIM}hasPrefix`]).toEqual([{'@value': 'test/'}]);
            expect(classMapping[`${DELIM}localName`]).toEqual([{'@value': '${0}'}]);
        });
    });
    it('should test whether a mapping entity is a class mapping', function() {
        expect(service.isClassMapping(emptyObj)).toBe(false);
        expect(service.isClassMapping({'@id': '', '@type': [`${DELIM}ClassMapping`]})).toBe(true);
    });
    it('should test whether a mapping entity is an object mapping', function() {
        expect(service.isObjectMapping(emptyObj)).toBe(false);
        expect(service.isObjectMapping({'@id': '', '@type': [`${DELIM}ObjectMapping`]})).toBe(true);
    });
    it('should test whether a mapping entity is a data mapping', function() {
        expect(service.isDataMapping(emptyObj)).toBe(false);
        expect(service.isDataMapping({'@id': '', '@type': [`${DELIM}DataMapping`]})).toBe(true);
    });
    it('should return the title of a property mapping', function() {
        expect(service.getPropMappingTitle('class', 'prop')).toEqual('class: prop');
    });
});
