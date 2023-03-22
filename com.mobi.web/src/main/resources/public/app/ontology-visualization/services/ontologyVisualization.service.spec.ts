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
import { fakeAsync, TestBed, flush } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { MockProvider } from 'ng-mocks';

import {
    cleanStylesFromDOM
} from '../../../test/ts/Shared';
import { listItem, visData } from './testData';
import { OntologyStateService } from '../../shared/services/ontologyState.service';
import { OntologyManagerService } from '../../shared/services/ontologyManager.service';
import { OntologyListItem } from '../../shared/models/ontologyListItem.class';
import { HierarchyResponse } from '../../shared/models/hierarchyResponse.interface';
import { EntityNames } from '../../shared/models/entityNames.interface';
import { IriList } from '../../shared/models/iriList.interface';
import { PropertyToRanges } from '../../shared/models/propertyToRanges.interface';
import { UtilService } from '../../shared/services/util.service';
import { ProgressSpinnerService } from '../../shared/components/progress-spinner/services/progressSpinner.service';
import { OntologyVisualizationService } from './ontologyVisualizaton.service';

describe('OntologyVisualization Service', () => {
    let visualizationStub : OntologyVisualizationService;
    let httpMock: HttpTestingController;
    let ontologyStateStub: jasmine.SpyObj<OntologyStateService>;
    let ontologyManagerStub: jasmine.SpyObj<OntologyManagerService>;
    let progressSpinnerStub: jasmine.SpyObj<ProgressSpinnerService>;
    const mockRequest = (obj) => of(obj);
    const inProgressCommitObj = {
        additions: [],
        deletions: []
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                HttpClientTestingModule,
                // SharedModule
            ],
            providers: [
                OntologyVisualizationService,
                MockProvider(ProgressSpinnerService),
                MockProvider(OntologyStateService),
                MockProvider(OntologyManagerService),
                MockProvider(UtilService),
            ]
        }).compileComponents();

        visualizationStub = TestBed.inject(OntologyVisualizationService) as jasmine.SpyObj<OntologyVisualizationService>;
        httpMock = TestBed.inject(HttpTestingController) as jasmine.SpyObj<HttpTestingController>;
        ontologyStateStub = TestBed.inject(OntologyStateService) as jasmine.SpyObj<OntologyStateService>;
        ontologyManagerStub = TestBed.inject(OntologyManagerService) as jasmine.SpyObj<OntologyManagerService>;
        progressSpinnerStub = TestBed.inject(ProgressSpinnerService) as jasmine.SpyObj<ProgressSpinnerService>;
        progressSpinnerStub.track.and.callFake(ob => ob);
        const listItemX: OntologyListItem = listItem;
        ontologyStateStub.listItem = Object.freeze(listItem as OntologyListItem);
        ontologyStateStub.addToClassIRIs = jasmine.createSpy('addToClassIRIs').and.callFake((items, iri) => {
            items.classes.iris = listItem.classes.iris;
        });

        ontologyManagerStub.getClassHierarchies = jasmine.createSpy('getClassHierarchies').and.returnValue(of(Object.freeze(listItem.classHierarchy as HierarchyResponse)));
        ontologyManagerStub.getOntologyEntityNames = jasmine.createSpy('getOntologyEntityNames').and.returnValue(of(Object.freeze(listItem.entityInfo as EntityNames)));
        ontologyManagerStub.getPropertyToRange = jasmine.createSpy('getPropertyToRange').and.returnValue(of(Object.freeze({propertyToRanges: listItem.propertyToRanges} as PropertyToRanges)));
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
        ontologyManagerStub.getImportedIris = jasmine.createSpy('getImportedIris').and.returnValue(of(Object.freeze(emptyIriList as IriList[])));

        visualizationStub.getOntologyLocalObservable = jasmine.createSpy('getOntologyLocalObservable').and.returnValue(mockRequest(visData));
        visualizationStub.getSidebarState = jasmine.createSpy('getSidebarState').and.returnValue({
            commitId: 'commitId',
            recordId: 'recordId'
        });
        visualizationStub.emitSidePanelAction = jasmine.createSpy('emitSidePanelAction').and.callFake(() => {});
        visualizationStub.emitSelectAction = jasmine.createSpy('emitSelectAction').and.callFake(() => {});
    });

    afterEach(() => {
        cleanStylesFromDOM();
        httpMock.verify();
        visualizationStub = null;
        ontologyManagerStub = null;
        ontologyStateStub = null;
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
                expect(ontologyManagerStub.getClassHierarchies).toHaveBeenCalled();
                expect(ontologyManagerStub.getPropertyToRange).toHaveBeenCalled();
                expect(ontologyManagerStub.getOntologyEntityNames).toHaveBeenCalled();
                expect(ontologyManagerStub.getImportedIris).toHaveBeenCalled();
            });
            flush(); // draining the macrotask queue until it is empty

            const state = visualizationStub.getGraphState('commit');
            const actualState = {
                allGraphNodesLength: state.allGraphNodes.length,
                elementsLength: state.getElementsLength(),
                positioned: state.positioned,
                isOverLimit: state.isOverLimit
            };
            const expectState = {
                allGraphNodesLength: 100,
                elementsLength: 100,
                positioned: false,
                isOverLimit: false
            };
            expect(actualState).toEqual(expectState);
            const nodesLenght = Object.keys(state.data.nodes).length;
            const edgesLenght = Object.keys(state.data.edges).length;
            expect(nodesLenght).toBeGreaterThan(0);
            expect(edgesLenght).toBeGreaterThan(0);
        }));
        it('without InProgressCommit', fakeAsync(function() {
            visualizationStub.getOntologyLocalObservable = jasmine.createSpy('getOntologyLocalObservable').and.returnValue(mockRequest({}));
            expect(() => visualizationStub.getGraphState('commit', true)).toThrowError(Error); // ensure no state exist

            visualizationStub.init('commit', inProgressCommitObj).subscribe( commitGraphState => {
                expect(throwError).toHaveBeenCalled();
            }, () => {
                expect((err) => {
                  expect(err).toEqual('No classes defined');
                });
            });
            flush(); // draining the macrotask queue until it is empty
        }));
    });
});
