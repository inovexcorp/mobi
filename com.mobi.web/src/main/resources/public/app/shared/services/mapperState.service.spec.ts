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
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { cloneDeep, has, merge } from 'lodash';
import { MockProvider } from 'ng-mocks';
import { of, throwError } from 'rxjs';

import {
    cleanStylesFromDOM,
} from '../../../test/ts/Shared';
import { CATALOG, DATA, DCTERMS, DELIM, OWL, XSD } from '../../prefixes';
import { Difference } from '../models/difference.class';
import { JSONLDObject } from '../models/JSONLDObject.interface';
import { Mapping } from '../models/mapping.class';
import { MappingClass } from '../models/mappingClass.interface';
import { MappingProperty } from '../models/mappingProperty.interface';
import { MappingRecord } from '../models/mappingRecord.interface';
import { CatalogManagerService } from './catalogManager.service';
import { DelimitedManagerService } from './delimitedManager.service';
import { MappingManagerService } from './mappingManager.service';
import { OntologyManagerService } from './ontologyManager.service';
import { MappingOntologyInfo } from '../models/mappingOntologyInfo.interface';
import { SPARQLSelectResults } from '../models/sparqlSelectResults.interface';
import { IriList } from '../models/iriList.interface';
import { getDctermsValue } from '../utility';
import { MapperStateService } from './mapperState.service';

