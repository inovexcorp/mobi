import {fakeAsync, TestBed, flush} from '@angular/core/testing';
import { configureTestSuite } from 'ng-bullet';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { OntologyVisualizationService } from './ontologyVisualizaton.service';
import { SharedModule } from '../../shared/shared.module';
import { listItem, visData } from './testData';

import {
    mockOntologyState,
    mockOntologyManager,
    mockUtil
} from '../../../../../test/ts/Shared';

import { of } from "rxjs/observable/of";
import { Observable } from "rxjs";


describe('OntologyVisualization Service', () => {
    let visualizationStub : OntologyVisualizationService;
    let httpMock: HttpTestingController;
    let ontologyStateStub: mockOntologyState;
    let ontologyManagerServiceStub: mockOntologyManager;
    let utilStub;
    let mockRequest = (obj) => of(obj);
    let inProgressCommitObj = {
        additions: [],
        deletions: []
    };

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule, SharedModule],
            providers: [
                { provide: 'OntologyVisualizationService' },
                { provide: 'ontologyStateService', useClass: mockOntologyState },
                { provide: 'ontologyManagerService', useClass: mockOntologyManager },
                { provide: 'utilService', useClass: mockUtil },
            ]
        });
    });

    beforeEach(() => {
        visualizationStub = TestBed.get(OntologyVisualizationService);
        httpMock = TestBed.get(HttpTestingController);
        ontologyStateStub = TestBed.get('ontologyStateService');
        ontologyManagerServiceStub = TestBed.get('ontologyManagerService');
        utilStub = TestBed.get('utilService');
        
        ontologyStateStub.listItem = Object.freeze(listItem);
        ontologyStateStub.addToClassIRIs = jasmine.createSpy('addToClassIRIs').and.callFake((items, iri) => {
            items.classes.iris = listItem.classes.iris;
        });

        ontologyManagerServiceStub.getClassHierarchies = jasmine.createSpy('getClassHierarchies').and.returnValue(Promise.resolve(Object.freeze(listItem.classHierarchy)));
        ontologyManagerServiceStub.getOntologyEntityNames = jasmine.createSpy('getOntologyEntityNames').and.returnValue(Promise.resolve(Object.freeze(listItem.entityInfo)));
        ontologyManagerServiceStub.getPropertyToRange = jasmine.createSpy('getPropertyToRange').and.returnValue(Promise.resolve(Object.freeze(listItem.propertyToRanges)));
        ontologyManagerServiceStub.getImportedIris = jasmine.createSpy('getImportedIris').and.returnValue(Promise.resolve(Object.freeze([{
            id: 1,
            ontologyId: 1,
            classes: []
        },
        {
            id: 2,
            ontologyId: 2,
            classes: []
        }])));

        visualizationStub.getOntologyLocalObservable = jasmine.createSpy('getOntologyLocalObservable').and.returnValue(mockRequest(visData));
    });

    afterEach(() => {
        httpMock.verify();
        visualizationStub = null;
    });

    describe('should initialize with the correct data', function() {
        it('successfully', fakeAsync(() => {
            expect(() => visualizationStub.getGraphState('commit', true)).toThrowError(Error); // ensure no state exist
            let graphState;
            visualizationStub.init('commit', null).subscribe( commitGraphState => {
                graphState = commitGraphState;
            });
            flush();
            const state = visualizationStub.getGraphState('commit');
            const actualState = {
                allGraphNodesLength: state.allGraphNodes.length,
                elementsLength: state.getElementsLength(),
                positioned: state.positioned,
                isOverLimit: state.isOverLimit
            };
            const expectState = {
                allGraphNodesLength: 101,
                elementsLength: 101,
                positioned: false,
                isOverLimit: false
            };

            expect(actualState).toEqual(expectState);
        }));
        it('with InProgressCommit', fakeAsync(function() {
            ontologyStateStub.hasInProgressCommit = jasmine.createSpy('hasInProgressCommit').and.returnValue(true);
            expect(() => visualizationStub.getGraphState('commit', true)).toThrowError(Error); // ensure no state exist
            
            let graphState;
            visualizationStub.init('commit', inProgressCommitObj).subscribe( commitGraphState => {
                graphState = commitGraphState;
                expect(ontologyManagerServiceStub.getClassHierarchies).toHaveBeenCalled();
                expect(ontologyManagerServiceStub.getPropertyToRange).toHaveBeenCalled();
                expect(ontologyManagerServiceStub.getOntologyEntityNames).toHaveBeenCalled();
                expect(ontologyManagerServiceStub.getImportedIris).toHaveBeenCalled();
            });
            flush(); // draining the macrotask queue until it is empty

            const state = visualizationStub.getGraphState('commit');
            const actualState = {
                allGraphNodesLength: state.allGraphNodes.length,
                elementsLength: state.getElementsLength(),
                positioned: state.positioned,
                isOverLimit: state.isOverLimit
            }
            const expectState = {
                allGraphNodesLength: 100,
                elementsLength: 100,
                positioned: false,
                isOverLimit: false
            }
            expect(actualState).toEqual(expectState);
            const nodesLenght = Object.keys(state.data.nodes).length;
            const edgesLenght = Object.keys(state.data.edges).length;
            expect(nodesLenght).toBeGreaterThan(0);
            expect(edgesLenght).toBeGreaterThan(0);

        }));

        it('with InProgressCommit', fakeAsync(function() {
            visualizationStub.getOntologyLocalObservable = jasmine.createSpy('getOntologyLocalObservable').and.returnValue(mockRequest({}));
            expect(() => visualizationStub.getGraphState('commit', true)).toThrowError(Error); // ensure no state exist

            visualizationStub.init('commit', inProgressCommitObj).subscribe( commitGraphState => {
                expect(Observable.throw).toHaveBeenCalled();
            }, () => {
                expect((err) => {
                  expect(err).toEqual('No classes defined')
                })
            });
            flush(); // draining the macrotask queue until it is empty
        }));
    });
});
