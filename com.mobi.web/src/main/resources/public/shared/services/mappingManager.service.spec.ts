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
import { HttpParams } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { configureTestSuite } from 'ng-bullet';
import { MockPipe, MockProvider } from 'ng-mocks';
import { of, throwError } from 'rxjs';

import {
    cleanStylesFromDOM,
    mockOntologyManager,
    mockUtil,
} from '../../../../../test/ts/Shared';
import { DATA, DELIM, MAPPINGS, RDFS } from '../../prefixes';
import { ProgressSpinnerService } from '../components/progress-spinner/services/progressSpinner.service';
import { JSONLDObject } from '../models/JSONLDObject.interface';
import { Mapping } from '../models/mapping.class';
import { MappingOntology } from '../models/mappingOntology.interface';
import { MappingOntologyInfo } from '../models/mappingOntologyInfo.interface';
import { CamelCasePipe } from '../pipes/camelCase.pipe';
import { SplitIRIPipe } from '../pipes/splitIRI.pipe';
import { HelperService } from './helper.service';
import { MappingManagerService } from './mappingManager.service';
import { OntologyManagerService } from './ontologyManager.service';

describe('Mapping Manager service', function() {
    let service: MappingManagerService;
    let progressSpinnerStub: jasmine.SpyObj<ProgressSpinnerService>;
    let utilStub;
    let ontologyManagerStub;
    let camelCaseStub: jasmine.SpyObj<CamelCasePipe>;
    let splitIRIStub: jasmine.SpyObj<SplitIRIPipe>;
    let httpMock: HttpTestingController;

    const error = 'Error Message';
    const recordId = 'http://mobi.com/records/test';
    const ontologyId = 'ontologyId';
    let mappingStub: jasmine.SpyObj<Mapping>;
    const emptyObj: JSONLDObject = {'@id': 'test'};
    const ontologyInfo: MappingOntologyInfo = {
        recordId: 'recordId',
        branchId: 'branchId',
        commitId: 'commitId'
    };
    const mappingOntology: MappingOntology = {
        recordId: ontologyInfo.recordId,
        id: ontologyId,
        entities: []
    };
   
    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [ HttpClientTestingModule ],
            providers: [
                MappingManagerService,
                HelperService,
                MockProvider(ProgressSpinnerService),
                {provide: CamelCasePipe, useClass: MockPipe(CamelCasePipe)},
                {provide: SplitIRIPipe, useClass: MockPipe(SplitIRIPipe)},
                { provide: OntologyManagerService, useClass: mockOntologyManager },
                { provide: 'utilService', useClass: mockUtil },
            ]
        });
    });

    beforeEach(function() {
        service = TestBed.get(MappingManagerService);
        ontologyManagerStub = TestBed.get(OntologyManagerService);
        utilStub = TestBed.get('utilService');
        progressSpinnerStub = TestBed.get(ProgressSpinnerService);
        camelCaseStub = TestBed.get(CamelCasePipe);
        splitIRIStub = TestBed.get(SplitIRIPipe);
        httpMock = TestBed.get(HttpTestingController);

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
        ontologyManagerStub.getEntity.and.returnValue(emptyObj);
        ontologyManagerStub.getOntologyIRI.and.returnValue('ontology');
    });

    afterEach(function() {
        cleanStylesFromDOM();
        service = null;
        ontologyManagerStub = null;
        utilStub = null;
        camelCaseStub = null;
        splitIRIStub = null;
        httpMock = null;
        mappingStub = null;
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
            this.url = service.prefix + '/' + encodeURIComponent(recordId);
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
            this.url = service.prefix + '/' + encodeURIComponent(recordId);
            spyOn(window, 'open');
        });
        it('provided format', function() {
            const params = new HttpParams({
                fromObject: {
                    format: 'turtle',
                }
            });
            service.downloadMapping(recordId, 'turtle');
            expect(window.open).toHaveBeenCalledWith(this.url + '?' + params.toString());
        });
        it('default format', function() {
            const params = new HttpParams({
                fromObject: {
                    format: 'jsonld',
                }
            });
            service.downloadMapping(recordId);
            expect(window.open).toHaveBeenCalledWith(this.url + '?' + params.toString());
        });
    });
    describe('should delete a mapping by id', function() {
        beforeEach(function() {
            this.url = service.prefix + '/' + encodeURIComponent(recordId);
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
                .subscribe(() => {}, () => fail('Observable should have succeeded'));
            const request = httpMock.expectOne({url: this.url, method: 'DELETE'});
            request.flush(200);
        });
    });
    it('should get the mapping IRI based on a title', function() {
        camelCaseStub.transform.and.returnValue('title');
        expect(service.getMappingId('title')).toEqual(MAPPINGS + 'title');
        expect(camelCaseStub.transform).toHaveBeenCalledWith('title', 'class');
    });
    describe('should add a class mapping to a mapping', function() {
        beforeEach(function() {
            mappingStub.addClassMapping.and.returnValue(emptyObj);
        });
        it('unless the class does not exist in the passed ontology', function() {
            ontologyManagerStub.getEntity.and.returnValue(undefined);
            expect(service.addClass(mappingStub, [emptyObj], 'classid')).toBeUndefined();
            expect(ontologyManagerStub.getEntity).toHaveBeenCalledWith([[emptyObj]], 'classid');
            expect(mappingStub.addClassMapping).not.toHaveBeenCalled();
        });
        it('if the class exists in the passed ontology', function() {
            splitIRIStub.transform.and.returnValue({begin: '', then: '', end: 'end'});
            ontologyManagerStub.getOntologyIRI.and.returnValue('ontologyIRI');
            expect(service.addClass(mappingStub, [emptyObj], 'classid')).toEqual(emptyObj);
            expect(ontologyManagerStub.getEntity).toHaveBeenCalledWith([[emptyObj]], 'classid');
            expect(mappingStub.addClassMapping).toHaveBeenCalledWith('classid', DATA + 'end/end/');
        });
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
            expect(classMapping[DELIM + 'hasPrefix']).toEqual([{'@value': 'test/'}]);
            expect(classMapping[DELIM + 'localName']).toEqual([{'@value': '${0}'}]);
        });
    });
    describe('should add a data property mapping to a mapping', function() {
        beforeEach(function() {
            mappingStub.hasClassMapping.and.returnValue(true);
            mappingStub.addDataPropMapping.and.returnValue(emptyObj);
        });
        it('unless the parent class mapping does not exist in the mapping', function() {
            mappingStub.hasClassMapping.and.returnValue(false);
            expect(service.addDataProp(mappingStub, [emptyObj], 'classMappingId', 'propId', 0, 'datatype', 'language')).toBeUndefined();
            expect(mappingStub.addDataPropMapping).not.toHaveBeenCalled();
        });
        it('unless the property does not exist in the passed ontology', function() {
            ontologyManagerStub.getEntity.and.returnValue(undefined);
            expect(service.addDataProp(mappingStub, [emptyObj], 'classMappingId', 'propId', 0, 'datatype', 'language')).toBeUndefined();
            expect(mappingStub.addDataPropMapping).not.toHaveBeenCalled();
        });
        it('unless the IRI passed is not for a data property and is not a supported annotation', function() {
            ontologyManagerStub.isDataTypeProperty.and.returnValue(false);
            expect(service.addDataProp(mappingStub, [emptyObj], 'classMappingId', 'propId', 0, 'datatype', 'language')).toBeUndefined();
            expect(mappingStub.addDataPropMapping).not.toHaveBeenCalled();
        });
        it('unless the IRI passed is not a data property or an annotation', function() {
            ontologyManagerStub.isDataTypeProperty.and.returnValue(false);
            ontologyManagerStub.isAnnotation.and.returnValue(false);
            expect(service.addDataProp(mappingStub, [emptyObj], 'classMappingId', 'propId', 0, 'datatype', 'language')).toBeUndefined();
            expect(mappingStub.addDataPropMapping).not.toHaveBeenCalled();
        });
        it('if the data property exists in the passed ontology', function() {
            ontologyManagerStub.isDataTypeProperty.and.returnValue(true);
            expect(service.addDataProp(mappingStub, [emptyObj], 'classMappingId', 'propId', 0, 'datatype', 'language')).toEqual(emptyObj);
            expect(mappingStub.addDataPropMapping).toHaveBeenCalledWith('propId', 0, 'classMappingId', 'datatype', 'language');
        });
        it('if the property is a supported default annotation', function() {
            ontologyManagerStub.isDataTypeProperty.and.returnValue(false);
            service.annotationProperties = ['propId'];
            ontologyManagerStub.getEntity.and.returnValue(undefined);
            expect(service.addDataProp(mappingStub, [emptyObj], 'classMappingId', 'propId', 0, 'datatype', 'language')).toEqual(emptyObj);
            expect(mappingStub.addDataPropMapping).toHaveBeenCalledWith('propId', 0, 'classMappingId', 'datatype', 'language');
        });
        it('if the property is a supported annotation from the ontology', function() {
            ontologyManagerStub.isDataTypeProperty.and.returnValue(false);
            ontologyManagerStub.isAnnotation.and.returnValue(true);
            expect(service.addDataProp(mappingStub, [emptyObj], 'classMappingId', 'propId', 0, 'datatype', 'language')).toEqual(emptyObj);
            expect(mappingStub.addDataPropMapping).toHaveBeenCalledWith('propId', 0, 'classMappingId', 'datatype', 'language');
        });
    });
    describe('should add an object property mapping to a mapping', function() {
        beforeEach(function() {
            mappingStub.hasClassMapping.and.returnValue(true);
            const rangeClassMapping = Object.assign({}, emptyObj);
            rangeClassMapping[DELIM + 'mapsTo'] = [{'@id': 'range'}];
            mappingStub.getClassMapping.and.returnValue(rangeClassMapping);
            mappingStub.addObjectPropMapping.and.returnValue(emptyObj);
            ontologyManagerStub.getEntity.and.returnValue(emptyObj);
            ontologyManagerStub.isObjectProperty.and.returnValue(true);
        });
        it('unless the parent class mapping does not exist in the mapping', function() {
            mappingStub.hasClassMapping.and.returnValue(false);
            expect(service.addObjectProp(mappingStub, [emptyObj], 'classMappingId', 'propId', 'rangeClassMappingId')).toBeUndefined();
            expect(mappingStub.addObjectPropMapping).not.toHaveBeenCalled();
        });
        it('unless the range class mapping does not exist in the mapping', function() {
            mappingStub.getClassMapping.and.returnValue(undefined);
            expect(service.addObjectProp(mappingStub, [emptyObj], 'classMappingId', 'propId', 'rangeClassMappingId')).toBeUndefined();
            expect(mappingStub.addObjectPropMapping).not.toHaveBeenCalled();
        });
        it('unless the property does not exist in the passed ontology', function() {
            ontologyManagerStub.getEntity.and.returnValue(undefined);
            expect(service.addObjectProp(mappingStub, [emptyObj], 'classMappingId', 'propId', 'rangeClassMappingId')).toBeUndefined();
            expect(mappingStub.addObjectPropMapping).not.toHaveBeenCalled();
        });
        it('unless the IRI is not for an object property', function() {
            ontologyManagerStub.isObjectProperty.and.returnValue(false);
            expect(service.addObjectProp(mappingStub, [emptyObj], 'classMappingId', 'propId', 'rangeClassMappingId')).toBeUndefined();
            expect(mappingStub.addObjectPropMapping).not.toHaveBeenCalled();
        });
        it('unless the range of the object property does not matched the range class mapping', function() {
            utilStub.getPropertyId.and.returnValue('error');
            expect(service.addObjectProp(mappingStub, [emptyObj], 'classMappingId', 'propId', 'rangeClassMappingId')).toBeUndefined();
            expect(utilStub.getPropertyId).toHaveBeenCalledWith(emptyObj, RDFS + 'range');
            expect(mappingStub.addObjectPropMapping).not.toHaveBeenCalled();
        });
        it('if all conditions pass', function() {
            utilStub.getPropertyId.and.returnValue('range');
            expect(service.addObjectProp(mappingStub, [emptyObj], 'classMappingId', 'propId', 'rangeClassMappingId')).toEqual(emptyObj);
            expect(utilStub.getPropertyId).toHaveBeenCalledWith(emptyObj, RDFS + 'range');
            expect(mappingStub.addObjectPropMapping).toHaveBeenCalledWith('propId', 'classMappingId', 'rangeClassMappingId');
        });
    });
    describe('should get an ontology in the correct structure', function() {
        it('unless an error occurs', fakeAsync(function() {
            ontologyManagerStub.getOntology.and.returnValue(throwError(error));
            service.getOntology(ontologyInfo)
                .subscribe(() => fail('Promise should have rejected'), response => {
                    expect(response).toBe(error);
                });
            tick();
        }));
        it('successfully', fakeAsync(function() {
            ontologyManagerStub.getOntology.and.returnValue(of([]));
            ontologyManagerStub.getOntologyIRI.and.returnValue('ontology');
            service.getOntology(ontologyInfo)
                .subscribe((response: MappingOntology) => {
                    expect(response.id).toBe('ontology');
                    expect(response.recordId).toBe(ontologyInfo.recordId);
                    expect(response.entities).toEqual([]);
                }, () => fail('Observable should have rejected'));
            tick();
        }));
    });
    describe('should get the list of source ontologies from the imports closure of the specified ontology', function() {
        describe('if the ontology is open', function() {
            beforeEach(function() {
                ontologyManagerStub.list = [{ontologyId: ontologyId, recordId: ontologyInfo.recordId, branchId: ontologyInfo.branchId, commitId: ontologyInfo.commitId, ontology: []}];
                spyOn(service, 'getOntology').and.returnValue(of(mappingOntology));
            });
            it('unless an error occurs', fakeAsync(function() {
                ontologyManagerStub.getImportedOntologies.and.returnValue(throwError(error));
                service.getSourceOntologies(ontologyInfo)
                    .subscribe(() => fail('The observable should have errored'), response => {
                        expect(ontologyManagerStub.getImportedOntologies).toHaveBeenCalledWith(ontologyInfo.recordId, ontologyInfo.branchId, ontologyInfo.commitId);
                        expect(response).toBe(error);
                    });
                tick();
            }));
            it('successfully', fakeAsync(function() {
                ontologyManagerStub.getImportedOntologies.and.returnValue(of([{ontologyId: 'imported', ontology: []}]));
                service.getSourceOntologies(ontologyInfo)
                    .subscribe(response => {
                        expect(ontologyManagerStub.getImportedOntologies).toHaveBeenCalledWith(ontologyInfo.recordId, ontologyInfo.branchId, ontologyInfo.commitId);
                        expect(response).toContain(mappingOntology);
                        expect(response).toContain({
                            id: 'imported',
                            entities: []
                        });
                    }, () => fail('Observable should have rejected'));
                tick();
            }));
        });
        describe('if the ontology is not open', function() {
            beforeEach(function() {
                ontologyManagerStub.getImportedOntologies.and.returnValue(of([{ontologyId: 'imported', ontology: []}]));
            });
            it('unless an error occurs', fakeAsync(function() {
                spyOn(service, 'getOntology').and.returnValue(throwError(error));
                service.getSourceOntologies(ontologyInfo)
                    .subscribe(() => fail('The promise should have rejected'), response => {
                        expect(service.getOntology).toHaveBeenCalledWith(ontologyInfo);
                        expect(ontologyManagerStub.getImportedOntologies).not.toHaveBeenCalled();
                        expect(response).toBe(error);
                    });
                tick();
            }));
            it('successfully', fakeAsync(function() {
                spyOn(service, 'getOntology').and.returnValue(of(mappingOntology));
                service.getSourceOntologies(ontologyInfo)
                    .subscribe(response => {
                        expect(service.getOntology).toHaveBeenCalledWith(ontologyInfo);
                        expect(ontologyManagerStub.getImportedOntologies).toHaveBeenCalledWith(ontologyInfo.recordId, ontologyInfo.branchId, ontologyInfo.commitId);
                        expect(response).toContain(mappingOntology);
                        expect(response).toContain({
                            id: 'imported',
                            entities: []
                        });
                    }, () => fail('Observable should have rejected'));
                tick();
            }));
        });
    });
    it('should find the source ontology with a certain class', function() {
        ontologyManagerStub.getClasses.and.returnValue([{'@id': 'class'}]);
        expect(service.findSourceOntologyWithClass('class', [mappingOntology])).toEqual(mappingOntology);

        ontologyManagerStub.getClasses.and.returnValue([]);
        expect(service.findSourceOntologyWithClass('class', [mappingOntology])).toBeUndefined();
    });
    it('should find the source ontology with a certain property', function() {
        ontologyManagerStub.getDataTypeProperties.and.returnValue([{'@id': 'prop'}]);
        expect(service.findSourceOntologyWithProp('prop', [mappingOntology])).toEqual(mappingOntology);

        ontologyManagerStub.getDataTypeProperties.and.returnValue([]);
        ontologyManagerStub.getObjectProperties.and.returnValue([{'@id': 'prop'}]);
        expect(service.findSourceOntologyWithProp('prop', [mappingOntology])).toEqual(mappingOntology);

        ontologyManagerStub.getObjectProperties.and.returnValue([]);
        ontologyManagerStub.getAnnotations.and.returnValue([{'@id': 'prop'}]);
        expect(service.findSourceOntologyWithProp('prop', [mappingOntology])).toEqual(mappingOntology);

        ontologyManagerStub.getAnnotations.and.returnValue([]);
        expect(service.findSourceOntologyWithProp('prop', [mappingOntology])).toBeUndefined();
    });
    it('should test whether a mapping and its source ontologies are compatible', function() {
        const spy = spyOn(service, 'findIncompatibleMappings').and.returnValue([]);
        expect(service.areCompatible(mappingStub, [])).toBe(true);

        spy.and.returnValue([emptyObj]);
        expect(service.areCompatible(mappingStub, [])).toBe(false);
    });
    describe('should collect incompatible entities within a mapping based on its source ontologies when', function() {
        const classId = 'classId';
        const propId = 'propId';
        beforeEach(function() {
            this.classMapping = {
                '@id': 'classMapping',
                [DELIM + 'mapsTo']: [{'@id': classId}]
            };
            this.dataPropMapping = {
                '@id': 'dataMapping',
                [DELIM + 'hasProperty']: [{'@id': propId}]
            };
            this.objectPropMapping = {
                '@id': 'objectMapping',
                [DELIM + 'hasProperty']: [{'@id': propId}]
            };
            this.withClassSpy = spyOn(service, 'findSourceOntologyWithClass');
            this.withPropSpy = spyOn(service, 'findSourceOntologyWithProp');
            mappingStub.getAllClassMappings.and.returnValue([]);
            mappingStub.getAllObjectMappings.and.returnValue([]);
            mappingStub.getAllDataMappings.and.returnValue([]);
        });
        it('class does not exist', function() {
            mappingStub.getAllClassMappings.and.returnValue([this.classMapping]);
            expect(service.findIncompatibleMappings(mappingStub, [mappingOntology])).toEqual([this.classMapping]);
            expect(service.findSourceOntologyWithClass).toHaveBeenCalledWith(classId, [mappingOntology]);
        });
        it('class is deprecated', function() {
            mappingStub.getAllClassMappings.and.returnValue([this.classMapping]);
            this.withClassSpy.and.returnValue(mappingOntology);
            ontologyManagerStub.isDeprecated.and.returnValue(true);
            expect(service.findIncompatibleMappings(mappingStub, [mappingOntology])).toEqual([this.classMapping]);
            expect(service.findSourceOntologyWithClass).toHaveBeenCalledWith(classId, [mappingOntology]);
            expect(ontologyManagerStub.getEntity).toHaveBeenCalledWith([[]], classId);
            expect(ontologyManagerStub.isDeprecated).toHaveBeenCalledWith(emptyObj);
        });
        it('data property does not exist and is not an annotation property', function() {
            mappingStub.getAllDataMappings.and.returnValue([this.dataPropMapping]);
            expect(service.findIncompatibleMappings(mappingStub, [mappingOntology])).toEqual([this.dataPropMapping]);
            expect(service.findSourceOntologyWithProp).toHaveBeenCalledWith(propId, [mappingOntology]);
        });
        it('data property is an annotation property', function() {
            mappingStub.getAllDataMappings.and.returnValue([this.dataPropMapping]);
            service.annotationProperties = [propId];
            expect(service.findIncompatibleMappings(mappingStub, [mappingOntology])).toEqual([]);
            expect(service.findSourceOntologyWithProp).toHaveBeenCalledWith(propId, [mappingOntology]);
        });
        it('data property is deprecated', function() {
            mappingStub.getAllDataMappings.and.returnValue([this.dataPropMapping]);
            this.withPropSpy.and.returnValue(mappingOntology);
            ontologyManagerStub.isDeprecated.and.returnValue(true);
            expect(service.findIncompatibleMappings(mappingStub, [mappingOntology])).toEqual([this.dataPropMapping]);
            expect(service.findSourceOntologyWithProp).toHaveBeenCalledWith(propId, [mappingOntology]);
            expect(ontologyManagerStub.getEntity).toHaveBeenCalledWith([[]], propId);
            expect(ontologyManagerStub.isDeprecated).toHaveBeenCalledWith(emptyObj);
        });
        it('data property is not a data property or annotation property', function() {
            mappingStub.getAllDataMappings.and.returnValue([this.dataPropMapping]);
            this.withPropSpy.and.returnValue(mappingOntology);
            ontologyManagerStub.isDataTypeProperty.and.returnValue(false);
            ontologyManagerStub.isAnnotation.and.returnValue(false);
            expect(service.findIncompatibleMappings(mappingStub, [mappingOntology])).toEqual([this.dataPropMapping]);
            expect(service.findSourceOntologyWithProp).toHaveBeenCalledWith(propId, [mappingOntology]);
            expect(ontologyManagerStub.getEntity).toHaveBeenCalledWith([[]], propId);
            expect(ontologyManagerStub.isDeprecated).toHaveBeenCalledWith(emptyObj);
            expect(ontologyManagerStub.isDataTypeProperty).toHaveBeenCalledWith(emptyObj);
            expect(ontologyManagerStub.isAnnotation).toHaveBeenCalledWith(emptyObj);
        });
        it('data property is not a data property but is an annotation property', function() {
            mappingStub.getAllDataMappings.and.returnValue([this.dataPropMapping]);
            this.withPropSpy.and.returnValue(mappingOntology);
            ontologyManagerStub.isDataTypeProperty.and.returnValue(false);
            ontologyManagerStub.isAnnotation.and.returnValue(true);
            expect(service.findIncompatibleMappings(mappingStub, [mappingOntology])).toEqual([]);
            expect(service.findSourceOntologyWithProp).toHaveBeenCalledWith(propId, [mappingOntology]);
            expect(ontologyManagerStub.getEntity).toHaveBeenCalledWith([[]], propId);
            expect(ontologyManagerStub.isDeprecated).toHaveBeenCalledWith(emptyObj);
            expect(ontologyManagerStub.isDataTypeProperty).toHaveBeenCalledWith(emptyObj);
            expect(ontologyManagerStub.isAnnotation).toHaveBeenCalledWith(emptyObj);
        });
        it('object property does not exist', function() {
            mappingStub.getAllObjectMappings.and.returnValue([this.objectPropMapping]);
            expect(service.findIncompatibleMappings(mappingStub, [mappingOntology])).toEqual([this.objectPropMapping]);
            expect(service.findSourceOntologyWithProp).toHaveBeenCalledWith(propId, [mappingOntology]);
        });
        it('object property is deprecated', function() {
            mappingStub.getAllObjectMappings.and.returnValue([this.objectPropMapping]);
            this.withPropSpy.and.returnValue(mappingOntology);
            ontologyManagerStub.isDeprecated.and.returnValue(true);
            expect(service.findIncompatibleMappings(mappingStub, [mappingOntology])).toEqual([this.objectPropMapping]);
            expect(service.findSourceOntologyWithProp).toHaveBeenCalledWith(propId, [mappingOntology]);
            expect(ontologyManagerStub.getEntity).toHaveBeenCalledWith([[]], propId);
            expect(ontologyManagerStub.isDeprecated).toHaveBeenCalledWith(emptyObj);
        });
        it('object property is not a object property', function() {
            mappingStub.getAllObjectMappings.and.returnValue([this.objectPropMapping]);
            this.withPropSpy.and.returnValue(mappingOntology);
            ontologyManagerStub.isObjectProperty.and.returnValue(false);
            expect(service.findIncompatibleMappings(mappingStub, [mappingOntology])).toEqual([this.objectPropMapping]);
            expect(service.findSourceOntologyWithProp).toHaveBeenCalledWith(propId, [mappingOntology]);
            expect(ontologyManagerStub.getEntity).toHaveBeenCalledWith([[]], propId);
            expect(ontologyManagerStub.isDeprecated).toHaveBeenCalledWith(emptyObj);
            expect(ontologyManagerStub.isObjectProperty).toHaveBeenCalledWith(emptyObj);
        });
        it('object property range class is not the same', function() {
            mappingStub.getAllObjectMappings.and.returnValue([this.objectPropMapping]);
            this.withPropSpy.and.returnValue(mappingOntology);
            ontologyManagerStub.isObjectProperty.and.returnValue(true);
            mappingStub.getClassIdByMappingId.and.returnValue('rangeClassId');
            expect(service.findIncompatibleMappings(mappingStub, [mappingOntology])).toEqual([this.objectPropMapping]);
        });
        it('object property range is incompatible', function() {
            mappingStub.getAllClassMappings.and.returnValue([this.classMapping]);
            mappingStub.getAllObjectMappings.and.returnValue([this.objectPropMapping]);
            this.withPropSpy.and.returnValue(mappingOntology);
            ontologyManagerStub.isObjectProperty.and.returnValue(true);
            mappingStub.getClassIdByMappingId.and.returnValue(classId);
            utilStub.getPropertyId.and.returnValue(classId);
            expect(service.findIncompatibleMappings(mappingStub, [mappingOntology])).toEqual([this.classMapping, this.objectPropMapping]);
        });
    });
    it('should test whether a mapping entity is a class mapping', function() {
        expect(service.isClassMapping(emptyObj)).toBe(false);
        expect(service.isClassMapping({'@id': '', '@type': [DELIM + 'ClassMapping']})).toBe(true);
    });
    it('should test whether a mapping entity is an object mapping', function() {
        expect(service.isObjectMapping(emptyObj)).toBe(false);
        expect(service.isObjectMapping({'@id': '', '@type': [DELIM + 'ObjectMapping']})).toBe(true);
    });
    it('should test whether a mapping entity is a data mapping', function() {
        expect(service.isDataMapping(emptyObj)).toBe(false);
        expect(service.isDataMapping({'@id': '', '@type': [DELIM + 'DataMapping']})).toBe(true);
    });
    it('should return the title of a property mapping', function() {
        expect(service.getPropMappingTitle('class', 'prop')).toEqual('class: prop');
    });
});
