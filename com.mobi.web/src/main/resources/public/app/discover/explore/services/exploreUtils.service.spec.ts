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
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MockProvider } from 'ng-mocks';
import { of, throwError } from 'rxjs';

import { SharedModule } from '../../../shared/shared.module';
import { DatasetManagerService } from '../../../shared/services/datasetManager.service';
import { OntologyManagerService } from '../../../shared/services/ontologyManager.service';
import { SparqlManagerService } from '../../../shared/services/sparqlManager.service';
import { PropertyDetails } from '../../models/propertyDetails.interface';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { JSONLDValue } from '../../../shared/models/JSONLDValue.interface';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { DATASET, OWL, RDF, XSD } from '../../../prefixes';
import { ExploreUtilsService } from './exploreUtils.service';
import { REGEX } from '../../../constants';

describe('Explore Utils Service', function() {
    let exploreUtilsService : ExploreUtilsService;
    let ontologyManagerStub: jasmine.SpyObj<OntologyManagerService>;
    let datasetManagerStub: jasmine.SpyObj<DatasetManagerService>;
    let fewProperties: PropertyDetails[];
    let allProperties: PropertyDetails[];

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                HttpClientTestingModule, 
                SharedModule
            ],
            providers: [
                ExploreUtilsService,
                MockProvider(DatasetManagerService),
                MockProvider(SparqlManagerService),
                MockProvider(OntologyManagerService),
                MockProvider(OntologyStateService),
            ]
        });
    });

    beforeEach(() => {
        datasetManagerStub = TestBed.inject(DatasetManagerService) as jasmine.SpyObj<DatasetManagerService>;
        exploreUtilsService = TestBed.inject(ExploreUtilsService) as jasmine.SpyObj<ExploreUtilsService>;
        ontologyManagerStub = TestBed.inject(OntologyManagerService) as jasmine.SpyObj<OntologyManagerService>;

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
                range: [`${XSD}boolean`],
                restrictions: []
            }
        ];
        allProperties = [
                {
                propertyIRI: 'id1',
                type: 'Data',
                range: [`${XSD}dateTime`],
                restrictions: []
            }, {
                propertyIRI: 'id2',
                type: 'Data',
                range: [`${XSD}dateTimeStamp`],
                restrictions: []
            }, {
                propertyIRI: 'id3',
                type: 'Data',
                range: [`${XSD}decimal`],
                restrictions: []
            }, {
                propertyIRI: 'id4',
                type: 'Data',
                range: [`${XSD}double`],
                restrictions: []
            }, {
                propertyIRI: 'id5',
                type: 'Data',
                range: [`${XSD}float`],
                restrictions: []
            }, {
                propertyIRI: 'id6',
                type: 'Data',
                range: [`${XSD}int`],
                restrictions: []
            }, {
                propertyIRI: 'id7',
                type: 'Data',
                range: [`${XSD}integer`],
                restrictions: []
            }, {
                propertyIRI: 'id8',
                type: 'Data',
                range: [`${XSD}long`],
                restrictions: []
            }, {
                propertyIRI: 'id9',
                type: 'Data',
                range: [`${XSD}short`],
                restrictions: []
            }, {
                propertyIRI: 'id10',
                type: 'Data',
                range: [`${XSD}other`],
                restrictions: []
            }
        ];
    });

    afterEach(() => {
        datasetManagerStub = null;
        exploreUtilsService = null;
        ontologyManagerStub = null;
        fewProperties = null;
        allProperties = null;
    });

    it('getInputType should return the correct input type', function() {
        spyOn(exploreUtilsService, 'getRange').and.returnValue('iri');
        expect(exploreUtilsService.getInputType('id', [])).toBe('text');
        expect(exploreUtilsService.getRange).toHaveBeenCalledWith('id', []);
    });
    it('getPattern should return the correct pattern', function() {
        spyOn(exploreUtilsService, 'getRange').and.returnValue('iri');
        expect(exploreUtilsService.getPattern('id', [])).toEqual(REGEX.ANYTHING);
        expect(exploreUtilsService.getRange).toHaveBeenCalledWith('id', []);
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
            expect(exploreUtilsService.getRange('id1', allProperties)).toEqual(`${XSD}dateTime`);
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
            identifier = {
              '@id': 'id',
              [`${DATASET}linksToRecord`]: [{ '@id': 'recordId' }],
              [`${DATASET}linksToBranch`]: [{ '@id': 'branchId' }],
              [`${DATASET}linksToCommit`]: [{ '@id': 'commitId' }],
            };
            datasetManagerStub.datasetRecords = [[record, identifier]];
            datasetManagerStub.getOntologyIdentifiers.and.returnValue([identifier]);
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
            ontologyManagerStub.getOntologyClasses.and.returnValue(throwError('Error Message'));
            exploreUtilsService.getClasses(this.datasetId)
                .subscribe(function() {
                    fail('Observable should have rejected'); 
                }, function(response) {
                    expect(response).toEqual('The Dataset ontologies could not be found');
                });
            expect(datasetManagerStub.getOntologyIdentifiers).toHaveBeenCalledWith(datasetManagerStub.datasetRecords[0]);
            expect(ontologyManagerStub.getOntologyClasses).toHaveBeenCalledWith('recordId', 'branchId', 'commitId', false);
        });
        it('unless no classes are retrieved',function() {
            ontologyManagerStub.getOntologyClasses.and.returnValue(of([]));
            exploreUtilsService.getClasses(this.datasetId)
                .subscribe(function() {
                    fail('Observable should have rejected');
                }, function(response) {
                    expect(response).toEqual('The Dataset classes could not be retrieved');
                });
            expect(datasetManagerStub.getOntologyIdentifiers).toHaveBeenCalledWith(datasetManagerStub.datasetRecords[0]);
            expect(ontologyManagerStub.getOntologyClasses).toHaveBeenCalledWith('recordId', 'branchId', 'commitId', false);
        });
        it('successfully', function() {
            ontologyManagerStub.getEntityName.and.returnValue('title');
            ontologyManagerStub.getOntologyClasses.and.returnValue(of([{'@id': 'classId', [`${OWL}deprecated`]: [{ '@value': 'true'}] }]));
            exploreUtilsService.getClasses(this.datasetId)
                .subscribe(function(response) {
                    expect(response).toContain({id: 'classId', title: 'title', deprecated: true});
                }, function() {
                    fail('Observable should have resolved');
                });
            expect(datasetManagerStub.getOntologyIdentifiers).toHaveBeenCalledWith(datasetManagerStub.datasetRecords[0]);
            expect(ontologyManagerStub.getOntologyClasses).toHaveBeenCalledWith('recordId', 'branchId', 'commitId', false);
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
                    'range': [`${XSD}boolean`],
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
                    'range': [`${XSD}boolean`],
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
        const expectedArray: JSONLDObject[] = [{'@id': 'id', prop: 'new'}, {'@id': 'id', prop: 'new'}];
        expect(exploreUtilsService.removeEmptyPropertiesFromArray(array)).toEqual(expectedArray);
        array.forEach(function(item) {
            expect(exploreUtilsService.removeEmptyProperties).toHaveBeenCalledWith(item);
        });
    });
    it('getReification should find a Statement object for the identified statement', function() {
        const sub = 'subject';
        const pred = 'predicate';
        const value: JSONLDValue = {'@value': 'value'};
        const array: JSONLDObject[] = [
            {'@id': 'id', '@type': [`${RDF}Statement`]},
            {'@id': 'id', '@type': [`${RDF}Statement`]},
            {'@id': 'id', '@type': [`${RDF}Statement`]},
            {'@id': 'id', '@type': [`${RDF}Statement`]}
        ];
        array[0][`${RDF}subject`] = [{'@id': sub}];
        array[2][`${RDF}subject`] = [{'@id': sub}];
        array[3][`${RDF}subject`] = [{'@id': sub}];
        array[0][`${RDF}predicate`] = [{'@id': pred}];
        array[1][`${RDF}predicate`] = [{'@id': pred}];
        array[3][`${RDF}predicate`] = [{'@id': pred}];
        array[0][`${RDF}object`] = [value];
        array[1][`${RDF}object`] = [value];
        array[2][`${RDF}object`] = [value];

        expect(exploreUtilsService.getReification(array, sub, pred, value)).toEqual(array[0]);
        expect(exploreUtilsService.getReification(array, '', pred, value)).toBeUndefined();
        expect(exploreUtilsService.getReification(array, sub, '', value)).toBeUndefined();
        expect(exploreUtilsService.getReification(array, sub, pred, null)).toBeUndefined();
    });
});
