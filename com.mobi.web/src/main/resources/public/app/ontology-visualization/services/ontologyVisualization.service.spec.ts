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
import { MockProvider } from 'ng-mocks';
import { of } from 'rxjs';

import { cleanStylesFromDOM } from '../../../test/ts/Shared';
import { OntologyStateService } from '../../shared/services/ontologyState.service';
import { OntologyManagerService } from '../../shared/services/ontologyManager.service';
import { OntologyListItem } from '../../shared/models/ontologyListItem.class';
import { HierarchyResponse } from '../../shared/models/hierarchyResponse.interface';
import { EntityNames } from '../../shared/models/entityNames.interface';
import { IriList } from '../../shared/models/iriList.interface';
import { PropertyToRanges } from '../../shared/models/propertyToRanges.interface';
import { GraphState } from '../classes';
import { ControlRecordUtilsService } from './controlRecordUtils.service';
import { OntologyVisualizationDataService } from './ontologyVisualizationData.service';
import { listItem, visData } from './testData';
import { OntologyVisualizationService } from './ontologyVisualization.service';

describe('OntologyVisualization Service', () => {
    let visualizationStub : OntologyVisualizationService;
    let httpMock: HttpTestingController;
    let ontologyStateStub: jasmine.SpyObj<OntologyStateService>;
    let ontologyManagerServiceStub: jasmine.SpyObj<OntologyManagerService>;
    let ontologyVisualizationDataStub: jasmine.SpyObj<OntologyVisualizationDataService>;
    let controlRecordUtilsServiceStub: jasmine.SpyObj<ControlRecordUtilsService>;
    let stateGraph: GraphState;
    let allGraphNodes;
    let mockRequest = (obj) => of(obj);
    let inProgressCommitObj = {
        additions: [],
        deletions: []
    };
    let observer;

    beforeEach(async() => {
        await TestBed.configureTestingModule({
            imports: [
                HttpClientTestingModule
            ],
            providers: [
                OntologyVisualizationService,
                MockProvider(OntologyStateService),
                MockProvider(OntologyManagerService),
                MockProvider(ControlRecordUtilsService),
                MockProvider(OntologyVisualizationDataService)
            ]
        }).compileComponents();

        visualizationStub = TestBed.inject(OntologyVisualizationService);
        httpMock = TestBed.inject(HttpTestingController);
        ontologyStateStub = TestBed.inject(OntologyStateService) as jasmine.SpyObj<OntologyStateService>;
        ontologyManagerServiceStub = TestBed.inject(OntologyManagerService) as jasmine.SpyObj<OntologyManagerService>;
        ontologyVisualizationDataStub = TestBed.inject(OntologyVisualizationDataService) as jasmine.SpyObj<OntologyVisualizationDataService>;
        const listItemX: OntologyListItem = listItem;
        const graphNodes = [];
        const entityInfo = visData.entityInfo;

        // const entityInfoKeys = Object.keys(entityInfo);
        // for (const key of entityInfoKeys) {
        //     const entity = entityInfo[key];
        //     const node: StateNode = new StateNode();
        //     node.data = {
        //         id: entity.ontologyId,
        //         idInt: entity.ontologyId,
        //         weight: 0,
        //         name: entity.label,
        //         ontologyId: entity.ontologyId,
        //         isImported: entity.imported
        //     };
        //     graphNodes.push(node);
        // }
        observer = {
            next: () => {},
            error: () => {}
        };
        // stateGraph = new GraphState({
        //     commitId: 'commitId',
        //     ontologyId: 'ontologyId',
        //     recordId: listItemX.versionedRdfRecord.recordId,
        //     importedOntologies: listItemX.importedOntologies || [], // * This is object reference
        //     positioned: false,
        //     isOverLimit: false,
        //     nodeLimit: 500,
        //     allGraphNodes: graphNodes,
        //     allGraphEdges: AllEdges,
        //     selectedNodes: false,
        //     allGraphNodesComparer(a: ControlRecordI, b: ControlRecordI): number {
        //         return a?.id?.localeCompare(b?.id);
        //     }
        // });

        ontologyStateStub.listItem = {...listItem} as OntologyListItem;
        ontologyStateStub.listItem.hasPendingRefresh = false;
        ontologyStateStub.addToClassIRIs = jasmine.createSpy('addToClassIRIs').and.callFake((items, iri) => {
            items.classes.iris = listItem.classes.iris;
        });

        ontologyManagerServiceStub.getClassHierarchies = jasmine.createSpy('getClassHierarchies').and.returnValue(of(Object.freeze(listItem.classHierarchy as HierarchyResponse)));
        ontologyManagerServiceStub.getOntologyEntityNames = jasmine.createSpy('getOntologyEntityNames').and.returnValue(of(Object.freeze(listItem.entityInfo as EntityNames)));
        ontologyManagerServiceStub.getPropertyToRange = jasmine.createSpy('getPropertyToRange').and.returnValue(of(Object.freeze({propertyToRanges: listItem.propertyToRanges} as PropertyToRanges)));

        const emptyIriList: IriList[] = [
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
        ontologyManagerServiceStub.getImportedIris = jasmine.createSpy('getImportedIris').and.returnValue(of(Object.freeze(emptyIriList as IriList[])));
        ontologyVisualizationDataStub.getOntologyLocalObservable = jasmine.createSpy('getOntologyLocalObservable').and.returnValue(mockRequest(visData));
        //ontologyVisualizationDataStub.buildGraphData = jasmine.createSpy('buildGraphData');
        visualizationStub.getSidebarState = jasmine.createSpy('getSidebarState').and.returnValue({
            commitId: 'commitId',
            recordId: 'recordId'
        });
        visualizationStub.emitSidePanelAction = jasmine.createSpy('emitSidePanelAction').and.callFake(() => {});
        visualizationStub.emitSelectAction = jasmine.createSpy('emitSelectAction').and.callFake(() => {});
        spyOn(observer,'next').and.callThrough();
        spyOn(observer,'error').and.callThrough();
    });

    afterEach(() => {
        cleanStylesFromDOM();
        httpMock.verify();
        visualizationStub = null;
        ontologyManagerServiceStub = null;
        ontologyStateStub = null;
    });

    describe('should initialize with the correct data', function() {
        it('successfully', async (done) => {
            expect(() => visualizationStub.getGraphState('commit', true)).toThrowError(Error); // ensure no state exist
            // this needs to be fixed later
            ontologyVisualizationDataStub.getOntologyNetworkObservable.and.returnValue(of(visData));
            ontologyVisualizationDataStub.buildGraphData.and.returnValue(of(visData));
            await visualizationStub.init('commit', null).subscribe( commitGraphState => {
                commitGraphState.importedOntologies = [];
                commitGraphState.allGraphNodes = [];
                visualizationStub.graphStateCache.set('commit', commitGraphState);
                done();
            });
            expect(ontologyVisualizationDataStub.buildGraphData).toHaveBeenCalled();

            //@todo Fix this later
            // expect(ontologyVisualizationDataStub.getOntologyNetworkObservable).toHaveBeenCalled();
            // expect(ontologyVisualizationDataStub.graphDataFormat).toHaveBeenCalled();
            // expect(ontologyVisualizationDataStub.buildGraph).toHaveBeenCalled();
        });
        // it('with InProgressCommit', fakeAsync(async (done) => {
        //     ontologyStateStub.hasInProgressCommit = jasmine.createSpy('hasInProgressCommit').and.returnValue(true);
        //     expect(() => visualizationStub.getGraphState('commit', true)).toThrowError(Error); // ensure no state exist
        //
        //     let graphState;
        //     await visualizationStub.init('commit', inProgressCommitObj).subscribe( commitGraphState => {
        //         graphState = commitGraphState;
        //         expect(ontologyManagerServiceStub.getClassHierarchies).toHaveBeenCalled();
        //         expect(ontologyManagerServiceStub.getPropertyToRange).toHaveBeenCalled();
        //         expect(ontologyManagerServiceStub.getOntologyEntityNames).toHaveBeenCalled();
        //         expect(ontologyManagerServiceStub.getImportedIris).toHaveBeenCalled();
        //         done();
        //     });
        //
        //
        //     const state = visualizationStub.getGraphState('commit');
        //     const actualState = {
        //         allGraphNodesLength: state.allGraphNodes.length,
        //         elementsLength: state.getElementsLength(),
        //         positioned: state.positioned,
        //         isOverLimit: state.isOverLimit
        //     }
        //     const expectState = {
        //         allGraphNodesLength: 100,
        //         elementsLength: 100,
        //         positioned: false,
        //         isOverLimit: false
        //     }
        //     expect(actualState).toEqual(expectState);
        //     const nodesLenght = Object.keys(state.getFilteredGraphData().nodes).length;
        //     const edgesLenght = Object.keys(state.getFilteredGraphData().edges).length;
        //     expect(nodesLenght).toBeGreaterThan(0);
        //     expect(edgesLenght).toBeGreaterThan(0);
        // }));
        // it('without InProgressCommit', fakeAsync(function() {
        //     ontologyVisualizationDataStub.getOntologyLocalObservable.and.returnValue(mockRequest({}));
        //     expect(() => visualizationStub.getGraphState('commit', true)).toThrowError(Error); // ensure no state exist
        //
        //     visualizationStub.init('commit', inProgressCommitObj).subscribe( commitGraphState => {
        //         expect(throwError).toHaveBeenCalled();
        //     }, () => {
        //         expect((err) => {
        //           expect(err).toEqual('No classes defined')
        //         })
        //     });
        //     flush(); // draining the macrotask queue until it is empty
        // }));
    });
});
