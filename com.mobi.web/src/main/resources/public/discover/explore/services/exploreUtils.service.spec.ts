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
import {fakeAsync, TestBed, tick} from '@angular/core/testing';
import { configureTestSuite } from 'ng-bullet';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import _ = require('lodash');

import {
    mockOntologyState,
    mockUtil
} from '../../../../../../test/ts/Shared';

import { SharedModule } from '../../../shared/shared.module';

import { ExploreUtilsService } from './exploreUtils.service';
import { DatasetManagerService } from '../../../shared/services/datasetManager.service';
import { OntologyManagerService } from '../../../shared/services/ontologyManager.service';
import { MockProvider } from 'ng-mocks';
import prefixes from '../../../shared/services/prefixes.service';
import { SparqlManagerService } from '../../../shared/services/sparqlManager.service';
import { PropertyDetails } from '../../models/propertyDetails.interface';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { JSONLDValue } from '../../../shared/models/JSONLDValue.interface';
import { of, throwError } from 'rxjs';

describe('Explore Utils Service', function() {
    let exploreUtilsService : ExploreUtilsService;
    let httpMock: HttpTestingController;
    let sparqlManagerServicesStub: jasmine.SpyObj<SparqlManagerService>;
    let ontologyManagerServiceStub: jasmine.SpyObj<OntologyManagerService>;
    let utilServiceStub: jasmine.SpyObj<any>;
    let datasetManagerServiceStub: jasmine.SpyObj<DatasetManagerService>;
    let prefixesStub: any;
    let fewProperties: PropertyDetails[];
    let allProperties: PropertyDetails[];

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [
                HttpClientTestingModule, 
                SharedModule
            ],
            providers: [
                ExploreUtilsService,
                MockProvider(DatasetManagerService),
                MockProvider(SparqlManagerService),
                MockProvider(OntologyManagerService),
                { provide: 'ontologyStateService', useClass: mockOntologyState },
                { provide: 'utilService', useClass: mockUtil }
            ]
        });
    });

    beforeEach(() => {
        httpMock = TestBed.get(HttpTestingController);
        datasetManagerServiceStub = TestBed.get(DatasetManagerService);
        exploreUtilsService = TestBed.get(ExploreUtilsService);
        sparqlManagerServicesStub = TestBed.get(SparqlManagerService);
        ontologyManagerServiceStub = TestBed.get(OntologyManagerService);
        utilServiceStub = TestBed.get('utilService');
        prefixesStub = new prefixes();

        fewProperties = [
            {
                propertyIRI: 'propertyId',
                type: 'Data',
                range: ['string'], 
                restrictions: []
            }, {
                propertyIRI: 'propertyId2',
                type: 'Object',
                range: [],
                restrictions: []
            }, {
                propertyIRI: 'propertyId3',
                type: 'Data',
                range: [prefixesStub.xsd + 'boolean'],
                restrictions: []
            }
        ];
        allProperties = [
                {
                propertyIRI: 'id1',
                type: 'Data',
                range: [prefixesStub.xsd + 'dateTime'],
                restrictions: []
            }, {
                propertyIRI: 'id2',
                type: 'Data',
                range: [prefixesStub.xsd + 'dateTimeStamp'],
                restrictions: []
            }, {
                propertyIRI: 'id3',
                type: 'Data',
                range: [prefixesStub.xsd + 'decimal'],
                restrictions: []
            }, {
                propertyIRI: 'id4',
                type: 'Data',
                range: [prefixesStub.xsd + 'double'],
                restrictions: []
            }, {
                propertyIRI: 'id5',
                type: 'Data',
                range: [prefixesStub.xsd + 'float'],
                restrictions: []
            }, {
                propertyIRI: 'id6',
                type: 'Data',
                range: [prefixesStub.xsd + 'int'],
                restrictions: []
            }, {
                propertyIRI: 'id7',
                type: 'Data',
                range: [prefixesStub.xsd + 'integer'],
                restrictions: []
            }, {
                propertyIRI: 'id8',
                type: 'Data',
                range: [prefixesStub.xsd + 'long'],
                restrictions: []
            }, {
                propertyIRI: 'id9',
                type: 'Data',
                range: [prefixesStub.xsd + 'short'],
                restrictions: []
            }, {
                propertyIRI: 'id10',
                type: 'Data',
                range: [prefixesStub.xsd + 'other'],
                restrictions: []
            }
        ];
    });

    afterEach(() => {
        // httpMock.verify();
        datasetManagerServiceStub = null;
        exploreUtilsService = null;
        sparqlManagerServicesStub = null;
        ontologyManagerServiceStub = null;
        utilServiceStub = null;
        prefixesStub = null
        fewProperties = null;
        allProperties = null;
    });

    it('getInputType should return the correct input type', function() {
        utilServiceStub.getInputType.and.returnValue('type');
        spyOn(exploreUtilsService, 'getRange').and.returnValue('iri');
        expect(exploreUtilsService.getInputType('id', [])).toBe('type');
        expect(exploreUtilsService.getRange).toHaveBeenCalledWith('id', []);
        expect(utilServiceStub.getInputType).toHaveBeenCalledWith('iri');
    });
    it('getPattern should return the correct pattern', function() {
        utilServiceStub.getPattern.and.returnValue(/[a-zA-Z]/);
        spyOn(exploreUtilsService, 'getRange').and.returnValue('iri');
        expect(exploreUtilsService.getPattern('id', [])).toEqual(/[a-zA-Z]/);
        expect(exploreUtilsService.getRange).toHaveBeenCalledWith('id', []);
        expect(utilServiceStub.getPattern).toHaveBeenCalledWith('iri');
    });
    it('isPropertyOfType should return the proper boolean based on the properties list', function() {
        expect(exploreUtilsService.isPropertyOfType('propertyId', 'Data', fewProperties)).toBe(true);
        expect(exploreUtilsService.isPropertyOfType('propertyId', 'Object', fewProperties)).toBe(false);
        expect(exploreUtilsService.isPropertyOfType('missingId', 'Data', fewProperties)).toBe(false);
    });
    it('isBoolean should return the correct boolean', function() {
        expect(exploreUtilsService.isBoolean('propertyId', fewProperties)).toBe(false);
        expect(exploreUtilsService.isBoolean('propertyId3', fewProperties)).toBe(true);
    });
    it('createIdObj should return an appropriate object', function() {
        expect(exploreUtilsService.createIdObj('id')).toEqual({'@id': 'id'});
    });
    describe('createValueObj should create correct object for the provided string', function() {
        it('with a type', function() {
            expect(exploreUtilsService.createValueObj('value', 'propertyId', fewProperties)).toEqual({'@value': 'value', '@type': 'string'});
        });
        it('without a type', function() {
            expect(exploreUtilsService.createValueObj('value', 'propertyId2', fewProperties)).toEqual({'@value': 'value'});
        });
    });
    describe('getRange should return the correct range if propertyIRI is', function() {
        it('found', function() {
            expect(exploreUtilsService.getRange('id1', allProperties)).toEqual(prefixesStub.xsd + 'dateTime');
        });
        it('not found', function() {
            expect(exploreUtilsService.getRange('missing-id', allProperties)).toEqual('');
        });
    });
    describe('contains should return the correct value when the lowered string is', function() {
        it('contained', function() {
            expect(exploreUtilsService.contains('WORD', 'w')).toBe(true);
        });
        it('not contained', function() {
            expect(exploreUtilsService.contains('MISSING', 'w')).toBe(false);
        });
    });
    describe('getClasses should retrieve all classes from ontologies in a dataset', function() {
        let record: JSONLDObject;
        let identifier: JSONLDObject;
        beforeEach(function() {
       
            record = {'@id': this.datasetId};
            identifier = {'@id': 'id'};
            datasetManagerServiceStub.datasetRecords = [[record, identifier]];
            datasetManagerServiceStub.getOntologyIdentifiers.and.returnValue([identifier]);
            utilServiceStub.getPropertyId.and.callFake(function(obj, propId) {
                if (propId === prefixesStub.dataset + 'linksToRecord') {
                    return 'recordId';
                } else if (propId === prefixesStub.dataset + 'linksToBranch') {
                    return 'branchId';
                } else if (propId === prefixesStub.dataset + 'linksToCommit') {
                    return 'commitId';
                } else {
                    return '';
                }
            });
        });
        it('unless the dataset could not be found', function() {
            exploreUtilsService.getClasses('')
                .subscribe(function() {
                    fail('Observable should have rejected');
                }, function(response) {
                    expect(response).toEqual('Dataset could not be found');
                });
        });
        it('unless an error occurs', function() {
            ontologyManagerServiceStub.getOntologyClasses.and.returnValue(throwError('Error Message'));
            exploreUtilsService.getClasses(this.datasetId)
                .subscribe(function() {
                    fail('Observable should have rejected'); 
                }, function(response) {
                    expect(response).toEqual('The Dataset ontologies could not be found');
                });
            expect(datasetManagerServiceStub.getOntologyIdentifiers).toHaveBeenCalledWith(datasetManagerServiceStub.datasetRecords[0]);
            expect(ontologyManagerServiceStub.getOntologyClasses).toHaveBeenCalledWith('recordId', 'branchId', 'commitId', false);
        });
        it('unless no classes are retrieved',function() {
            ontologyManagerServiceStub.getOntologyClasses.and.returnValue(of([]));
            exploreUtilsService.getClasses(this.datasetId)
                .subscribe(function() {
                    fail('Observable should have rejected');
                }, function(response) {
                    expect(response).toEqual('The Dataset classes could not be retrieved');
                });
            expect(datasetManagerServiceStub.getOntologyIdentifiers).toHaveBeenCalledWith(datasetManagerServiceStub.datasetRecords[0]);
            expect(ontologyManagerServiceStub.getOntologyClasses).toHaveBeenCalledWith('recordId', 'branchId', 'commitId', false);
        });
        it('successfully', function() {
            utilServiceStub.getPropertyValue.and.returnValue(true);
            ontologyManagerServiceStub.getEntityName.and.returnValue('title');
            ontologyManagerServiceStub.getOntologyClasses.and.returnValue(of([{'@id': 'classId'}]));
            exploreUtilsService.getClasses(this.datasetId)
                .subscribe(function(response) {
                    expect(response).toContain({id: 'classId', title: 'title', deprecated: true});
                }, function() {
                    fail('Observable should have resolved');
                });
            expect(datasetManagerServiceStub.getOntologyIdentifiers).toHaveBeenCalledWith(datasetManagerServiceStub.datasetRecords[0]);
            expect(ontologyManagerServiceStub.getOntologyClasses).toHaveBeenCalledWith('recordId', 'branchId', 'commitId', false);
        });
    });
    describe('getNewProperties should return a list of properties that are not set on the entity', function() {
        let entity: JSONLDObject;
        beforeEach(function() {
            entity = {
                '@id': 'id',
                '@type': ['type'],
                'prop1': [{
                    '@id': 'http://mobi.com/id'
                }],
                'prop2': [{
                    '@value': 'value1'
                }, {
                    '@value': 'value2'
                }]
            };
        });
        it('without filtering', function() {
            const expectedArray: PropertyDetails[] = [
                {
                    'propertyIRI': 'propertyId',
                    'type': 'Data',
                    'range': ['string'],
                    'restrictions': []
                },
                {
                    'propertyIRI': 'propertyId2',
                    'type': 'Object',
                    'range': [],
                    'restrictions': []
                },
                {
                    'propertyIRI': 'propertyId3',
                    'type': 'Data',
                    'range': ['http://www.w3.org/2001/XMLSchema#boolean'],
                    'restrictions': []
                }
            ];
            expect(exploreUtilsService.getNewProperties(fewProperties, entity, '')).toEqual(expectedArray);
        });
        it('with filtering', function() {
            const expectedArray: PropertyDetails[] = [
                {
                    'propertyIRI': 'propertyId3',
                    'type': 'Data',
                    'range': ['http://www.w3.org/2001/XMLSchema#boolean'],
                    'restrictions': []
                }
            ];
            expect(exploreUtilsService.getNewProperties(fewProperties, entity, 'iD3')).toEqual(expectedArray);
        });
    });
    it('removeEmptyProperties should remove properties that are empty arrays', function() {
        const object: JSONLDObject = {'@id': 'id', prop: []};
        const expected: JSONLDObject = {'@id': 'id'};
        expect(exploreUtilsService.removeEmptyProperties(object)).toEqual(expected);
    });
    it('removeEmptyPropertiesFromArray should call the proper method for each item in the array', function() {
        spyOn(exploreUtilsService, 'removeEmptyProperties').and.returnValue({'@id': 'id', prop: 'new'});
        const array: JSONLDObject[] = [{
            '@id': 'id'
        }, {
            '@id': '_:b0'
        }];
        const expectedArray: JSONLDObject[] = [{'@id': 'id', prop: 'new'}, {'@id': 'id', prop: 'new'}]
        expect(exploreUtilsService.removeEmptyPropertiesFromArray(array)).toEqual(expectedArray);
        _.forEach(array, function(item) {
            expect(exploreUtilsService.removeEmptyProperties).toHaveBeenCalledWith(item);
        });
    });
    it('getReification should find a Statement object for the identified statement', function() {
        const sub = 'subject';
        const pred = 'predicate';
        const value: JSONLDValue = {'@value': 'value'};
        const array: JSONLDObject[] = [
            {'@id': 'id', '@type': [prefixesStub.rdf + 'Statement']},
            {'@id': 'id', '@type': [prefixesStub.rdf + 'Statement']},
            {'@id': 'id', '@type': [prefixesStub.rdf + 'Statement']},
            {'@id': 'id', '@type': [prefixesStub.rdf + 'Statement']}
        ];
        array[0][prefixesStub.rdf + 'subject'] = [{'@id': sub}];
        array[2][prefixesStub.rdf + 'subject'] = [{'@id': sub}];
        array[3][prefixesStub.rdf + 'subject'] = [{'@id': sub}];
        array[0][prefixesStub.rdf + 'predicate'] = [{'@id': pred}];
        array[1][prefixesStub.rdf + 'predicate'] = [{'@id': pred}];
        array[3][prefixesStub.rdf + 'predicate'] = [{'@id': pred}];
        array[0][prefixesStub.rdf + 'object'] = [value];
        array[1][prefixesStub.rdf + 'object'] = [value];
        array[2][prefixesStub.rdf + 'object'] = [value];

        expect(exploreUtilsService.getReification(array, sub, pred, value)).toEqual(array[0]);
        expect(exploreUtilsService.getReification(array, '', pred, value)).toBeUndefined();
        expect(exploreUtilsService.getReification(array, sub, '', value)).toBeUndefined();
        expect(exploreUtilsService.getReification(array, sub, pred, null)).toBeUndefined();
    });
});