describe('Mapper State service', function() {
    let service: MapperStateService;
    let mappingManagerStub: jasmine.SpyObj<MappingManagerService>;
    let catalogManagerStub: jasmine.SpyObj<CatalogManagerService>;
    let delimitedManagerStub: jasmine.SpyObj<DelimitedManagerService>;
    let ontologyManagerStub: jasmine.SpyObj<OntologyManagerService>;

    let mappingStub: jasmine.SpyObj<Mapping>;
    const error = 'Error message';
    const catalogId = 'catalogId';
    const ontologyId = 'ontologyId';
    const recordId = 'recordId';
    const propId = 'propId';
    const classId = 'classId';
    const record: MappingRecord = {
        id: recordId,
        title: '',
        description: '',
        modified: '',
        branch: '',
        keywords: []
    };
    const mappingProperty: MappingProperty = {
        iri: propId,
        type: `${OWL}DatatypeProperty`,
        name: 'Mapping Property',
        description: '',
        deprecated: false,
        ranges: []
    };
    const mappingClass: MappingClass = {
        iri: classId,
        name: 'Mapping Class',
        deprecated: false,
        description: ''
    };
    const ontInfo: MappingOntologyInfo = {
        recordId: 'ontRecordId',
        branchId: 'ontBranchId',
        commitId: 'ontCommitId'
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            providers: [
                MapperStateService,
                MockProvider(CatalogManagerService),
                MockProvider(MappingManagerService),
                MockProvider(DelimitedManagerService),
                MockProvider(OntologyManagerService),
            ]
        });

        service = TestBed.inject(MapperStateService);
        catalogManagerStub = TestBed.inject(CatalogManagerService) as jasmine.SpyObj<CatalogManagerService>;
        mappingManagerStub = TestBed.inject(MappingManagerService) as jasmine.SpyObj<MappingManagerService>;
        delimitedManagerStub = TestBed.inject(DelimitedManagerService) as jasmine.SpyObj<DelimitedManagerService>;
        ontologyManagerStub = TestBed.inject(OntologyManagerService) as jasmine.SpyObj<OntologyManagerService>;

        catalogManagerStub.localCatalog = {'@id': catalogId};
        mappingStub = jasmine.createSpyObj('Mapping', [
            'getJsonld',
            'getAllClassMappings',
            'getAllDataMappings',
            'getAllObjectMappings',
            'getClassIdByMappingId',
            'getClassMappingsByClassId',
            'getPropMappingsByClass',
            'getPropsLinkingToClass',
            'getSourceOntologyInfo',
            'findClassWithObjectMapping',
            'findClassWithDataMapping',
            'addClassMapping',
            'getClassMapping',
            'removeClassMapping',
            'hasClassMapping',
            'addDataPropMapping',
            'addObjectPropMapping',
            'removePropMapping',
        ]);
        mappingStub.getSourceOntologyInfo.and.returnValue(ontInfo);
        service.selected = {
            difference: new Difference(),
            mapping: mappingStub
        };
    });

    afterEach(function() {
        cleanStylesFromDOM();
        service = null;
        ontologyManagerStub = null;
        mappingManagerStub = null;
        delimitedManagerStub = null;
        catalogManagerStub = null;
        mappingStub = null;
    });

    it('should initialize important variables', function() {
        service.initialize();
        expect(service.editMapping).toBe(false);
        expect(service.newMapping).toBe(false);
        expect(service.step).toBe(0);
        expect(service.editTabIndex).toEqual(0);
        expect(service.invalidProps).toEqual([]);
        expect(service.iriMap).toBeUndefined();
        expect(service.selected).toBeUndefined();
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
        expect(service.resetEdit).toHaveBeenCalledWith();
    });
    describe('should retrieve a MappingState for the provided record', function() {
        const mappingEntity: JSONLDObject = {
            '@id': 'mapping',
            '@type': [`${DELIM}Mapping`],
            [`${DELIM}sourceRecord`]: [{'@id': ontologyId}],
            [`${DELIM}sourceBranch`]: [{'@id': ''}],
            [`${DELIM}sourceCommit`]: [{'@id': ''}],
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
                    catalogManagerStub.createBranchCommit.and.returnValue(of(null));
                    const add1 = {'@id': 'add1', [`${DCTERMS}title`]: [{ '@value': 'Class' }]};
                    const add2 = {'@id': 'add2', [`${DCTERMS}title`]: [{ '@value': 'Prop 1' }]};
                    const add3 = {'@id': 'add3'};
                    const del1 = {'@id': 'del1', [`${DCTERMS}title`]: [{ '@value': 'Prop 2' }]};
                    service.selected.difference.additions = [add1, add2, add3];
                    service.selected.difference.deletions = [del1, add2];
                    mappingStub.getJsonld.and.returnValue([add1, add2, add3]);
                    service.saveMapping()
                        .subscribe(response => {
                            expect(response).toEqual(service.selected.record.id);
                        }, () => fail('Observable should have resolved'));
                    tick();
                    expect(mappingManagerStub.upload).not.toHaveBeenCalled();
                    expect(catalogManagerStub.updateInProgressCommit).toHaveBeenCalledWith(service.selected.record.id, catalogId, service.selected.difference);
                    expect(catalogManagerStub.createBranchCommit).toHaveBeenCalledWith(service.selected.record.branch, service.selected.record.id, catalogId, 'Changed Class, Prop 1, Add 3, Prop 2');
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
    describe('should find incompatible mappings within a Mapping', function() {
        const objPropId = 'objPropId';
        const classMapping: JSONLDObject = {
            '@id': 'classMapping',
            '@type': [`${DELIM}ClassMapping`],
            [`${DELIM}mapsTo`]: [{'@id': classId}]
        };
        const dataPropMapping: JSONLDObject = {
            '@id': 'dataPropMapping',
            '@type': [`${DELIM}PropertyMapping`, `${DELIM}DataMapping`],
            [`${DELIM}hasProperty`]: [{ '@id': propId }],
            [`${DELIM}columnIndex`]: [{ '@value': '0' }]
        };
        const objPropMapping: JSONLDObject = {
            '@id': 'objPropMapping',
            '@type': [`${DELIM}PropertyMapping`, `${DELIM}ObjectMapping`],
            [`${DELIM}hasProperty`]: [{ '@id': objPropId }],
            [`${DELIM}classMapping`]: [{ '@id': classMapping['@id'] }]
        };
        const objProp: MappingProperty = cloneDeep(mappingProperty);
        objProp.iri = objPropId;
        objProp.type = `${OWL}ObjectProperty`;
        objProp.ranges = [classId];
        beforeEach(function() {
            mappingStub.getAllClassMappings.and.returnValue([]);
            mappingStub.getAllDataMappings.and.returnValue([]);
            mappingStub.getAllObjectMappings.and.returnValue([]);
        });
        it('unless retrieveSpecificClasses fails', async function() {
            spyOn(service, 'retrieveSpecificClasses').and.returnValue(throwError(error));
            spyOn(service, 'retrieveSpecificProps').and.returnValue(of([]));
            mappingStub.getAllClassMappings.and.returnValue([classMapping]);
            mappingStub.getAllDataMappings.and.returnValue([dataPropMapping]);
            mappingStub.getAllObjectMappings.and.returnValue([objPropMapping]);
            await service.findIncompatibleMappings(mappingStub).subscribe(result => {
                expect(result).toEqual([]);
            }, () => fail('Observable should have succeeded'));
            expect(service.retrieveSpecificClasses).toHaveBeenCalledWith(ontInfo, [classId]);
            expect(service.retrieveSpecificProps).toHaveBeenCalledWith(ontInfo, [
                { iri: objPropId, type: `${OWL}ObjectProperty` },
                { iri: propId, type: `${OWL}DatatypeProperty` },
                { iri: propId, type: `${OWL}AnnotationProperty` },
            ]);
        });
        it('unless retrieveSpecificProps fails', async function() {
            spyOn(service, 'retrieveSpecificClasses').and.returnValue(of([]));
            spyOn(service, 'retrieveSpecificProps').and.returnValue(throwError(error));
            mappingStub.getAllClassMappings.and.returnValue([classMapping]);
            mappingStub.getAllDataMappings.and.returnValue([dataPropMapping]);
            mappingStub.getAllObjectMappings.and.returnValue([objPropMapping]);
            await service.findIncompatibleMappings(mappingStub).subscribe(result => {
                expect(result).toEqual([]);
            }, () => fail('Observable should have succeeded'));
            expect(service.retrieveSpecificClasses).toHaveBeenCalledWith(ontInfo, [classId]);
            expect(service.retrieveSpecificProps).toHaveBeenCalledWith(ontInfo, [
                { iri: objPropId, type: `${OWL}ObjectProperty` },
                { iri: propId, type: `${OWL}DatatypeProperty` },
                { iri: propId, type: `${OWL}AnnotationProperty` },
            ]);
        });
        it('unless there are no class or property mappings', async function() {
            spyOn(service, 'retrieveSpecificClasses');
            spyOn(service, 'retrieveSpecificProps');
            await service.findIncompatibleMappings(mappingStub).subscribe(result => {
                expect(result).toEqual([]);
            }, () => fail('Observable should have succeeded'));
            expect(service.retrieveSpecificClasses).not.toHaveBeenCalled();
            expect(service.retrieveSpecificProps).not.toHaveBeenCalled();
        });
        it('if there are incompatible classes', async function() {
            const deprecatedClass: MappingClass = cloneDeep(mappingClass);
            deprecatedClass.iri = 'deprecatedClassId';
            deprecatedClass.deprecated = true;
            const deprecatedClassMapping: JSONLDObject = cloneDeep(classMapping);
            deprecatedClassMapping[`${DELIM}mapsTo`] = [{ '@id': deprecatedClass.iri }];
            
            const missingClassMapping: JSONLDObject = cloneDeep(classMapping);
            missingClassMapping[`${DELIM}mapsTo`] = [{ '@id': 'error' }];

            spyOn(service, 'retrieveSpecificClasses').and.returnValue(of([mappingClass, deprecatedClass]));
            spyOn(service, 'retrieveSpecificProps');
            mappingStub.getAllClassMappings.and.returnValue([classMapping, deprecatedClassMapping, missingClassMapping]);
            await service.findIncompatibleMappings(mappingStub).subscribe(result => {
                expect(result).toEqual([deprecatedClassMapping, missingClassMapping]);
            }, () => fail('Observable should have succeeded'));
            expect(service.retrieveSpecificClasses).toHaveBeenCalledWith(ontInfo, [classId, deprecatedClass.iri, 'error']);
            expect(service.retrieveSpecificProps).not.toHaveBeenCalled();
        });
        it('if there are incompatible data properties', async function() {
            const supportedAnnMapping: JSONLDObject = cloneDeep(dataPropMapping);
            supportedAnnMapping[`${DELIM}hasProperty`] = [{ '@id': service.supportedAnnotations[0].iri }];
            
            const switchedDataPropMapping: JSONLDObject = cloneDeep(dataPropMapping);
            switchedDataPropMapping[`${DELIM}hasProperty`] = [{ '@id': objPropId }];
            
            const deprecatedProperty: MappingProperty = cloneDeep(mappingProperty);
            deprecatedProperty.iri = 'deprecatedProperty';
            deprecatedProperty.deprecated = true;
            const deprecatedPropMapping: JSONLDObject = cloneDeep(dataPropMapping);
            deprecatedPropMapping[`${DELIM}hasProperty`] = [{ '@id': deprecatedProperty.iri }];
            
            const missingPropMapping: JSONLDObject = cloneDeep(dataPropMapping);
            missingPropMapping[`${DELIM}hasProperty`] = [{ '@id': 'error' }];

            mappingStub.getAllDataMappings.and.returnValue([dataPropMapping, supportedAnnMapping, switchedDataPropMapping, deprecatedPropMapping, missingPropMapping]);
            spyOn(service, 'retrieveSpecificClasses');
            spyOn(service, 'retrieveSpecificProps').and.returnValue(of([mappingProperty, deprecatedProperty, objProp]));
            await service.findIncompatibleMappings(mappingStub).subscribe(result => {
                expect(result).toEqual([switchedDataPropMapping, deprecatedPropMapping, missingPropMapping]);
            }, () => fail('Observable should have succeeded'));
            expect(service.retrieveSpecificClasses).not.toHaveBeenCalled();
            expect(service.retrieveSpecificProps).toHaveBeenCalledWith(ontInfo, [
                { iri: propId, type: `${OWL}DatatypeProperty` }, 
                { iri: objPropId, type: `${OWL}DatatypeProperty` }, 
                { iri: deprecatedProperty.iri, type: `${OWL}DatatypeProperty` }, 
                { iri: 'error', type: `${OWL}DatatypeProperty` }, 
                { iri: propId, type: `${OWL}AnnotationProperty` }, 
                { iri: objPropId, type: `${OWL}AnnotationProperty` }, 
                { iri: deprecatedProperty.iri, type: `${OWL}AnnotationProperty` }, 
                { iri: 'error', type: `${OWL}AnnotationProperty` },
            ]);
        });
        it('if there are incompatible object properties', async function() {
            const switchedObjPropMapping: JSONLDObject = cloneDeep(objPropMapping);
            switchedObjPropMapping[`${DELIM}hasProperty`] = [{ '@id': propId }];
            
            const deprecatedProperty: MappingProperty = cloneDeep(objProp);
            deprecatedProperty.iri = 'deprecatedProperty';
            deprecatedProperty.deprecated = true;
            const deprecatedPropMapping: JSONLDObject = cloneDeep(objPropMapping);
            deprecatedPropMapping[`${DELIM}hasProperty`] = [{ '@id': deprecatedProperty.iri }];
            
            const missingPropMapping: JSONLDObject = cloneDeep(objPropMapping);
            missingPropMapping[`${DELIM}hasProperty`] = [{ '@id': 'error' }];

            const removedRangeClass: MappingClass = cloneDeep(mappingClass);
            removedRangeClass.iri = 'missingRange';
            const removedRangeClassMapping: JSONLDObject = cloneDeep(classMapping);
            removedRangeClassMapping['@id'] = 'removedRangeClassMapping';
            removedRangeClassMapping[`${DELIM}mapsTo`] = [{ '@id': removedRangeClass.iri }];
            const removedRangeProperty: MappingProperty = cloneDeep(objProp);
            removedRangeProperty.iri = 'missingRangeProperty';
            removedRangeProperty.ranges = [];
            const removedRangePropMapping: JSONLDObject = cloneDeep(objPropMapping);
            removedRangePropMapping['@id'] = 'removedRangePropMapping';
            removedRangePropMapping[`${DELIM}hasProperty`] = [{ '@id': removedRangeProperty.iri }];
            removedRangePropMapping[`${DELIM}classMapping`] = [{ '@id': removedRangeClassMapping['@id'] }];

            const incomClass: MappingClass = cloneDeep(mappingClass);
            incomClass.iri = 'incomClassId';
            incomClass.deprecated = true;
            const incomClassMapping: JSONLDObject = cloneDeep(classMapping);
            incomClassMapping['@id'] = 'incomClassMapping';
            incomClassMapping[`${DELIM}mapsTo`] = [{ '@id': incomClass.iri }];
            const incomRangeProperty: MappingProperty = cloneDeep(objProp);
            incomRangeProperty.iri = 'incomRangeProperty';
            incomRangeProperty.ranges = [incomClass.iri];
            const incomRangePropMapping: JSONLDObject = cloneDeep(objPropMapping);
            incomRangePropMapping['@id'] = 'incomRangePropMapping';
            incomRangePropMapping[`${DELIM}hasProperty`] = [{ '@id': incomRangeProperty.iri }];
            incomRangePropMapping[`${DELIM}classMapping`] = [{ '@id': incomClassMapping['@id'] }];

            mappingStub.getClassIdByMappingId.and.callFake(id => {
                if (id === classMapping['@id']) {
                    return classId;
                } else if (id === removedRangeClassMapping['@id']) {
                    return removedRangeClass.iri;
                } else if (id === incomClassMapping['@id']) {
                    return incomClass.iri;
                } else {
                    return '';
                }
            });
            mappingStub.getAllClassMappings.and.returnValue([classMapping, removedRangeClassMapping, incomClassMapping]);
            mappingStub.getAllObjectMappings.and.returnValue([objPropMapping, switchedObjPropMapping, deprecatedPropMapping, missingPropMapping, removedRangePropMapping, incomRangePropMapping]);
            spyOn(service, 'retrieveSpecificClasses').and.returnValue(of([mappingClass, removedRangeClass, incomClass]));
            spyOn(service, 'retrieveSpecificProps').and.returnValue(of([mappingProperty, deprecatedProperty, objProp, removedRangeProperty, incomRangeProperty]));
            await service.findIncompatibleMappings(mappingStub).subscribe(result => {
                expect(result).toEqual([incomClassMapping, switchedObjPropMapping, deprecatedPropMapping, missingPropMapping, removedRangePropMapping, incomRangePropMapping]);
            }, () => fail('Observable should have succeeded'));
            expect(service.retrieveSpecificClasses).toHaveBeenCalledWith(ontInfo, [classId, removedRangeClass.iri, incomClass.iri]);
            expect(service.retrieveSpecificProps).toHaveBeenCalledWith(ontInfo, [
                { iri: objPropId, type: `${OWL}ObjectProperty` }, 
                { iri: propId, type: `${OWL}ObjectProperty` }, 
                { iri: deprecatedProperty.iri, type: `${OWL}ObjectProperty` }, 
                { iri: 'error', type: `${OWL}ObjectProperty` }, 
                { iri: removedRangeProperty.iri, type: `${OWL}ObjectProperty` },
                { iri: incomRangeProperty.iri, type: `${OWL}ObjectProperty` },
            ]);
        });
    });
    it('should set the list of invalid property mappings', function() {
        delimitedManagerStub.dataRows = [['']];
        const invalidProp: JSONLDObject = {
            '@id': 'invalid',
            [`${DCTERMS}title`]: [{ '@value': 'Title' }],
            [`${DELIM}columnIndex`]: [{ '@value': '1' }]
        };
        const validProp: JSONLDObject = {
            '@id': 'valid',
            [`${DCTERMS}title`]: [{ '@value': 'Title' }],
            [`${DELIM}columnIndex`]: [{ '@value': '0' }]
        };
        const classMapping: JSONLDObject = {
            '@id': 'classMapping',
            [`${DCTERMS}title`]: [{ '@value': 'Title' }]
        };
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
    });
    it('should return a list of all the mapped column indexes', function() {
        const dataMappings = [{'@id': '', [`${DELIM}columnIndex`]: [{ '@value': '0' }]}];
        mappingStub.getAllDataMappings.and.returnValue(dataMappings);
        const results = service.getMappedColumns();
        expect(results.length).toBe(dataMappings.length);
        results.forEach(result => {
            expect(result).toBe('0');
        });
    });
    describe('should reflect the change of a property value in the difference', function() {
        const entityId = 'entity';
        const newValue = 'new';
        const originalValue = 'original';
        const otherValue = 'other';
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
        const newClassMapping: JSONLDObject = {'@id': 'new'};
        beforeEach(function() {
            mappingStub.addClassMapping.and.returnValue(newClassMapping);
            spyOn(service, 'changeProp');
            service.iriMap = {
                classes: { [mappingClass.iri]: ontologyId },
                dataProperties: {},
                objectProperties: {},
                annotationProperties: {},
            };
        });
        it('it is the first of the class', function() {
            mappingStub.getClassMappingsByClassId.and.returnValue([]);
            expect(service.addClassMapping(mappingClass)).toEqual(newClassMapping);
            expect(mappingStub.getClassMappingsByClassId).toHaveBeenCalledWith(mappingClass.iri);
            expect(mappingStub.addClassMapping).toHaveBeenCalledWith(mappingClass.iri, `${DATA}${ontologyId}/classid/`);
            expect(service.changeProp).not.toHaveBeenCalled();
            expect(service.selected.difference.additions).toContain(newClassMapping);
        });
        describe('the class has already been mapped', function() {
            it('and it does not have an index', function() {
                const originalClassMapping = {'@id': 'original'};
                originalClassMapping[`${DCTERMS}title`] = [{'@value': mappingClass.name}];
                mappingStub.getClassMappingsByClassId.and.returnValue([originalClassMapping]);
                expect(service.addClassMapping(mappingClass)).toEqual(newClassMapping);
                expect(mappingStub.getClassMappingsByClassId).toHaveBeenCalledWith(mappingClass.iri);
                expect(mappingStub.addClassMapping).toHaveBeenCalledWith(mappingClass.iri, `${DATA}${ontologyId}/classid/`);
                expect(originalClassMapping[`${DCTERMS}title`][0]['@value']).toEqual(`${mappingClass.name} (1)`);
                expect(service.changeProp).toHaveBeenCalledWith(originalClassMapping['@id'], `${DCTERMS}title`, `${mappingClass.name} (1)`, mappingClass.name);
                expect(service.selected.difference.additions).toContain(newClassMapping);
            });
            it('with a missing number', function() {
                const originalMappings = [{'@id': 'original1'}, {'@id': 'original2'}];
                originalMappings[0][`${DCTERMS}title`] = [{'@value': `${mappingClass.name} (1)`}];
                originalMappings[1][`${DCTERMS}title`] = [{'@value': `${mappingClass.name} (3)`}];
                mappingStub.getClassMappingsByClassId.and.returnValue(originalMappings);
                expect(service.addClassMapping(mappingClass)).toEqual(newClassMapping);
                expect(mappingStub.getClassMappingsByClassId).toHaveBeenCalledWith(mappingClass.iri);
                expect(mappingStub.addClassMapping).toHaveBeenCalledWith(mappingClass.iri, `${DATA}${ontologyId}/classid/`);
                expect(originalMappings[0][`${DCTERMS}title`][0]['@value']).toEqual(`${mappingClass.name} (1)`);
                expect(originalMappings[1][`${DCTERMS}title`][0]['@value']).toEqual(`${mappingClass.name} (3)`);
                expect(service.changeProp).not.toHaveBeenCalled();
                expect(service.selected.difference.additions).toContain(newClassMapping);
            });
            it('with no missing numbers', function() {
                const originalMappings = [{'@id': 'original1'}, {'@id': 'original2'}];
                originalMappings[0][`${DCTERMS}title`] = [{'@value': `${mappingClass.name} (1)`}];
                originalMappings[1][`${DCTERMS}title`] = [{'@value': `${mappingClass.name} (2)`}];
                mappingStub.getClassMappingsByClassId.and.returnValue(originalMappings);
                expect(service.addClassMapping(mappingClass)).toEqual(newClassMapping);
                expect(mappingStub.getClassMappingsByClassId).toHaveBeenCalledWith(mappingClass.iri);
                expect(mappingStub.addClassMapping).toHaveBeenCalledWith(mappingClass.iri, `${DATA}${ontologyId}/classid/`);
                expect(originalMappings[0][`${DCTERMS}title`][0]['@value']).toEqual(`${mappingClass.name} (1)`);
                expect(originalMappings[1][`${DCTERMS}title`][0]['@value']).toEqual(`${mappingClass.name} (2)`);
                expect(service.changeProp).not.toHaveBeenCalled();
                expect(service.selected.difference.additions).toContain(newClassMapping);
            });
        });
    });
    describe('should add a data property mapping', function() {
        const classMappingId = 'classMappingId';
        const mappingAnnotation: MappingProperty = cloneDeep(mappingProperty);
        mappingAnnotation.iri = 'annotation';
        mappingAnnotation.name = 'Annotation';
        beforeEach(function() {
            service.iriMap = {
                classes: {},
                dataProperties: { [mappingProperty.iri]: ontologyId },
                objectProperties: {},
                annotationProperties: { [mappingAnnotation.iri]: ontologyId },
            };
            this.newPropMapping = {'@id': 'new'};
            mappingStub.addDataPropMapping.and.returnValue(this.newPropMapping);
            mappingStub.hasClassMapping.and.callFake(id => id === classMappingId);
        });
        it('unless the parent class mapping does not exist', function() {
            expect(service.addDataMapping(mappingProperty, 'error', 0)).toBeUndefined();
            expect(mappingStub.addDataPropMapping).not.toHaveBeenCalled();
            expect(service.selected.difference.additions).toEqual([]);
        });
        it('unless the property does not exist in the imports closure, is not a Datatype or Annotation Property, and is not a supported annotation', function() {
            const mappingPropertyClone = cloneDeep(mappingProperty);
            mappingPropertyClone.iri = 'error';
            expect(service.addDataMapping(mappingPropertyClone, classMappingId, 0)).toBeUndefined();
            expect(mappingStub.addDataPropMapping).not.toHaveBeenCalled();
            expect(service.selected.difference.additions).toEqual([]);
        });
        it('unless the property is in the imports closure but is not a Datatype or Annotation Property', function() {
            const mappingPropertyClone = cloneDeep(mappingProperty);
            mappingPropertyClone.type = `${OWL}ObjectProperty`;
            expect(service.addDataMapping(mappingPropertyClone, classMappingId, 0)).toBeUndefined();
            expect(mappingStub.addDataPropMapping).not.toHaveBeenCalled();
            expect(service.selected.difference.additions).toEqual([]);
        });
        it('if the property is a supported annotation', function() {
            expect(service.addDataMapping(service.supportedAnnotations[0], classMappingId, 0)).toEqual(this.newPropMapping);
            expect(mappingStub.addDataPropMapping).toHaveBeenCalledWith(service.supportedAnnotations[0].iri, 0, classMappingId, undefined, undefined);
            expect(service.selected.difference.additions).toContain(this.newPropMapping);
            expect(getDctermsValue(this.newPropMapping, 'title')).toEqual(service.supportedAnnotations[0].name);
        });
        it('if the property is an existing DatatypeProperty', function() {
            expect(service.addDataMapping(mappingProperty, classMappingId, 0)).toEqual(this.newPropMapping);
            expect(mappingStub.addDataPropMapping).toHaveBeenCalledWith(mappingProperty.iri, 0, classMappingId, undefined, undefined);
            expect(service.selected.difference.additions).toContain(this.newPropMapping);
            expect(getDctermsValue(this.newPropMapping, 'title')).toEqual(mappingProperty.name);
        });
        it('if the property is an existing AnnotationProperty', function() {
            expect(service.addDataMapping(mappingAnnotation, classMappingId, 0)).toEqual(this.newPropMapping);
            expect(mappingStub.addDataPropMapping).toHaveBeenCalledWith(mappingAnnotation.iri, 0, classMappingId, undefined, undefined);
            expect(service.selected.difference.additions).toContain(this.newPropMapping);
            expect(getDctermsValue(this.newPropMapping, 'title')).toEqual(mappingAnnotation.name);
        });
    });
    describe('should add an object property mapping', function() {
        const classMappingId = 'classMappingId';
        const rangeClassId = 'rangeClassId';
        const rangeMappingId = 'rangeClassMappingId';
        const rangeClassMapping: JSONLDObject = {
          '@id': rangeMappingId,
          [`${DELIM}mapsTo`]: [{ '@id': rangeClassId }]
        };
        const mappingObjProperty: MappingProperty = cloneDeep(mappingProperty);
        mappingObjProperty.type = `${OWL}ObjectProperty`;
        mappingObjProperty.ranges = [rangeClassId];
        beforeEach(function() {
            service.iriMap = {
                classes: {},
                dataProperties: {},
                objectProperties: { [mappingObjProperty.iri]: ontologyId },
                annotationProperties: {},
            };
            mappingStub.hasClassMapping.and.callFake(id => id === classMappingId);
            mappingStub.getClassMapping.and.callFake(id => id === rangeMappingId ? rangeClassMapping : undefined);
            this.newPropMapping = {'@id': 'new'};
            mappingStub.addObjectPropMapping.and.returnValue(this.newPropMapping);
        });
        it('unless the parent class mapping does not exist', function() {
            expect(service.addObjectMapping(mappingObjProperty, 'error', rangeMappingId)).toBeUndefined();
            expect(mappingStub.addObjectPropMapping).not.toHaveBeenCalled();
            expect(service.selected.difference.additions).toEqual([]);
        });
        it('unless the range class mapping does not exist', function() {
            expect(service.addObjectMapping(mappingObjProperty, classMappingId, 'error')).toBeUndefined();
            expect(mappingStub.addObjectPropMapping).not.toHaveBeenCalled();
            expect(service.selected.difference.additions).toEqual([]);
        });
        it('unless the property does not exist in the imports closure', function() {
            const mappingObjPropertyClone = cloneDeep(mappingObjProperty);
            mappingObjPropertyClone.iri = 'error';
            expect(service.addObjectMapping(mappingObjPropertyClone, classMappingId, rangeMappingId)).toBeUndefined();
            expect(mappingStub.addObjectPropMapping).not.toHaveBeenCalled();
            expect(service.selected.difference.additions).toEqual([]);
        });
        it('unless the property is in the imports closure but is not an ObjectProperty', function() {
            const mappingObjPropertyClone = cloneDeep(mappingObjProperty);
            mappingObjPropertyClone.type = `${OWL}AnnotationProperty`;
            expect(service.addObjectMapping(mappingObjPropertyClone, classMappingId, rangeMappingId)).toBeUndefined();
            expect(mappingStub.addObjectPropMapping).not.toHaveBeenCalled();
            expect(service.selected.difference.additions).toEqual([]);
        });
        it('successfully', function() {
            expect(service.addObjectMapping(mappingObjProperty, classMappingId, rangeMappingId)).toEqual(this.newPropMapping);
            expect(mappingStub.addObjectPropMapping).toHaveBeenCalledWith(mappingObjProperty.iri, classMappingId, rangeMappingId);
            expect(service.selected.difference.additions).toContain(this.newPropMapping);
            expect(getDctermsValue(this.newPropMapping, 'title')).toEqual(mappingObjProperty.name);
        });
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
        const classMapping: JSONLDObject = {
          '@id': 'classMapping',
          [`${DELIM}mapsTo`]: [{'@id': classId}]
        };
        const propMapping: JSONLDObject = {'@id': 'propMapping'};
        beforeEach(function() {
            service.invalidProps = [{ id: propMapping['@id'], index: 0 }];
            mappingStub.getPropsLinkingToClass.and.returnValue([]);
            mappingStub.getPropMappingsByClass.and.returnValue([propMapping]);
            mappingStub.removeClassMapping.and.returnValue(classMapping);
            spyOn(service, 'deleteEntity');
            spyOn(service, 'changeProp');
        });
        it('if it is the second to last of the specific class', function() {
            const lastClassMapping = {
              '@id': 'leftover',
              [`${DCTERMS}title`]: [{ '@value': 'original (1)'}]
            };
            mappingStub.getClassMappingsByClassId.and.returnValue([lastClassMapping]);
            service.deleteClass(classMapping['@id']);
            expect(mappingStub.getPropsLinkingToClass).toHaveBeenCalledWith(classMapping['@id']);
            expect(mappingStub.getPropMappingsByClass).toHaveBeenCalledWith(classMapping['@id']);
            expect(mappingStub.removeClassMapping).toHaveBeenCalledWith(classMapping['@id']);
            expect(service.deleteEntity).toHaveBeenCalledWith(classMapping);
            expect(service.deleteEntity).toHaveBeenCalledWith(propMapping);
            expect(service.invalidProps.length).toEqual(0);
            expect(mappingStub.getClassMappingsByClassId).toHaveBeenCalledWith(classId);
            expect(service.changeProp).toHaveBeenCalledWith(lastClassMapping['@id'], `${DCTERMS}title`, 'original', 'original (1)');
        });
        it('if it is not the second to last of the specific class', function() {
            mappingStub.getClassMappingsByClassId.and.returnValue([{'@id': 'first'}, {'@id': 'second'}]);
            service.deleteClass(classMapping['@id']);
            expect(mappingStub.getPropsLinkingToClass).toHaveBeenCalledWith(classMapping['@id']);
            expect(mappingStub.getPropMappingsByClass).toHaveBeenCalledWith(classMapping['@id']);
            expect(mappingStub.removeClassMapping).toHaveBeenCalledWith(classMapping['@id']);
            expect(service.deleteEntity).toHaveBeenCalledWith(classMapping);
            expect(service.deleteEntity).toHaveBeenCalledWith(propMapping);
            expect(service.invalidProps.length).toEqual(0);
            expect(mappingStub.getClassMappingsByClassId).toHaveBeenCalledWith(classId);
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
            expect(service.invalidProps.length).toEqual(0);
            expect(mappingStub.getClassMappingsByClassId).toHaveBeenCalledWith(classId);
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
            const additionObj = {'@id': classMappingId, [`${DELIM}dataProperty`]: [{ '@id': propMapping['@id'] }]};
            (service.selected.difference.additions as JSONLDObject[]).push(additionObj);
            service.deleteProp(propMapping['@id'], classMappingId);
            expect(service.deleteEntity).toHaveBeenCalledWith(propMapping);
            expect(service.selected.difference.deletions).toEqual([]);
            expect(service.invalidProps.length).toEqual(0);
        });
        describe('if it was not added', function () {
            beforeEach(function() {
                this.additionObj = {'@id': classMappingId};
                (service.selected.difference.additions as JSONLDObject[]).push(this.additionObj);
            });
            it('and the parent class mapping does not exist in deletions', function () {
                const deletionObj = {
                  '@id': classMappingId,
                  [`${DELIM}dataProperty`]: [{'@id': propMapping['@id']}]
                };
                service.deleteProp(propMapping['@id'], classMappingId);
                expect(service.deleteEntity).toHaveBeenCalledWith(propMapping);
                expect(service.selected.difference.deletions).toContain(deletionObj);
                expect(service.invalidProps.length).toEqual(0);
            });
            it('and the parent class mapping does exist in deletions', function () {
                const deletionObj = {'@id': classMappingId};
                (service.selected.difference.deletions as JSONLDObject[]).push(deletionObj);
                service.deleteProp(propMapping['@id'], classMappingId);
                expect(service.deleteEntity).toHaveBeenCalledWith(propMapping);
                expect(deletionObj[`${DELIM}dataProperty`]).toEqual([{'@id': propMapping['@id']}]);
                expect(service.invalidProps.length).toEqual(0);
            });
        });
    });
    describe('should set the IRI map of the current mapping', function() {
        const iris: IriList = {
            annotationProperties: ['annPropA', 'annPropB'],
            deprecatedIris: [],
            classes: ['classA', 'classB'],
            datatypes: [],
            objectProperties: ['objPropA', 'objPropB'],
            dataProperties: ['dataPropA', 'dataPropB'],
            namedIndividuals: [],
            concepts: [],
            conceptSchemes: [],
            derivedConcepts: [],
            derivedConceptSchemes: [],
            derivedSemanticRelations: []
        };
        const importedIRIs: IriList = {
            id: 'importedOntologyA',
            annotationProperties: ['importedAnnPropA'],
            deprecatedIris: [],
            classes: ['importedClassA'],
            datatypes: [],
            objectProperties: ['importedObjPropA'],
            dataProperties: ['importedDataPropA'],
            namedIndividuals: [],
            concepts: [],
            conceptSchemes: [],
            derivedConcepts: [],
            derivedConceptSchemes: [],
            derivedSemanticRelations: []
        };
        beforeEach(function() {
            service.selected.ontology = {
                '@id': ontInfo.recordId,
                [`${CATALOG}trackedIdentifier`]: [{ '@id': ontologyId }]
            };
            ontologyManagerStub.getIris.and.returnValue(of(iris));
        });
        it('unless an error occurs with getIris', async function() {
            ontologyManagerStub.getIris.and.returnValue(throwError(error));
            ontologyManagerStub.getImportedIris.and.returnValue(of([importedIRIs]));
            await service.setIriMap().subscribe(() => fail('Observable should have failed'), result => {
                expect(result).toEqual(error);
            });
            expect(mappingStub.getSourceOntologyInfo).toHaveBeenCalledWith();
            expect(ontologyManagerStub.getIris).toHaveBeenCalledWith(ontInfo.recordId, ontInfo.branchId, ontInfo.commitId);
            expect(ontologyManagerStub.getImportedIris).toHaveBeenCalledWith(ontInfo.recordId, ontInfo.branchId, ontInfo.commitId);
        });
        it('unless an getSourceOntologyInfo return empty data ', async function() {
            const ontInfo: MappingOntologyInfo = {
                recordId: '',
                branchId: '',
                commitId: ''
            };
            mappingStub.getSourceOntologyInfo.and.returnValue(ontInfo);
            ontologyManagerStub.getImportedIris.and.returnValue(of([importedIRIs]));
            await service.setIriMap().subscribe(() => fail('Observable should have failed'), result => {
                expect(result).toEqual('SourceOntologyInfo recordId, branchId, and commitId are empty');
            });
            expect(mappingStub.getSourceOntologyInfo).toHaveBeenCalledWith();
            expect(ontologyManagerStub.getIris).not.toHaveBeenCalledWith(ontInfo.recordId, ontInfo.branchId, ontInfo.commitId);
            expect(ontologyManagerStub.getImportedIris).not.toHaveBeenCalledWith(ontInfo.recordId, ontInfo.branchId, ontInfo.commitId);
        });
        it('unless an error occurs with getImportedIris', async function() {
            ontologyManagerStub.getImportedIris.and.returnValue(throwError(error));
            await service.setIriMap().subscribe(() => fail('Observable should have failed'), result => {
                expect(result).toEqual(error);
            });
            expect(mappingStub.getSourceOntologyInfo).toHaveBeenCalledWith();
            expect(ontologyManagerStub.getIris).toHaveBeenCalledWith(ontInfo.recordId, ontInfo.branchId, ontInfo.commitId);
            expect(ontologyManagerStub.getImportedIris).toHaveBeenCalledWith(ontInfo.recordId, ontInfo.branchId, ontInfo.commitId);
        });
        describe('successfully', function() {
            it('with imported IRIs', async function() {
                ontologyManagerStub.getImportedIris.and.returnValue(of([importedIRIs]));
                await service.setIriMap().subscribe(() => {
                    expect(service.iriMap).toEqual({
                        classes: {
                            classA: ontologyId,
                            classB: ontologyId,
                            importedClassA: 'importedOntologyA'
                        },
                        dataProperties: {
                            dataPropA: ontologyId,
                            dataPropB: ontologyId,
                            importedDataPropA: 'importedOntologyA'
                        },
                        objectProperties: {
                            objPropA: ontologyId,
                            objPropB: ontologyId,
                            importedObjPropA: 'importedOntologyA'
                        },
                        annotationProperties: {
                            annPropA: ontologyId,
                            annPropB: ontologyId,
                            importedAnnPropA: 'importedOntologyA'
                        }
                    });
                }, () => fail('Observable should have succeeded'));
                expect(mappingStub.getSourceOntologyInfo).toHaveBeenCalledWith();
                expect(ontologyManagerStub.getIris).toHaveBeenCalledWith(ontInfo.recordId, ontInfo.branchId, ontInfo.commitId);
                expect(ontologyManagerStub.getImportedIris).toHaveBeenCalledWith(ontInfo.recordId, ontInfo.branchId, ontInfo.commitId);
            });
            it('without imported IRIs', async function() {
                ontologyManagerStub.getImportedIris.and.returnValue(of(null));
                await service.setIriMap().subscribe(() => {
                  expect(service.iriMap).toEqual({
                      classes: {
                          classA: ontologyId,
                          classB: ontologyId,
                      },
                      dataProperties: {
                          dataPropA: ontologyId,
                          dataPropB: ontologyId,
                      },
                      objectProperties: {
                          objPropA: ontologyId,
                          objPropB: ontologyId,
                      },
                      annotationProperties: {
                          annPropA: ontologyId,
                          annPropB: ontologyId,
                      }
                  });
                }, () => fail('Observable should have succeeded'));
                expect(mappingStub.getSourceOntologyInfo).toHaveBeenCalledWith();
                expect(ontologyManagerStub.getIris).toHaveBeenCalledWith(ontInfo.recordId, ontInfo.branchId, ontInfo.commitId);
                expect(ontologyManagerStub.getImportedIris).toHaveBeenCalledWith(ontInfo.recordId, ontInfo.branchId, ontInfo.commitId);
            });
        });
    });
    describe('should get the list of classes from the imports closure of a source ontology', function() {
        it('unless an error occurs', async function() {
            ontologyManagerStub.postQueryResults.and.returnValue(throwError(error));
            await service.retrieveClasses(ontInfo, 'custom search')
                .subscribe(() => fail('Observable should have failed'), response => {
                    expect(response).toEqual(error);
                });
            expect(ontologyManagerStub.postQueryResults).toHaveBeenCalledWith(ontInfo.recordId, ontInfo.branchId, ontInfo.commitId, 
                jasmine.stringContaining('custom search'), 'application/json', true, false, false);
        });
        it('successfully', async function() {
            const results: SPARQLSelectResults = {
                head: { vars: [], link: [] },
                results: { bindings: [
                    { 
                        iri: { value: 'class1', type: 'uri' },
                        name: { value: 'Class 1', type: 'string' },
                        description: { value: 'Class 1 Description', type: 'string' },
                        deprecated: { value: 'false', type: 'boolean' }
                    }, { 
                      iri: { value: 'class2', type: 'uri' },
                      name: { value: 'Class 2', type: 'string' },
                      deprecated: { value: 'true', type: 'boolean' }
                  },
                ] }
            };
            ontologyManagerStub.postQueryResults.and.returnValue(of(results));
            await service.retrieveClasses(ontInfo, 'custom search').subscribe(result => {
                expect(result.length).toEqual(2);
                expect(result).toContain({
                    iri: 'class1',
                    name: 'Class 1',
                    description: 'Class 1 Description',
                    deprecated: false
                });
                expect(result).toContain({
                    iri: 'class2',
                    name: 'Class 2',
                    description: '',
                    deprecated: true
                });
            }, () => fail('Observable should have succeeded'));
            expect(ontologyManagerStub.postQueryResults).toHaveBeenCalledWith(ontInfo.recordId, ontInfo.branchId, ontInfo.commitId, 
                jasmine.stringContaining('custom search'), 'application/json', true, false, false);
        });
    });
    describe('should retrieve specific classes from the imports closure of the selected Mapping', function() {
        it('unless an error occurs', async function() {
            ontologyManagerStub.postQueryResults.and.returnValue(throwError(error));
            await service.retrieveSpecificClasses(ontInfo, [mappingClass.iri]).subscribe(() => fail('Observable should have failed'), result => {
                expect(result).toEqual(error);
            });
            expect(ontologyManagerStub.postQueryResults).toHaveBeenCalledWith(ontInfo.recordId, ontInfo.branchId, ontInfo.commitId, 
                jasmine.stringContaining(mappingClass.iri), 'application/json');
        });
        it('unless no classes are found', async function() {
            ontologyManagerStub.postQueryResults.and.returnValue(of(null));
            await service.retrieveSpecificClasses(ontInfo, [mappingClass.iri]).subscribe(result => {
                expect(result).toEqual([]);
            }, () => fail('Observable should have succeeded'));
            expect(ontologyManagerStub.postQueryResults).toHaveBeenCalledWith(ontInfo.recordId, ontInfo.branchId, ontInfo.commitId, 
                jasmine.stringContaining(mappingClass.iri), 'application/json');
        });
        it('successfully with one IRI', async function() {
            const results: SPARQLSelectResults = {
              head: { vars: [], link: [] },
              results: { bindings: [ {
                  iri: { value: mappingClass.iri, type: 'uri' },
                  name: { value: mappingClass.name, type: 'string' },
                  description: { value: mappingClass.description, type: 'string' },
              } ] }
            };
            ontologyManagerStub.postQueryResults.and.returnValue(of(results));
            await service.retrieveSpecificClasses(ontInfo, [mappingClass.iri]).subscribe(result => {
                expect(result).toEqual([mappingClass]);
            }, () => fail('Observable should have succeeded'));
            expect(ontologyManagerStub.postQueryResults).toHaveBeenCalledWith(ontInfo.recordId, ontInfo.branchId, ontInfo.commitId, 
                jasmine.stringContaining(mappingClass.iri), 'application/json');
        });
        it('successfully with multiple IRIs', async function() {
            const otherMappingClass: MappingClass = {
                iri: 'otherClass',
                name: 'Other Class',
                description: 'Other Description',
                deprecated: true
            };
            const results: SPARQLSelectResults = {
              head: { vars: [], link: [] },
              results: { bindings: [ 
                  {
                    iri: { value: mappingClass.iri, type: 'uri' },
                    name: { value: mappingClass.name, type: 'string' },
                    description: { value: mappingClass.description, type: 'string' },
                  },
                  {
                    iri: { value: otherMappingClass.iri, type: 'uri' },
                    name: { value: otherMappingClass.name, type: 'string' },
                    description: { value: otherMappingClass.description, type: 'string' },
                    deprecated: { value: 'true', type: 'boolean' },
                  },
              ] }
            };
            ontologyManagerStub.postQueryResults.and.returnValue(of(results));
            await service.retrieveSpecificClasses(ontInfo, [mappingClass.iri, otherMappingClass.iri]).subscribe(result => {
                expect(result).toEqual([mappingClass, otherMappingClass]);
            }, () => fail('Observable should have succeeded'));
            expect(ontologyManagerStub.postQueryResults).toHaveBeenCalledWith(ontInfo.recordId, ontInfo.branchId, ontInfo.commitId, 
                jasmine.stringContaining(`<${mappingClass.iri}> <${otherMappingClass.iri}>`), 'application/json');
        });
    });
    describe('should get the list of properties for a class from the imports closure of a source ontology', function() {
        it('unless an error occurs', async function() {
            ontologyManagerStub.postQueryResults.and.returnValue(throwError(error));
            await service.retrieveProps(ontInfo, classId, 'custom search')
                .subscribe(() => fail('Observable should have failed'), response => {
                    expect(response).toEqual(error);
                });
            expect(ontologyManagerStub.postQueryResults).toHaveBeenCalledWith(ontInfo.recordId, ontInfo.branchId, ontInfo.commitId, 
                jasmine.stringContaining('custom search'), 'application/json', true, false, false);
        });
        it('successfully', async function() {
            const results: SPARQLSelectResults = {
                head: { vars: [], link: [] },
                results: { bindings: [
                    { 
                        iri: { value: 'prop1', type: 'uri' },
                        type: { value: `${OWL}ObjectProperty`, type: 'uri' },
                        name: { value: 'Prop 1', type: 'string' },
                        description: { value: 'Prop 1 Description', type: 'string' },
                        deprecated: { value: 'false', type: 'boolean' },
                        ranges: { value: '', type: 'string' }
                    }, { 
                      iri: { value: 'prop2', type: 'uri' },
                      type: { value: `${OWL}DatatypeProperty`, type: 'uri' },
                      name: { value: 'Prop 2', type: 'string' },
                      deprecated: { value: 'true', type: 'boolean' },
                      ranges: { value: `${XSD}string�${XSD}boolean`, type: 'string' }
                    },
                ] }
            };
            ontologyManagerStub.postQueryResults.and.returnValue(of(results));
            await service.retrieveProps(ontInfo, classId, 'custom search').subscribe(result => {
                expect(result.length).toEqual(2);
                expect(result).toContain({
                    iri: 'prop1',
                    type: `${OWL}ObjectProperty`,
                    name: 'Prop 1',
                    description: 'Prop 1 Description',
                    deprecated: false,
                    ranges: []
                });
                expect(result).toContain({
                    iri: 'prop2',
                    type: `${OWL}DatatypeProperty`,
                    name: 'Prop 2',
                    description: '',
                    deprecated: true,
                    ranges: [`${XSD}string`, `${XSD}boolean`]
                });
            }, () => fail('Observable should have succeeded'));
            expect(ontologyManagerStub.postQueryResults).toHaveBeenCalledWith(ontInfo.recordId, ontInfo.branchId, ontInfo.commitId, 
                jasmine.stringContaining('custom search'), 'application/json', true, false, false);
        });
    });
    describe('should retrieve specific properties from the imports closure of the selected Mapping', function() {
        it('unless an error occurs', async function() {
            ontologyManagerStub.postQueryResults.and.returnValue(throwError(error));
            await service.retrieveSpecificProps(ontInfo, [{ iri: mappingProperty.iri, type: mappingProperty.type }]).subscribe(() => fail('Observable should have failed'), result => {
                expect(result).toEqual(error);
            });
            expect(ontologyManagerStub.postQueryResults).toHaveBeenCalledWith(ontInfo.recordId, ontInfo.branchId, ontInfo.commitId, 
                jasmine.stringContaining(mappingProperty.iri), 'application/json');
        });
        it('unless no properties are found', async function() {
            ontologyManagerStub.postQueryResults.and.returnValue(of(null));
            await service.retrieveSpecificProps(ontInfo, [{ iri: mappingProperty.iri, type: mappingProperty.type }]).subscribe(result => {
                expect(result).toEqual([]);
            }, () => fail('Observable should have succeeded'));
            expect(ontologyManagerStub.postQueryResults).toHaveBeenCalledWith(ontInfo.recordId, ontInfo.branchId, ontInfo.commitId, 
                jasmine.stringContaining(mappingProperty.iri), 'application/json');
        });
        it('successfully with one IRI', async function() {
            const results: SPARQLSelectResults = {
              head: { vars: [], link: [] },
              results: { bindings: [ {
                  iri: { value: mappingProperty.iri, type: 'uri' },
                  type: { value: mappingProperty.type, type: 'uri' },
                  name: { value: mappingProperty.name, type: 'string' },
                  ranges: { value: '', type: 'string' },
              } ] }
            };
            ontologyManagerStub.postQueryResults.and.returnValue(of(results));
            await service.retrieveSpecificProps(ontInfo, [{ iri: mappingProperty.iri, type: mappingProperty.type }]).subscribe(result => {
                expect(result).toEqual([mappingProperty]);
            }, () => fail('Observable should have succeeded'));
            expect(ontologyManagerStub.postQueryResults).toHaveBeenCalledWith(ontInfo.recordId, ontInfo.branchId, ontInfo.commitId, 
                jasmine.stringContaining(mappingProperty.iri), 'application/json');
        });
        it('successfully with multiple IRIs', async function() {
            const otherMappingProperty: MappingProperty = {
                iri: 'otherProp',
                type: `${OWL}ObjectProperty`,
                name: 'Other Property',
                description: 'Other Description',
                deprecated: true,
                ranges: [classId]
            };
            const results: SPARQLSelectResults = {
              head: { vars: [], link: [] },
              results: { bindings: [ 
                  {
                      iri: { value: mappingProperty.iri, type: 'uri' },
                      type: { value: mappingProperty.type, type: 'uri' },
                      name: { value: mappingProperty.name, type: 'string' },
                      ranges: { value: '', type: 'string' },
                  },
                  {
                    iri: { value: otherMappingProperty.iri, type: 'uri' },
                    type: { value: otherMappingProperty.type, type: 'uri' },
                    name: { value: otherMappingProperty.name, type: 'string' },
                    description: { value: otherMappingProperty.description, type: 'string' },
                    deprecated: { value: 'true', type: 'boolean' },
                    ranges: { value: classId, type: 'string' },
                  },
              ] }
            };
            ontologyManagerStub.postQueryResults.and.returnValue(of(results));
            await service.retrieveSpecificProps(ontInfo, [{ iri: mappingProperty.iri, type: mappingProperty.type }, { iri: otherMappingProperty.iri, type: otherMappingProperty.type}]).subscribe(result => {
                expect(result).toEqual([mappingProperty, otherMappingProperty]);
            }, () => fail('Observable should have succeeded'));
            expect(ontologyManagerStub.postQueryResults).toHaveBeenCalledWith(ontInfo.recordId, ontInfo.branchId, ontInfo.commitId, 
                jasmine.stringContaining(`(<${mappingProperty.iri}> <${mappingProperty.type}>) (<${otherMappingProperty.iri}> <${otherMappingProperty.type}>)`), 'application/json');
        });
    });
});
