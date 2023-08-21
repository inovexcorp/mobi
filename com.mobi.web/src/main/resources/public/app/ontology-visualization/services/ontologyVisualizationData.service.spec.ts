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
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { forkJoin, of } from 'rxjs';
import { MockProvider } from 'ng-mocks';

import { cleanStylesFromDOM } from '../../../test/ts/Shared';
import { SharedModule } from '../../shared/shared.module';
import { OntologyStateService } from '../../shared/services/ontologyState.service';
import { OntologyManagerService } from '../../shared/services/ontologyManager.service';
import { OntologyListItem } from '../../shared/models/ontologyListItem.class';
import { HierarchyResponse } from '../../shared/models/hierarchyResponse.interface';
import { EntityNames } from '../../shared/models/entityNames.interface';
import { IriList } from '../../shared/models/iriList.interface';
import { PropertyToRanges } from '../../shared/models/propertyToRanges.interface';
import { ProgressSpinnerService } from '../../shared/components/progress-spinner/services/progressSpinner.service'
import { listItem, visData } from './testData';
import { OntologyVisualizationDataService } from './ontologyVisualizationData.service';

describe('OntologyVisualization Data Service', () => {
    let dataVisualizationStub : OntologyVisualizationDataService;
    let httpMock: HttpTestingController;
    let ontologyStateStub: jasmine.SpyObj<OntologyStateService>;
    let ontologyManagerServiceStub: jasmine.SpyObj<OntologyManagerService>;
    let spinnerSrvStub: jasmine.SpyObj<ProgressSpinnerService>;
    let httpTestingController: HttpTestingController;
    let mockRequest = (obj) => of(obj);
    let graphState;
    let observer;
    let classHierarchies, propertyToRange, ontologyEntityNames, resultData;
    let emptyIriList: IriList[];

    beforeEach(async() => {
        await TestBed.configureTestingModule({
            imports: [HttpClientTestingModule, SharedModule],
            providers: [
                OntologyVisualizationDataService,
                MockProvider(OntologyStateService),
                MockProvider(OntologyManagerService),
                MockProvider(ProgressSpinnerService)
            ]
        }).compileComponents();

        httpTestingController = TestBed.inject(HttpTestingController);
        dataVisualizationStub = TestBed.inject(OntologyVisualizationDataService);
        httpMock = TestBed.inject(HttpTestingController);
        ontologyStateStub = TestBed.inject(OntologyStateService) as jasmine.SpyObj<OntologyStateService>;
        ontologyManagerServiceStub = TestBed.inject(OntologyManagerService) as jasmine.SpyObj<OntologyManagerService>;
        spinnerSrvStub = TestBed.inject(ProgressSpinnerService) as jasmine.SpyObj<ProgressSpinnerService>;
        const listItemX: OntologyListItem = listItem;
        ontologyStateStub.listItem = Object.freeze(listItem as OntologyListItem);
        ontologyStateStub.addToClassIRIs = jasmine.createSpy('addToClassIRIs').and.callFake((items, iri) => {
            items.classes.iris = listItem.classes.iris;
        });
        emptyIriList = [
            {
                id: '1',
                annotationProperties: [],
                classes: [],
                datatypes: [],
                objectProperties: [],
                dataProperties: [],
                namedIndividuals: [],
                concepts: [],
                conceptSchemes: [],
                derivedConcepts: [],
                derivedConceptSchemes: [],
                derivedSemanticRelations: [],
                deprecatedIris: []
            },
            {
                id: '2',
                annotationProperties: [],
                classes: [],
                datatypes: [],
                objectProperties: [],
                dataProperties: [],
                namedIndividuals: [],
                concepts: [],
                conceptSchemes: [],
                derivedConcepts: [],
                derivedConceptSchemes: [],
                derivedSemanticRelations: [],
                deprecatedIris: []
            }
        ];
        ontologyManagerServiceStub.getClassHierarchies = jasmine.createSpy('getClassHierarchies').and.returnValue(of(Object.freeze(listItem.classHierarchy as HierarchyResponse)));
        ontologyManagerServiceStub.getOntologyEntityNames = jasmine.createSpy('getOntologyEntityNames').and.returnValue(of(Object.freeze(listItem.entityInfo as EntityNames)));
        ontologyManagerServiceStub.getPropertyToRange = jasmine.createSpy('getPropertyToRange').and.returnValue(of(Object.freeze({propertyToRanges: listItem.propertyToRanges} as PropertyToRanges)));

        observer = {
            next: () => {},
            error: () => {}
        };
        classHierarchies = {
            parentMap: {},
            childMap: {},
            iris: [],
        };

        propertyToRange = {
            propertyToRanges: []
        };

        ontologyEntityNames = {
            classLabels: {},
            propertyLabels: {},
            classComments: {},
            propertyComments: {}
        };

        resultData = {
            ...classHierarchies,
            entityInfo: {...ontologyEntityNames},
            ranges: []
        };
        spyOn(observer,'next').and.callThrough();
        spyOn(observer,'error').and.callThrough();
        graphState =  {
            commitId: 'commitId',
            ontologyId: 'ontologyId',
            recordId: 'recordId',
            importedOntologies: listItem.importedOntologies || [], // * This is object reference
            positioned: false,
            isOverLimit: false,
            nodeLimit: 500,
            allGraphNodes: [],
            allGraphEdges: [],
            selectedNodes: false
        };

        ontologyManagerServiceStub.getImportedIris = jasmine.createSpy('getImportedIris').and.returnValue(of(Object.freeze(emptyIriList as IriList[])));
        //dataVisualizationStub.getOntologyLocalObservable = jasmine.createSpy('getOntologyLocalObservable').and.returnValue(mockRequest(visData));

    });

    afterEach(() => {
        cleanStylesFromDOM();
        httpMock.verify();
        dataVisualizationStub = null;
        ontologyManagerServiceStub = null;
        ontologyStateStub = null;
        httpTestingController.verify();
    });

    // @todo : add more coverage
    describe('buildGraphData', () => {
        it('should return the correct data', async () => {
            const hasInProgressCommit = true;
            spyOn(dataVisualizationStub, 'getOntologyNetworkObservable').and.returnValue(of(visData))
            spyOn(dataVisualizationStub,'graphDataFormat').and.callThrough();

            await dataVisualizationStub.buildGraphData(graphState, hasInProgressCommit).subscribe((result) => {
                expect(dataVisualizationStub.getOntologyNetworkObservable).toHaveBeenCalled();
                expect(dataVisualizationStub.graphDataFormat).toHaveBeenCalled();
            });
        });
    });

    describe('graphDataFormat', () => {
        let ontologyData, commitGraphState;
        beforeEach(() => {
            ontologyData = {
                classParentMap: visData.classParentMap,
                childIris: visData.childIris,
                entityInfo: visData.entityInfo,
                ranges: {}
            };
            commitGraphState = {
                nodeLimit: 100,
                allGraphNodes: [],
                allGraphEdges: [],
                importedOntologies: []
            };
        });

        it('should format ontology data correctly', () => {
            dataVisualizationStub.graphDataFormat(ontologyData, commitGraphState, observer);

            expect(observer.next).toHaveBeenCalledTimes(1);
            expect(observer.error).not.toHaveBeenCalled();
            expect(commitGraphState.allGraphNodes.length).toEqual(101);
            expect(commitGraphState.allGraphEdges.length).toEqual(84);
            expect(commitGraphState.importedOntologies.length).toEqual(0);
        });

        it('should handle no ontology data', () => {
            ontologyData = {};
            dataVisualizationStub.graphDataFormat(ontologyData, commitGraphState, observer);

            expect(observer.next).not.toHaveBeenCalled();
            expect(observer.error).toHaveBeenCalledWith('No classes defined');
            expect(commitGraphState.allGraphNodes.length).toEqual(0);
            expect(commitGraphState.allGraphEdges.length).toEqual(0);
            expect(commitGraphState.importedOntologies.length).toEqual(0);
        });

        it('Should handle an empty ontology', () => {
            ontologyData = {
                classParentMap: {},
                childIris: [],
                entityInfo: {},
                ranges: {}
            };
            dataVisualizationStub.graphDataFormat(ontologyData, commitGraphState, observer);

            expect(observer.next).not.toHaveBeenCalled();
            expect(observer.error).toHaveBeenCalledWith('No classes defined');
            expect(commitGraphState.allGraphNodes.length).toEqual(0);
            expect(commitGraphState.allGraphEdges.length).toEqual(0);
            expect(commitGraphState.importedOntologies.length).toEqual(0);
        });
    });

    //@todo add more coverage 
    describe('getPropertyRange', () => {
        it('Successfully returns an array with property ranges', () => {
            //classToChildProperties, dataProperty, propertyToRanges
            const classToChildProperties = {
                'food': ['prop1', 'prop2'],
                'pizza': ['prop3', 'prop4']
             };
          
             const dataProperty = {
                iris: {
                   prop2: 'http://mobi.test.com/range/1',
                   prop4: 'http://mobi.test.com/range/2'
                }
             };
          
             const propertyToRanges = {
                prop1: ['http://mobi.test.com/range/1', 'http://mobi.test.com/range/2'],
                prop2: ['http://mobi.test.com/range/3'],
                prop3: ['http://mobi.test.com/range/4', 'http://mobi.test.com/range/5'],
                prop4: ['http://mobi.test.com/range/2']
             };
          
             const ranges = dataVisualizationStub.getPropertyRange(classToChildProperties, dataProperty, propertyToRanges);

             expect(ranges).toEqual([
                [
                   { domain: 'food', property: 'prop1', range: 'http://mobi.test.com/range/1' },
                   { domain: 'food', property: 'prop1', range: 'http://mobi.test.com/range/2' },
                  // { domain: 'food', property: 'prop2', range: 'http://mobi.test.com/range/3' }
                ],
                [
                   { domain: 'pizza', property: 'prop3', range: 'http://mobi.test.com/range/4' },
                   { domain: 'pizza', property: 'prop3', range: 'http://mobi.test.com/range/5' }
                ]
             ]);
        });
        it('returns an empty array if classToChildProperties is null', () => {
            const result = dataVisualizationStub.getPropertyRange(null, {}, {});
            expect(result).toEqual([]);
         });
         
         it('throws an error if propertyToRanges is null or undefined', () => {
            // add code here
         });
     });

    describe('getOntologyNetworkObservable', () => {
        it('should return the ontology network data',   async (done) => {

            spinnerSrvStub.track.and.returnValue(forkJoin({
                classHierarchies: ontologyManagerServiceStub.getClassHierarchies('recordId','branchId','commitId', false),
                propertyToRange: ontologyManagerServiceStub.getPropertyToRange('recordId','branchId','commitId', false),
                ontologyEntityNames: ontologyManagerServiceStub.getOntologyEntityNames('recordId','branchId','commitId', false),
                importedIris: of(Object.freeze(emptyIriList as IriList[]))
            }));
             await dataVisualizationStub.getOntologyNetworkObservable().subscribe((data) => {
                 expect(ontologyManagerServiceStub.getClassHierarchies).toHaveBeenCalled();
                 expect(ontologyManagerServiceStub.getPropertyToRange).toHaveBeenCalled();
                 expect(ontologyManagerServiceStub.getOntologyEntityNames).toHaveBeenCalled();
                 expect(ontologyManagerServiceStub.getImportedIris).toHaveBeenCalled();
                 done();
            });
            expect(spinnerSrvStub.track).toHaveBeenCalled()
        });
    });

    describe('getOntologyLocalObservable', () => {
        it('should return the ontology network data',   async (done) => {
            spinnerSrvStub.track.and.returnValue(forkJoin([
               ontologyManagerServiceStub.getPropertyToRange('recordId','branchId','commitId', false)
            ]));
            await dataVisualizationStub.getOntologyLocalObservable().subscribe((data) => {
                expect(ontologyManagerServiceStub.getPropertyToRange).toHaveBeenCalled();
                done();
            });
            expect(spinnerSrvStub.track).toHaveBeenCalled()
        });
    });
});
