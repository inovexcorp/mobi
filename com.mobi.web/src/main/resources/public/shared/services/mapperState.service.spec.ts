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
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { get, has, merge } from 'lodash';
import { configureTestSuite } from 'ng-bullet';
import { MockPipe, MockProvider } from 'ng-mocks';
import { of, throwError } from 'rxjs';

import {
    cleanStylesFromDOM,
} from '../../../../../test/ts/Shared';
import { DCTERMS, DELIM } from '../../prefixes';
import { Difference } from '../models/difference.class';
import { JSONLDObject } from '../models/JSONLDObject.interface';
import { Mapping } from '../models/mapping.class';
import { MappingClass } from '../models/mappingClass.interface';
import { MappingOntology } from '../models/mappingOntology.interface';
import { MappingProperty } from '../models/mappingProperty.interface';
import { MappingRecord } from '../models/mappingRecord.interface';
import { SplitIRIPipe } from '../pipes/splitIRI.pipe';
import { CatalogManagerService } from './catalogManager.service';
import { DelimitedManagerService } from './delimitedManager.service';
import { MappingManagerService } from './mappingManager.service';
import { OntologyManagerService } from './ontologyManager.service';
import { UtilService } from './util.service';
import { MapperStateService } from './mapperState.service';

describe('Mapper State service', function() {
    let service: MapperStateService;
    let mappingManagerStub: jasmine.SpyObj<MappingManagerService>;
    let catalogManagerStub: jasmine.SpyObj<CatalogManagerService>;
    let delimitedManagerStub: jasmine.SpyObj<DelimitedManagerService>;
    let splitIRIStub: jasmine.SpyObj<SplitIRIPipe>;
    let ontologyManagerStub: jasmine.SpyObj<OntologyManagerService>;
    let utilStub: jasmine.SpyObj<UtilService>;

    let mappingStub: jasmine.SpyObj<Mapping>;
    const error = 'Error message';
    const catalogId = 'catalogId';
    const ontologyId = 'ontologyId';
    const recordId = 'recordId';
    const record: MappingRecord = {
        id: recordId,
        title: '',
        description: '',
        modified: '',
        branch: '',
        keywords: []
    };
    const mappingProperty: MappingProperty = {
        name: 'mappingProperty',
        isDeprecated: false,
        isObjectProperty: false,
        ontologyId,
        propObj: {'@id': 'propObj'}
    };
    const mappingClass: MappingClass = {
        ontologyId,
        classObj: {'@id': 'class'},
        name: 'mappingClass',
        isDeprecated: false
    };
    const splitIRI = {
        begin: 'begin',
        then: '/',
        end: 'end'
    };
    const mappingOntology: MappingOntology = {
        id: ontologyId,
        entities: []
    };

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            providers: [
                MapperStateService,
                MockProvider(CatalogManagerService),
                MockProvider(MappingManagerService),
                MockProvider(DelimitedManagerService),
                { provide: SplitIRIPipe, useClass: MockPipe(SplitIRIPipe) },
                MockProvider(OntologyManagerService),
                MockProvider(UtilService),
            ]
        });
    });

    beforeEach(function() {
        service = TestBed.get(MapperStateService);
        catalogManagerStub = TestBed.get(CatalogManagerService);
        mappingManagerStub = TestBed.get(MappingManagerService);
        delimitedManagerStub = TestBed.get(DelimitedManagerService);
        ontologyManagerStub = TestBed.get(OntologyManagerService);
        utilStub = TestBed.get(UtilService);
        splitIRIStub = TestBed.get(SplitIRIPipe);

        catalogManagerStub.localCatalog = {'@id': catalogId};
        mappingStub = jasmine.createSpyObj('Mapping', [
            'getJsonld',
            'getAllDataMappings',
            'getClassIdByMappingId',
            'getClassMappingsByClassId',
            'getPropMappingsByClass',
            'getPropsLinkingToClass',
            'findClassWithObjectMapping',
            'findClassWithDataMapping',
            'removeClassMapping',
            'removePropMapping',
        ]);
        splitIRIStub.transform.and.returnValue(splitIRI);
        service.selected = {
            difference: new Difference(),
            mapping: mappingStub
        };
    });

    afterEach(function() {
        cleanStylesFromDOM();
        service = null;
        ontologyManagerStub = null;
        utilStub = null;
        mappingManagerStub = null;
        delimitedManagerStub = null;
        catalogManagerStub = null;
        mappingStub = null;
        splitIRIStub = null;
    });

    it('should initialize important variables', function() {
        service.initialize();
        expect(service.editMapping).toBe(false);
        expect(service.newMapping).toBe(false);
        expect(service.step).toBe(0);
        expect(service.editTabIndex).toEqual(0);
        expect(service.invalidProps).toEqual([]);
        expect(service.propsByClass).toEqual({});
        expect(service.availableClasses).toEqual([]);
        expect(service.selected).toBeUndefined();
        expect(service.sourceOntologies).toEqual([]);
    });
    it('should reset edit related variables', function() {
        service.resetEdit();
        expect(service.selectedClassMappingId).toBe('');
        expect(service.selectedPropMappingId).toBe('');
        expect(service.highlightIndexes).toEqual([]);
        expect(service.newProp).toBe(false);
    });
    it('should reset pagination related variables', function() {
        service.resetPagination();
        expect(service.paginationConfig.pageIndex).toBe(0);
        expect(service.paginationConfig.searchText).toBe('');
        expect(service.totalSize).toBe(0);
    });
    it('should set all variables for creating a new mapping', function() {
        spyOn(service, 'resetEdit');
        service.startCreateMapping();
        expect(service.editMapping).toBe(true);
        expect(service.newMapping).toBe(true);
        expect(service.sourceOntologies).toEqual([]);
        expect(service.resetEdit).toHaveBeenCalledWith();
        expect(service.propsByClass).toEqual({});
    });
    describe('should retrieve a MappingState for the provided record', function() {
        const mappingEntity: JSONLDObject = {
            '@id': 'mapping',
            '@type': [DELIM + 'Mapping'],
            [DELIM + 'sourceRecord']: [{'@id': ontologyId}],
            [DELIM + 'sourceBranch']: [{'@id': ''}],
            [DELIM + 'sourceCommit']: [{'@id': ''}],
        };
        it('unless getMapping fails', fakeAsync(function() {
            mappingManagerStub.getMapping.and.returnValue(throwError(error));
            service.getMappingState(record)
                .subscribe(() => fail('Observable should have rejected'), response => {
                    expect(response).toEqual(error);
                    expect(mappingManagerStub.getMapping).toHaveBeenCalledWith(record.id);
                });
            tick();
        }));
        it('unless getRecord fails', fakeAsync(function() {
            mappingManagerStub.getMapping.and.returnValue(of([mappingEntity]));
            catalogManagerStub.getRecord.and.returnValue(throwError(error));
            service.getMappingState(record)
                .subscribe(() => fail('Observable should have rejected'), response => {
                    expect(response).toEqual(error);
                    expect(mappingManagerStub.getMapping).toHaveBeenCalledWith(record.id);
                    expect(catalogManagerStub.getRecord).toHaveBeenCalledWith(ontologyId, catalogId);
                });
            tick();
        }));
        it('successfully', fakeAsync(function() {
            const ontology = {'@id': 'ontologyId'};
            mappingManagerStub.getMapping.and.returnValue(of([mappingEntity]));
            catalogManagerStub.getRecord.and.returnValue(of([ontology]));
            service.getMappingState(record)
                .subscribe(response => {
                    expect(response.mapping).toEqual(jasmine.any(Mapping));
                    expect(response.record).toEqual(record);
                    expect(response.difference).toEqual(jasmine.any(Difference));
                    expect(response.ontology).toEqual(ontology);
                    expect(mappingManagerStub.getMapping).toHaveBeenCalledWith(record.id);
                    expect(catalogManagerStub.getRecord).toHaveBeenCalledWith(ontologyId, catalogId);
                }, () => fail('Observable should have resolved'));
            tick();
        }));
    });
    it('should test whether the mapping has been changed', function() {
        expect(service.isMappingChanged()).toEqual(false);
        service.selected.difference.additions = [{'@id': ''}];
        expect(service.isMappingChanged()).toEqual(true);
        service.selected.difference.deletions = [{'@id': ''}];
        expect(service.isMappingChanged()).toEqual(true);
        service.selected.difference.additions = [];
        expect(service.isMappingChanged()).toEqual(true);
    });
    describe('should save the current mapping', function() {
        beforeEach(function() {
            mappingStub.getJsonld.and.returnValue([]);
        });
        describe('if it is a new mapping', function() {
            beforeEach(function() {
                service.newMapping = true;
                service.selected.config = {
                    title: 'title'
                };
            });
            it('unless an error occurs', fakeAsync(function() {
                mappingManagerStub.upload.and.returnValue(throwError(error));
                service.saveMapping()
                    .subscribe(() => fail('Observable should have rejected'), response => {
                        expect(response).toEqual(error);
                        expect(mappingManagerStub.upload).toHaveBeenCalledWith(service.selected.config, []);
                        expect(catalogManagerStub.updateInProgressCommit).not.toHaveBeenCalled();
                    });
                tick();
            }));
            it('successfully', fakeAsync(function() {
                mappingManagerStub.upload.and.returnValue(of('id'));
                service.saveMapping()
                    .subscribe(response => {
                        expect(response).toEqual('id');
                        expect(mappingManagerStub.upload).toHaveBeenCalledWith(service.selected.config, []);
                        expect(catalogManagerStub.updateInProgressCommit).not.toHaveBeenCalled();
                    }, () => fail('Observable should have resolved'));
                tick();
            }));
        });
        describe('if it is an existing mapping', function() {
            beforeEach(function() {
                service.newMapping = false;
                service.selected.record = record;
            });
            describe('and updateInProgressCommit resolves', function() {
                beforeEach(function() {
                    catalogManagerStub.updateInProgressCommit.and.returnValue(of(null));
                });
                it('and createBranchCommit resolves', fakeAsync(function() {
                    utilStub.getDctermsValue.and.callFake(obj => obj.title);
                    catalogManagerStub.createBranchCommit.and.returnValue(of(null));
                    const add1 = {'@id': 'add1', title: 'Class'};
                    const add2 = {'@id': 'add2', title: 'Prop 1'};
                    const add3 = {'@id': 'add3'};
                    const del1 = {'@id': 'del1', title: 'Prop 2'};
                    service.selected.difference.additions = [add1, add2, add3];
                    service.selected.difference.deletions = [del1, add2];
                    mappingStub.getJsonld.and.returnValue([add1, add2, add3]);
                    utilStub.getBeautifulIRI.and.returnValue('iri');
                    service.saveMapping()
                        .subscribe(response => {
                            expect(response).toEqual(service.selected.record.id);
                        }, () => fail('Observable should have resolved'));
                    tick();
                    expect(mappingManagerStub.upload).not.toHaveBeenCalled();
                    expect(catalogManagerStub.updateInProgressCommit).toHaveBeenCalledWith(service.selected.record.id, catalogId, service.selected.difference);
                    expect(utilStub.getDctermsValue).toHaveBeenCalledWith(add1, 'title');
                    expect(utilStub.getDctermsValue).toHaveBeenCalledWith(add2, 'title');
                    expect(utilStub.getDctermsValue).toHaveBeenCalledWith(add3, 'title');
                    expect(utilStub.getBeautifulIRI).toHaveBeenCalledWith(add3['@id']);
                    expect(utilStub.getDctermsValue).toHaveBeenCalledWith(del1, 'title');
                    expect(catalogManagerStub.createBranchCommit).toHaveBeenCalledWith(service.selected.record.branch, service.selected.record.id, catalogId, 'Changed Class, Prop 1, iri, Prop 2');
                }));
                it('and createBranchCommit rejects', fakeAsync(function() {
                    catalogManagerStub.createBranchCommit.and.returnValue(throwError(error));
                    service.saveMapping()
                        .subscribe(() => fail('Observable should have rejected'), response => {
                            expect(response).toEqual(error);
                        });
                    tick();
                    expect(mappingManagerStub.upload).not.toHaveBeenCalled();
                    expect(catalogManagerStub.updateInProgressCommit).toHaveBeenCalledWith(service.selected.record.id, catalogId, service.selected.difference);
                    expect(catalogManagerStub.createBranchCommit).toHaveBeenCalledWith(service.selected.record.branch, service.selected.record.id, catalogId, jasmine.any(String));
                }));
            });
            it('and updateInProgressCommit rejects', fakeAsync(function() {
                catalogManagerStub.updateInProgressCommit.and.returnValue(throwError(error));
                service.saveMapping()
                    .subscribe(() => fail('Observable should have rejected'), response => {
                        expect(response).toEqual(error);
                    });
                tick();
                expect(mappingManagerStub.upload).not.toHaveBeenCalled();
                expect(catalogManagerStub.updateInProgressCommit).toHaveBeenCalledWith(service.selected.record.id, catalogId, service.selected.difference);
                expect(catalogManagerStub.createBranchCommit).not.toHaveBeenCalled();
            }));
        });
    });
    describe('should retrieve and set the master branch of the current mapping record', function() {
        beforeEach(function() {
            service.selected.record = record;
        });
        it('if getRecordMasterBranch resolves', fakeAsync(function() {
            const branch = {'@id': 'branchId'};
            catalogManagerStub.getRecordMasterBranch.and.returnValue(of(branch));
            service.setMasterBranch().subscribe(response => {
                expect(response).toBeNull();
                expect(service.selected.branch).toEqual(branch);
            }, () => fail('Observable should have rejected'));
            tick();
        }));
        it('unless getRecordMasterBranch rejects', fakeAsync(function() {
            catalogManagerStub.getRecordMasterBranch.and.returnValue(throwError(error));
            service.setMasterBranch().subscribe(() => fail('Observable should have rejected'), response => {
                expect(response).toEqual(error);
                expect(service.selected.branch).toBeUndefined();
            });
            tick();
        }));
    });
    it('should set the list of invalid property mappings', function() {
        delimitedManagerStub.dataRows = [['']];
        const invalidProp: JSONLDObject = {
            '@id': 'invalid',
            [DELIM + 'columnIndex']: '1'
        };
        const validProp: JSONLDObject = {
            '@id': 'valid',
            [DELIM + 'columnIndex']: '0'
        };
        const classMapping: JSONLDObject = {
            '@id': 'classMapping'
        };
        utilStub.getPropertyValue.and.callFake((obj, prop) => obj[prop]);
        utilStub.getDctermsValue.and.returnValue('Title');
        mappingStub.getAllDataMappings.and.returnValue([invalidProp, validProp]);
        mappingStub.findClassWithDataMapping.and.returnValue(classMapping);
        mappingManagerStub.getPropMappingTitle.and.returnValue('Prop Name');
        service.setInvalidProps();
        expect(service.invalidProps).toContain({
            id: invalidProp['@id'],
            index: 1,
            dataPropName: 'Prop Name'
        });
        expect(mappingStub.findClassWithDataMapping).toHaveBeenCalledWith(invalidProp['@id']);
        expect(mappingStub.findClassWithDataMapping).toHaveBeenCalledWith(validProp['@id']);
        expect(mappingManagerStub.getPropMappingTitle).toHaveBeenCalledWith('Title', 'Title');
        expect(utilStub.getDctermsValue).toHaveBeenCalledWith(classMapping, 'title');
        expect(utilStub.getDctermsValue).toHaveBeenCalledWith(invalidProp, 'title');
        expect(utilStub.getDctermsValue).toHaveBeenCalledWith(validProp, 'title');
        expect(utilStub.getPropertyValue).toHaveBeenCalledWith(invalidProp, DELIM + 'columnIndex');
        expect(utilStub.getPropertyValue).toHaveBeenCalledWith(validProp, DELIM + 'columnIndex');
    });
    it('should return a list of all the mapped column indexes', function() {
        const dataMappings = [{'@id': ''}];
        utilStub.getPropertyValue.and.returnValue('0');
        mappingStub.getAllDataMappings.and.returnValue(dataMappings);
        const results = service.getMappedColumns();
        expect(results.length).toBe(dataMappings.length);
        results.forEach((result, idx) => {
            expect(utilStub.getPropertyValue).toHaveBeenCalledWith(dataMappings[idx], DELIM + 'columnIndex');
            expect(result).toBe('0');
        });
    });
    it('should check whether a class has properties', function() {
        service.propsByClass = {'class': [mappingProperty]};
        expect(service.hasProps('class')).toBeTrue();
        expect(service.hasProps('class1')).toBeFalse();
    });
    it('should check whether a class mapping has properties', function() {
        spyOn(service, 'hasProps').and.returnValue(true);
        mappingStub.getClassIdByMappingId.and.returnValue('class');
        expect(service.hasPropsByClassMappingId('classMapping')).toEqual(true);
        expect(mappingStub.getClassIdByMappingId).toHaveBeenCalledWith('classMapping');
        expect(service.hasProps).toHaveBeenCalledWith('class');
    });
    it('should check whether a class\'s properties have been set', function() {
        service.propsByClass = {'class': []};
        expect(service.hasPropsSet('class')).toBeTrue();
        expect(service.hasPropsSet('class1')).toBeFalse();
    });
    it('should check whether a class mapping\'s properties have been set', function() {
        spyOn(service, 'hasPropsSet').and.returnValue(true);
        mappingStub.getClassIdByMappingId.and.returnValue('class');
        expect(service.hasPropsSetByClassMappingId('classMapping')).toEqual(true);
        expect(mappingStub.getClassIdByMappingId).toHaveBeenCalledWith('classMapping');
        expect(service.hasPropsSet).toHaveBeenCalledWith('class');
    });
    it('should remove the list of properties for a class', function() {
        service.propsByClass = {'clazz': []};
        service.removeProps('clazz');
        expect(service.propsByClass.clazz).toBeUndefined();
    });
    it('should remove the list of properties for a class mapping', function() {
        spyOn(service, 'removeProps');
        mappingStub.getClassIdByMappingId.and.returnValue('class');
        service.removePropsByClassMappingId('classMapping');
        expect(mappingStub.getClassIdByMappingId).toHaveBeenCalledWith('classMapping');
        expect(service.removeProps).toHaveBeenCalledWith('class');
    });
    it('should set the list of properties for a class', function() {
        service.sourceOntologies = [];
        const classId = 'class';
        const classProps: MappingProperty[] = [{
            name: '',
            isDeprecated: false,
            isObjectProperty: false,
            ontologyId,
            propObj: {'@id': 'prop1'}
        }];
        const noDomainProps: MappingProperty[] = [{
            name: '',
            isDeprecated: false,
            isObjectProperty: false,
            ontologyId,
            propObj: {'@id': 'prop2'}
        }];
        const annotationProps: MappingProperty[] = [{
            name: '',
            isDeprecated: false,
            isObjectProperty: false,
            ontologyId,
            propObj: {'@id': 'prop3'}
        }];
        mappingManagerStub.annotationProperties = ['test'];
        utilStub.getBeautifulIRI.and.returnValue('iri');
        spyOn(service, 'getClassProps').and.returnValue(classProps.concat(noDomainProps, annotationProps));

        service.setProps(classId);
        expect(service.getClassProps).toHaveBeenCalledWith([], classId);
        expect(service.propsByClass[classId]).toContain(classProps[0]);
        expect(service.propsByClass[classId]).toContain(noDomainProps[0]);
        expect(service.propsByClass[classId] ).toContain(annotationProps[0]);
        mappingManagerStub.annotationProperties.forEach(prop => {
            expect(service.propsByClass[classId]).toContain({
                ontologyId: splitIRI.begin,
                propObj: {'@id': prop},
                name: 'iri',
                isDeprecated: false,
                isObjectProperty: false
            });
        });
    });
    it('should set the list of properties for a class mapping', function() {
        spyOn(service, 'setProps');
        mappingStub.getClassIdByMappingId.and.returnValue('class');
        service.setPropsByClassMappingId('classMapping');
        expect(mappingStub.getClassIdByMappingId).toHaveBeenCalledWith('classMapping');
        expect(service.setProps).toHaveBeenCalledWith('class');
    });
    it('should get the list of properties for a class', function() {
        const props = [mappingProperty];
        service.propsByClass = {'class': props};
        expect(service.getProps('class')).toEqual(props);
        expect(service.getProps('class1')).toEqual([]);
    });
    it('should get the list of properties for a class mapping', function() {
        spyOn(service, 'getProps').and.returnValue([mappingProperty]);
        mappingStub.getClassIdByMappingId.and.returnValue('class');
        expect(service.getPropsByClassMappingId('classMapping')).toEqual([mappingProperty]);
        expect(mappingStub.getClassIdByMappingId).toHaveBeenCalledWith('classMapping');
        expect(service.getProps).toHaveBeenCalledWith('class');
    });
    it('should get the list of properties usable with a class', function() {
        const ontologies: MappingOntology[] = [
            {id: 'ontology1', entities: [{'@id': 'ontology1'}]},
            {id: 'ontology2', entities: [{'@id': 'ontology2'}]}
        ];
        const classProps = [{'@id': 'prop1'}, {'@id': 'prop2'}];
        const noDomainProps = [{'@id': 'prop3'}, {'@id': 'prop4'}];
        const annotationProps = [{'@id': 'prop5'}, {'@id': 'prop6'}];
        ontologyManagerStub.getClassProperties.and.callFake(entities => entities[0][0]['@id'] === 'ontology1' ? [classProps[0]] : [classProps[1]]);
        ontologyManagerStub.getNoDomainProperties.and.callFake(entities => entities[0][0]['@id'] === 'ontology1' ? noDomainProps : []);
        ontologyManagerStub.getAnnotations.and.callFake(entities => entities[0][0]['@id'] === 'ontology1' ? annotationProps : []);
        ontologyManagerStub.getEntityName.and.returnValue('name');
        ontologyManagerStub.isDeprecated.and.callFake(obj => obj['@id'] === 'prop2');
        ontologyManagerStub.isObjectProperty.and.callFake(obj => obj['@id'] === 'prop1' || obj['@id'] === 'prop4');
        ontologyManagerStub.isDataTypeProperty.and.callFake(obj => obj['@id'] === 'prop4');
        const result = service.getClassProps(ontologies, 'class');
        expect(ontologyManagerStub.getClassProperties.calls.count()).toBe(ontologies.length);
        expect(ontologyManagerStub.getNoDomainProperties.calls.count()).toBe(ontologies.length);
        expect(ontologyManagerStub.getAnnotations.calls.count()).toBe(ontologies.length);
        expect(result).toContain({
            ontologyId: ontologies[0].id,
            propObj: classProps[0],
            name: 'name',
            isDeprecated: false,
            isObjectProperty: true
        });
        expect(result).toContain({
            ontologyId: ontologies[1].id,
            propObj: classProps[1],
            name: 'name',
            isDeprecated: true,
            isObjectProperty: false
        });
        expect(result).toContain({
            ontologyId: ontologies[0].id,
            propObj: noDomainProps[0],
            name: 'name',
            isDeprecated: false,
            isObjectProperty: false
        });
        expect(result).not.toContain(jasmine.objectContaining({ propObj: noDomainProps[1] }));
        expect(result).toContain({
            ontologyId: ontologies[0].id,
            propObj: annotationProps[0],
            name: 'name',
            isDeprecated: false,
            isObjectProperty: false
        });
        expect(result).toContain({
            ontologyId: ontologies[0].id,
            propObj: annotationProps[1],
            name: 'name',
            isDeprecated: false,
            isObjectProperty: false
        });
    });
    it('should get the list of classes from a list of ontologies', function() {
        const ontologies: MappingOntology[] = [
            {id: 'ontology1', entities: [{'@id': 'ontology1'}]},
            {id: 'ontology2', entities: [{'@id': 'ontology2'}]}
        ];
        const classes1 = [{'@id': 'class1'}];
        const classes2 = [{'@id': 'class2'}];
        ontologyManagerStub.getClasses.and.callFake(entities => entities[0][0]['@id'] === 'ontology1' ? classes1 : classes2);
        ontologyManagerStub.getEntityName.and.returnValue('name');
        ontologyManagerStub.isDeprecated.and.callFake(obj => obj['@id'] === 'class2');
        const result = service.getClasses(ontologies);
        expect(result).toContain({
            ontologyId: ontologies[0].id,
            classObj: classes1[0],
            name: 'name',
            isDeprecated: false
        });
        expect(result).toContain({
            ontologyId: ontologies[1].id,
            classObj: classes2[0],
            name: 'name',
            isDeprecated: true
        });
    });
    describe('should reflect the change of a property value in the difference', function() {
        const entityId = 'entity';
        const propId = 'prop';
        const newValue = 'new';
        const originalValue = 'original';
        const otherValue = 'other';
        beforeEach(function() {
            utilStub.getPropertyValue.and.callFake((obj, propId) => get(obj, `['${propId}'][0]['@value']`, ''));
            utilStub.getPropertyId.and.callFake((obj, propId) => get(obj, `['${propId}'][0]['@id']`, ''));
        });
        it('unless the new value is the same as the original', function() {
            service.changeProp(entityId, propId, newValue, newValue);
            expect(service.selected.difference.additions).toEqual([]);
            expect(service.selected.difference.deletions).toEqual([]);
        });
        describe('if the new value is different', function() {
            describe('and the property has a @id value', function() {
                it('and the property was just set', function() {
                    const additionObj = {'@id': entityId};
                    additionObj[propId] = [{'@id': originalValue}];
                    (service.selected.difference.additions as JSONLDObject[]).push(additionObj);
                    service.changeProp(entityId, propId, newValue, originalValue, true);
                    expect(additionObj[propId]).toEqual([{'@id': newValue}]);
                    expect(service.selected.difference.deletions).toEqual([]);
                });
                it('and the entity was just opened', function() {
                    const expectedAddition = {'@id': entityId};
                    expectedAddition[propId] = [{'@id': newValue}];
                    const expectedDeletion = {'@id': entityId};
                    expectedDeletion[propId] = [{'@id': originalValue}];
                    service.changeProp(entityId, propId, newValue, originalValue, true);
                    expect(service.selected.difference.additions).toContain(expectedAddition);
                    expect(service.selected.difference.deletions).toContain(expectedDeletion);
                });
                it('and the entity was opened and the property already changed', function() {
                    const additionObj = {'@id': entityId};
                    additionObj[propId] = [{'@id': originalValue}];
                    (service.selected.difference.additions as JSONLDObject[]).push(additionObj);
                    const deletionObj = {'@id': entityId};
                    deletionObj[propId] = [{'@id': otherValue}];
                    (service.selected.difference.deletions as JSONLDObject[]).push(deletionObj);
                    service.changeProp(entityId, propId, newValue, originalValue, true);
                    expect(additionObj[propId]).toEqual([{'@id': newValue}]);
                    expect(deletionObj[propId]).toEqual([{'@id': otherValue}]);
                });
                it('and nothing has been set on the entity', function() {
                    const expectedAddition = {'@id': entityId};
                    expectedAddition[propId] = [{'@id': newValue}];
                    service.changeProp(entityId, propId, newValue, '', true);
                    expect(service.selected.difference.additions).toContain(expectedAddition);
                    expect(service.selected.difference.deletions).toEqual([]);
                });
                it('and the entity was opened and another property was altered', function() {
                    const additionObj = {'@id': entityId};
                    (service.selected.difference.additions as JSONLDObject[]).push(additionObj);
                    const deletionObj = {'@id': entityId};
                    (service.selected.difference.deletions as JSONLDObject[]).push(deletionObj);
                    service.changeProp(entityId, propId, newValue, originalValue, true);
                    expect(additionObj[propId]).toEqual([{'@id': newValue}]);
                    expect(deletionObj[propId]).toEqual([{'@id': originalValue}]);
                });
                it('and the property was not set and another property was changed', function() {
                    const additionObj = {'@id': entityId};
                    (service.selected.difference.additions as JSONLDObject[]).push(additionObj);
                    const deletionObj = {'@id': entityId};
                    (service.selected.difference.deletions as JSONLDObject[]).push(deletionObj);
                    service.changeProp(entityId, propId, newValue, '', true);
                    expect(additionObj[propId]).toEqual([{'@id': newValue}]);
                    expect(has(deletionObj, `['${propId}']`)).toEqual(false);
                });
                it('and the property was not set and another property was added', function() {
                    const additionObj = {'@id': entityId};
                    (service.selected.difference.additions as JSONLDObject[]).push(additionObj);
                    service.changeProp(entityId, propId, newValue, '', true);
                    expect(additionObj[propId]).toEqual([{'@id': newValue}]);
                    expect(service.selected.difference.deletions).toEqual([]);
                });
                it('and the property was changed back with no other changes', function() {
                    const additionObj = {'@id': entityId};
                    additionObj[propId] = [{'@id': originalValue}];
                    (service.selected.difference.additions as JSONLDObject[]).push(additionObj);
                    const deletionObj = {'@id': entityId};
                    deletionObj[propId] = [{'@id': newValue}];
                    (service.selected.difference.deletions as JSONLDObject[]).push(deletionObj);
                    service.changeProp(entityId, propId, newValue, originalValue, true);
                    expect(service.selected.difference.additions).toEqual([]);
                    expect(service.selected.difference.deletions).toEqual([]);
                });
                it('and the property was changed back with other changes', function() {
                    const expectedAddition = {'@id': entityId, test: true};
                    const additionObj = Object.assign({}, expectedAddition);
                    additionObj[propId] = [{'@id': originalValue}];
                    (service.selected.difference.additions as JSONLDObject[]).push(additionObj);
                    const expectedDeletion = {'@id': entityId, test: false};
                    const deletionObj = Object.assign({}, expectedDeletion);
                    deletionObj[propId] = [{'@id': newValue}];
                    (service.selected.difference.deletions as JSONLDObject[]).push(deletionObj);
                    service.changeProp(entityId, propId, newValue, originalValue, true);
                    expect(service.selected.difference.additions).toContain(expectedAddition);
                    expect(service.selected.difference.deletions).toContain(expectedDeletion);
                });
            });
            describe('and the property has a @value value', function() {
                it('and the property was just set', function() {
                    const additionObj = {'@id': entityId};
                    additionObj[propId] = [{'@value': originalValue}];
                    (service.selected.difference.additions as JSONLDObject[]).push(additionObj);
                    service.changeProp(entityId, propId, newValue, originalValue);
                    expect(additionObj[propId]).toEqual([{'@value': newValue}]);
                    expect(service.selected.difference.deletions).toEqual([]);
                });
                it('and the entity was just opened', function() {
                    const expectedAddition = {'@id': entityId};
                    expectedAddition[propId] = [{'@value': newValue}];
                    const expectedDeletion = {'@id': entityId};
                    expectedDeletion[propId] = [{'@value': originalValue}];
                    service.changeProp(entityId, propId, newValue, originalValue);
                    expect(service.selected.difference.additions).toContain(expectedAddition);
                    expect(service.selected.difference.deletions).toContain(expectedDeletion);
                });
                it('and the entity was opened and the property already changed', function() {
                    const additionObj = {'@id': entityId};
                    additionObj[propId] = [{'@value': originalValue}];
                    (service.selected.difference.additions as JSONLDObject[]).push(additionObj);
                    const deletionObj = {'@id': entityId};
                    deletionObj[propId] = [{'@value': otherValue}];
                    (service.selected.difference.deletions as JSONLDObject[]).push(deletionObj);
                    service.changeProp(entityId, propId, newValue, originalValue);
                    expect(additionObj[propId]).toEqual([{'@value': newValue}]);
                    expect(deletionObj[propId]).toEqual([{'@value': otherValue}]);
                });
                it('and nothing has been set on the entity', function() {
                    const expectedAddition = {'@id': entityId};
                    expectedAddition[propId] = [{'@value': newValue}];
                    service.changeProp(entityId, propId, newValue, '');
                    expect(service.selected.difference.additions).toContain(expectedAddition);
                    expect(service.selected.difference.deletions).toEqual([]);
                });
                it('and the entity was opened and another property was altered', function() {
                    const additionObj = {'@id': entityId};
                    (service.selected.difference.additions as JSONLDObject[]).push(additionObj);
                    const deletionObj = {'@id': entityId};
                    (service.selected.difference.deletions as JSONLDObject[]).push(deletionObj);
                    service.changeProp(entityId, propId, newValue, originalValue);
                    expect(additionObj[propId]).toEqual([{'@value': newValue}]);
                    expect(deletionObj[propId]).toEqual([{'@value': originalValue}]);
                });
                it('and the property was not set and another property was changed', function() {
                    const additionObj = {'@id': entityId};
                    (service.selected.difference.additions as JSONLDObject[]).push(additionObj);
                    const deletionObj = {'@id': entityId};
                    (service.selected.difference.deletions as JSONLDObject[]).push(deletionObj);
                    service.changeProp(entityId, propId, newValue, '');
                    expect(additionObj[propId]).toEqual([{'@value': newValue}]);
                    expect(has(deletionObj, `['${propId}']`)).toEqual(false);
                });
                it('and the property was not set and another property was added', function() {
                    const additionObj = {'@id': entityId};
                    (service.selected.difference.additions as JSONLDObject[]).push(additionObj);
                    service.changeProp(entityId, propId, newValue, '');
                    expect(additionObj[propId]).toEqual([{'@value': newValue}]);
                    expect(service.selected.difference.deletions).toEqual([]);
                });
                it('and the property was changed back with no other changes', function() {
                    const additionObj = {'@id': entityId};
                    additionObj[propId] = [{'@value': originalValue}];
                    (service.selected.difference.additions as JSONLDObject[]).push(additionObj);
                    const deletionObj = {'@id': entityId};
                    deletionObj[propId] = [{'@value': newValue}];
                    (service.selected.difference.deletions as JSONLDObject[]).push(deletionObj);
                    service.changeProp(entityId, propId, newValue, originalValue);
                    expect(service.selected.difference.additions).toEqual([]);
                    expect(service.selected.difference.deletions).toEqual([]);
                });
                it('and the property was changed back with other changes', function() {
                    const expectedAddition = {'@id': entityId, test: true};
                    const additionObj = Object.assign({}, expectedAddition);
                    additionObj[propId] = [{'@value': originalValue}];
                    (service.selected.difference.additions as JSONLDObject[]).push(additionObj);
                    const expectedDeletion = {'@id': entityId, test: false};
                    const deletionObj = Object.assign({}, expectedDeletion);
                    deletionObj[propId] = [{'@value': newValue}];
                    (service.selected.difference.deletions as JSONLDObject[]).push(deletionObj);
                    service.changeProp(entityId, propId, newValue, originalValue);
                    expect(service.selected.difference.additions).toContain(expectedAddition);
                    expect(service.selected.difference.deletions).toContain(expectedDeletion);
                });
            });
        });
    });
    describe('should add a class mapping with the correct title if', function() {
        const entityName = 'EntityName';
        const newClassMapping: JSONLDObject = {'@id': 'new'};
        beforeEach(function() {
            service.sourceOntologies = [mappingOntology];
            mappingManagerStub.addClass.and.returnValue(newClassMapping);
            ontologyManagerStub.getEntityName.and.returnValue(entityName);
            spyOn(service, 'changeProp');
        });
        it('it is the first of the class', function() {
            mappingStub.getClassMappingsByClassId.and.returnValue([]);
            expect(service.addClassMapping(mappingClass)).toEqual(newClassMapping);
            expect(mappingStub.getClassMappingsByClassId).toHaveBeenCalledWith(mappingClass.classObj['@id']);
            expect(mappingManagerStub.addClass).toHaveBeenCalledWith(mappingStub, mappingOntology.entities, mappingClass.classObj['@id']);
            expect(utilStub.setDctermsValue).toHaveBeenCalledWith(newClassMapping, 'title', entityName);
            expect(service.changeProp).not.toHaveBeenCalled();
            expect(service.selected.difference.additions).toContain(newClassMapping);
        });
        describe('the class has already been mapped', function() {
            beforeEach(function() {
                utilStub.getDctermsValue.and.callFake(obj => obj[DCTERMS + 'title'][0]['@value']);
            });
            it('and it does not have an index', function() {
                const originalClassMapping = {'@id': 'original'};
                originalClassMapping[DCTERMS + 'title'] = [{'@value': entityName}];
                mappingStub.getClassMappingsByClassId.and.returnValue([originalClassMapping]);
                expect(service.addClassMapping(mappingClass)).toEqual(newClassMapping);
                expect(mappingStub.getClassMappingsByClassId).toHaveBeenCalledWith(mappingClass.classObj['@id']);
                expect(mappingManagerStub.addClass).toHaveBeenCalledWith(mappingStub, mappingOntology.entities, mappingClass.classObj['@id']);
                expect(originalClassMapping[DCTERMS + 'title'][0]['@value']).toEqual(entityName + ' (1)');
                expect(service.changeProp).toHaveBeenCalledWith(originalClassMapping['@id'], DCTERMS + 'title', entityName + ' (1)', entityName);
                expect(utilStub.setDctermsValue).toHaveBeenCalledWith(newClassMapping, 'title', entityName + ' (2)');
                expect(service.selected.difference.additions).toContain(newClassMapping);
            });
            it('with a missing number', function() {
                const originalMappings = [{'@id': 'original1'}, {'@id': 'original2'}];
                originalMappings[0][DCTERMS + 'title'] = [{'@value': entityName + ' (1)'}];
                originalMappings[1][DCTERMS + 'title'] = [{'@value': entityName + ' (3)'}];
                mappingStub.getClassMappingsByClassId.and.returnValue(originalMappings);
                expect(service.addClassMapping(mappingClass)).toEqual(newClassMapping);
                expect(mappingStub.getClassMappingsByClassId).toHaveBeenCalledWith(mappingClass.classObj['@id']);
                expect(mappingManagerStub.addClass).toHaveBeenCalledWith(mappingStub, mappingOntology.entities, mappingClass.classObj['@id']);
                expect(originalMappings[0][DCTERMS + 'title'][0]['@value']).toEqual(entityName + ' (1)');
                expect(originalMappings[1][DCTERMS + 'title'][0]['@value']).toEqual(entityName + ' (3)');
                expect(service.changeProp).not.toHaveBeenCalled();
                expect(utilStub.setDctermsValue).toHaveBeenCalledWith(newClassMapping, 'title', entityName + ' (2)');
                expect(service.selected.difference.additions).toContain(newClassMapping);
            });
            it('with no missing numbers', function() {
                const originalMappings = [{'@id': 'original1'}, {'@id': 'original2'}];
                originalMappings[0][DCTERMS + 'title'] = [{'@value': entityName + ' (1)'}];
                originalMappings[1][DCTERMS + 'title'] = [{'@value': entityName + ' (2)'}];
                mappingStub.getClassMappingsByClassId.and.returnValue(originalMappings);
                expect(service.addClassMapping(mappingClass)).toEqual(newClassMapping);
                expect(mappingStub.getClassMappingsByClassId).toHaveBeenCalledWith(mappingClass.classObj['@id']);
                expect(mappingManagerStub.addClass).toHaveBeenCalledWith(mappingStub, mappingOntology.entities, mappingClass.classObj['@id']);
                expect(originalMappings[0][DCTERMS + 'title'][0]['@value']).toEqual(entityName + ' (1)');
                expect(originalMappings[1][DCTERMS + 'title'][0]['@value']).toEqual(entityName + ' (2)');
                expect(service.changeProp).not.toHaveBeenCalled();
                expect(utilStub.setDctermsValue).toHaveBeenCalledWith(newClassMapping, 'title', entityName + ' (3)');
                expect(service.selected.difference.additions).toContain(newClassMapping);
            });
        });
    });
    it('should add a data property mapping', function() {
        service.sourceOntologies = [mappingOntology];
        const newPropMapping: JSONLDObject = {'@id': 'new'};
        mappingManagerStub.addDataProp.and.returnValue(newPropMapping);
        ontologyManagerStub.getEntityName.and.returnValue('Prop');
        expect(service.addDataMapping(mappingProperty, 'classMappingId', 0)).toEqual(newPropMapping);
        expect(mappingManagerStub.addDataProp).toHaveBeenCalledWith(mappingStub, mappingOntology.entities, 'classMappingId', mappingProperty.propObj['@id'], 0, undefined, undefined);
        expect(ontologyManagerStub.getEntityName).toHaveBeenCalledWith(mappingProperty.propObj);
        expect(utilStub.setDctermsValue).toHaveBeenCalledWith(newPropMapping, 'title', 'Prop');
        expect(service.selected.difference.additions).toContain(newPropMapping);
    });
    it('should add an object property mapping', function() {
        service.sourceOntologies = [mappingOntology];
        const newPropMapping = {'@id': 'new'};
        mappingManagerStub.addObjectProp.and.returnValue(newPropMapping);
        ontologyManagerStub.getEntityName.and.returnValue('Prop');
        expect(service.addObjectMapping(mappingProperty, 'classMappingId', 'rangeClassMappingId')).toEqual(newPropMapping);
        expect(mappingManagerStub.addObjectProp).toHaveBeenCalledWith(mappingStub, mappingOntology.entities, 'classMappingId', mappingProperty.propObj['@id'], 'rangeClassMappingId');
        expect(ontologyManagerStub.getEntityName).toHaveBeenCalledWith(mappingProperty.propObj);
        expect(utilStub.setDctermsValue).toHaveBeenCalledWith(newPropMapping, 'title', 'Prop');
        expect(service.selected.difference.additions).toContain(newPropMapping);
    });
    describe('should reflect the deletion of entity in the difference', function() {
        const entity = {'@id': 'entity', test: [false]};
        it('if the entire entity was added originally', function() {
            (service.selected.difference.additions as JSONLDObject[]).push(Object.assign({}, entity));
            service.deleteEntity(entity);
            expect(service.selected.difference.additions.length).toEqual(0);
            expect(service.selected.difference.deletions).toEqual([]);
        });
        describe('if no part of the entity was added', function() {
            it('or deleted', function() {
                service.deleteEntity(entity);
                expect(service.selected.difference.additions).toEqual([]);
                expect(service.selected.difference.deletions).toContain(entity);
            });
            it('and a part was deleted', function() {
                const originalDeletionObj = {'@id': entity['@id'], test: [true]};
                const expected = merge({}, originalDeletionObj, entity);
                (service.selected.difference.deletions as JSONLDObject[]).push(originalDeletionObj);
                service.deleteEntity(entity);
                expect(service.selected.difference.additions).toEqual([]);
                expect(originalDeletionObj).toEqual(expected);
            });
        });
    });
    describe('should delete a class mapping and update the difference', function() {
        const classMapping = {'@id': 'classMapping', [DELIM + 'mapsTo']: [{'@id': 'classId'}]};
        const propMapping = {'@id': 'propMapping'};
        beforeEach(function() {
            service.invalidProps = [{ id: propMapping['@id'], index: 0 }];
            mappingStub.getPropsLinkingToClass.and.returnValue([]);
            mappingStub.getPropMappingsByClass.and.returnValue([propMapping]);
            mappingStub.removeClassMapping.and.returnValue(classMapping);
            spyOn(service, 'deleteEntity');
            spyOn(service, 'removeProps');
            spyOn(service, 'changeProp');
            utilStub.getDctermsValue.and.returnValue('original (1)');
        });
        it('if it is the second to last of the specific class', function() {
            const lastClassMapping = {'@id': 'leftover'};
            lastClassMapping[DCTERMS + 'title'] = [{'@value': 'original (1)'}];
            mappingStub.getClassMappingsByClassId.and.returnValue([lastClassMapping]);
            service.deleteClass(classMapping['@id']);
            expect(mappingStub.getPropsLinkingToClass).toHaveBeenCalledWith(classMapping['@id']);
            expect(mappingStub.getPropMappingsByClass).toHaveBeenCalledWith(classMapping['@id']);
            expect(mappingStub.removeClassMapping).toHaveBeenCalledWith(classMapping['@id']);
            expect(service.deleteEntity).toHaveBeenCalledWith(classMapping);
            expect(service.deleteEntity).toHaveBeenCalledWith(propMapping);
            expect(service.removeProps).not.toHaveBeenCalled();
            expect(service.invalidProps.length).toEqual(0);
            expect(mappingStub.getClassMappingsByClassId).toHaveBeenCalledWith('classId');
            expect(utilStub.getDctermsValue).toHaveBeenCalledWith(lastClassMapping, 'title');
            expect(service.changeProp).toHaveBeenCalledWith(lastClassMapping['@id'], DCTERMS + 'title', 'original', 'original (1)');
        });
        it('if it is not the second to last of the specific class', function() {
            mappingStub.getClassMappingsByClassId.and.returnValue([{'@id': 'first'}, {'@id': 'second'}]);
            service.deleteClass(classMapping['@id']);
            expect(mappingStub.getPropsLinkingToClass).toHaveBeenCalledWith(classMapping['@id']);
            expect(mappingStub.getPropMappingsByClass).toHaveBeenCalledWith(classMapping['@id']);
            expect(mappingStub.removeClassMapping).toHaveBeenCalledWith(classMapping['@id']);
            expect(service.deleteEntity).toHaveBeenCalledWith(classMapping);
            expect(service.deleteEntity).toHaveBeenCalledWith(propMapping);
            expect(service.removeProps).not.toHaveBeenCalled();
            expect(service.invalidProps.length).toEqual(0);
            expect(mappingStub.getClassMappingsByClassId).toHaveBeenCalledWith('classId');
            expect(utilStub.getDctermsValue).not.toHaveBeenCalled();
            expect(service.changeProp).not.toHaveBeenCalled();
        });
        it('if it is the last of the specific class', function() {
            mappingStub.getClassMappingsByClassId.and.returnValue([]);
            service.deleteClass(classMapping['@id']);
            expect(mappingStub.getPropsLinkingToClass).toHaveBeenCalledWith(classMapping['@id']);
            expect(mappingStub.getPropMappingsByClass).toHaveBeenCalledWith(classMapping['@id']);
            expect(mappingStub.removeClassMapping).toHaveBeenCalledWith(classMapping['@id']);
            expect(service.deleteEntity).toHaveBeenCalledWith(classMapping);
            expect(service.deleteEntity).toHaveBeenCalledWith(propMapping);
            expect(service.removeProps).toHaveBeenCalledWith('classId');
            expect(service.invalidProps.length).toEqual(0);
            expect(mappingStub.getClassMappingsByClassId).toHaveBeenCalledWith('classId');
            expect(utilStub.getDctermsValue).not.toHaveBeenCalled();
            expect(service.changeProp).not.toHaveBeenCalled();
        });
    });
    describe('should delete a property mapping and update the difference', function() {
        const propMapping = {'@id': 'propMapping'};
        const classMappingId = 'classMapping';
        beforeEach(function() {
            service.invalidProps = [{id: propMapping['@id'], index: 0}];
            mappingStub.removePropMapping.and.returnValue(propMapping);
            spyOn(service, 'deleteEntity');
            mappingManagerStub.isDataMapping.and.returnValue(true);
        });
        it('if it was added originally', function () {
            utilStub.hasPropertyId.and.returnValue(true);
            const additionObj = {'@id': classMappingId};
            (service.selected.difference.additions as JSONLDObject[]).push(additionObj);
            service.deleteProp(propMapping['@id'], classMappingId);
            expect(service.deleteEntity).toHaveBeenCalledWith(propMapping);
            expect(utilStub.hasPropertyId).toHaveBeenCalledWith(additionObj, DELIM + 'dataProperty', propMapping['@id']);
            expect(utilStub.removePropertyId).toHaveBeenCalledWith(additionObj, DELIM + 'dataProperty', propMapping['@id']);
            expect(service.selected.difference.deletions).toEqual([]);
            expect(service.invalidProps.length).toEqual(0);
        });
        describe('if it was not added', function () {
            beforeEach(function() {
                this.additionObj = {'@id': classMappingId};
                (service.selected.difference.additions as JSONLDObject[]).push(this.additionObj);
            });
            it('and the parent class mapping does not exist in deletions', function () {
                const deletionObj = {'@id': classMappingId};
                deletionObj[DELIM + 'dataProperty'] = [{'@id': propMapping['@id']}];
                service.deleteProp(propMapping['@id'], classMappingId);
                expect(service.deleteEntity).toHaveBeenCalledWith(propMapping);
                expect(utilStub.hasPropertyId).toHaveBeenCalledWith(this.additionObj, DELIM + 'dataProperty', propMapping['@id']);
                expect(utilStub.removePropertyId).not.toHaveBeenCalled();
                expect(service.selected.difference.deletions).toContain(deletionObj);
                expect(service.invalidProps.length).toEqual(0);
            });
            it('and the parent class mapping does exist in deletions', function () {
                const deletionObj = {'@id': classMappingId};
                (service.selected.difference.deletions as JSONLDObject[]).push(deletionObj);
                service.deleteProp(propMapping['@id'], classMappingId);
                expect(service.deleteEntity).toHaveBeenCalledWith(propMapping);
                expect(utilStub.hasPropertyId).toHaveBeenCalledWith(this.additionObj, DELIM + 'dataProperty', propMapping['@id']);
                expect(utilStub.removePropertyId).not.toHaveBeenCalled();
                expect(deletionObj[DELIM + 'dataProperty']).toEqual([{'@id': propMapping['@id']}]);
                expect(service.invalidProps.length).toEqual(0);
            });
        });
    });
});
