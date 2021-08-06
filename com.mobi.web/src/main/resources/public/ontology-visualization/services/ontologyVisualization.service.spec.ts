import {fakeAsync, TestBed, tick} from '@angular/core/testing';
import { configureTestSuite } from 'ng-bullet';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { OntologyVisualizationService } from './ontologyVisualizaton.service';
import { SharedModule } from '../../shared/shared.module';
import { listItem } from './testData';

import {
    mockOntologyState,
    mockOntologyManager,
    mockUtil
} from '../../../../../test/ts/Shared';

describe('OntologyVisualization Service', () => {
    let visualizationStub : OntologyVisualizationService;
    let httpMock: HttpTestingController;
    let ontologyStateStub: mockOntologyState;
    let ontologyManagerStub: mockOntologyManager;
    let utilStub;

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
        ontologyStateStub = TestBed.get('ontologyStateService');
        ontologyManagerStub = TestBed.get('ontologyManagerService');
        utilStub = TestBed.get('utilService');
        visualizationStub = TestBed.get(OntologyVisualizationService);
        httpMock = TestBed.get(HttpTestingController);
        ontologyStateStub.listItem = listItem;
        ontologyStateStub.addToClassIRIs = jasmine.createSpy('addToClassIRIs').and.callFake((items, iri) => {
            items.classes.iris = listItem.classes.iris;
        });
        ontologyManagerStub.getClassHierarchies = jasmine.createSpy('getClassHierarchies').and.returnValue(Promise.resolve(listItem.classHierarchy));
        ontologyManagerStub.getOntologyEntityNames = jasmine.createSpy('getOntologyEntityNames').and.returnValue(Promise.resolve(listItem.entityInfo));
        visualizationStub.getPropertyRangeQuery = jasmine.createSpy('getPropertyRangeQuery').and.returnValue(Promise.resolve(listItem.propertyToRanges));
    });

    afterEach(() => {
        httpMock.verify();
    });

    describe('should initialize with the correct data', function() {
        it('successfully', fakeAsync(function() {
            visualizationStub.init();
            tick();
            expect(visualizationStub.getGraphData().length).toBeGreaterThan(0);
            expect(visualizationStub.hasPositions()).toBeFalse();
            expect(visualizationStub.isOverLimit).toBeFalse();
        }));
        it('with node limit', fakeAsync(function() {
            visualizationStub.nodesLimit = 50;
            visualizationStub.init();
            tick();
            expect(visualizationStub.getGraphData().filter((item) => item.group == 'nodes').length).toBeLessThanOrEqual(50);
            expect(visualizationStub.hasPositions()).toBeFalse();
            expect(visualizationStub.isOverLimit).toBeTruthy();
        }));
        it('with InProgressCommit', fakeAsync(function() {
            ontologyStateStub.hasInProgressCommit = jasmine.createSpy('hasInProgressCommit').and.returnValue(true);
            visualizationStub.init();
            tick();
            expect(visualizationStub.getGraphData().length).toBeGreaterThan(0);
            expect(visualizationStub.hasPositions()).toBeFalse();
            expect(visualizationStub.isOverLimit).toBeFalse();
        }));
        it('with InProgressCommit and node limit', fakeAsync(function() {
            visualizationStub.nodesLimit = 50;
            ontologyStateStub.hasInProgressCommit = jasmine.createSpy('hasInProgressCommit').and.returnValue(true);
            visualizationStub.init();
            tick();
            expect(visualizationStub.getGraphData().filter((item) => item.group === 'nodes').length).toBeLessThanOrEqual(50);
            expect(visualizationStub.hasPositions()).toBeFalse();
            expect(visualizationStub.isOverLimit).toBeTruthy();
        }));
    });
});
