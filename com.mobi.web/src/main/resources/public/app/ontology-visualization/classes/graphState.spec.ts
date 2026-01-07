/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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
import { fakeAsync, flush } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { GraphState, StateNode } from '.';
import { ControlRecordI, ControlRecordSearchResultI, ControlRecordType } from './controlRecords';

const getName = (iri) => iri;
const expectGraphStateDefault = (graphState: GraphState, overrideState = {}) => {

    const expectedGraphState = Object.assign({
        commitId: 'commitId',
        ontologyId: 'Ont1',
        importedOntologies: [{id: 'Ont2'},{id: 'Ont4'}],
        allGraphNodes: [],
        isOverLimit: false,
        data: undefined,
        positioned: false,
        style: undefined,
        ontologyColorMap: undefined,
        ontologiesClassMap: undefined,
        d3Forces: graphState.d3Forces,
        nodeLimit: 500,
        getName
    }, overrideState);

    expect(graphState.commitId).toEqual(expectedGraphState.commitId);
    expect(graphState.ontologyId).toEqual(expectedGraphState.ontologyId);
    expect(graphState.importedOntologies).toEqual(expectedGraphState.importedOntologies);
    expect(graphState.allGraphNodes).toEqual(expectedGraphState.allGraphNodes);
    expect(graphState.isOverLimit).toEqual(expectedGraphState.isOverLimit);
    expect(graphState.positioned).toEqual(expectedGraphState.positioned);
    expect(graphState.style).toEqual(expectedGraphState.style);
    expect(graphState.ontologyColorMap).toEqual(expectedGraphState.ontologyColorMap);
    expect(graphState.ontologiesClassMap).toEqual(expectedGraphState.ontologiesClassMap);
    expect(graphState.d3Forces).toEqual(expectedGraphState.d3Forces);
    expect(graphState.nodeLimit).toEqual(expectedGraphState.nodeLimit);
};

const cru1: ControlRecordI = { type: ControlRecordType.NODE, id: '0.0', name: 'A',  isImported: undefined,  ontologyId: undefined, onGraph: true, disabled: false};
const cru2: ControlRecordI = { type: ControlRecordType.NODE, id: '0.1', name: undefined,  isImported: undefined,  ontologyId: undefined, onGraph: true, disabled: false};
const cr1: ControlRecordI = { type: ControlRecordType.NODE, id: '1.1', name: 'A',  isImported: false,  ontologyId: 'Ont1', onGraph: true, disabled: false};
const cr21: ControlRecordI = { type: ControlRecordType.NODE, id: '2.1', name: 'A',  isImported: true,  ontologyId: 'Ont2', onGraph: true, disabled: false};
const cr22: ControlRecordI = { type: ControlRecordType.NODE, id: '2.2', name: 'B',  isImported: true,  ontologyId: 'Ont2', onGraph: true, disabled: false};
const cr41: ControlRecordI = { type: ControlRecordType.NODE, id: '4.1', name: 'A',  isImported: true,  ontologyId: 'Ont4', onGraph: true, disabled: false};
const cr410: ControlRecordI = { type: ControlRecordType.NODE, id: '4.10', name: 'Z',  isImported: true,  ontologyId: 'Ont4', onGraph: true, disabled: false};

describe('Visualization Interface', () => {
    let controlRecordSubject$;
    let actualControlRecords: ControlRecordI[];
    let expectedControlRecords: ControlRecordI[];
    let graphState: GraphState;
    let ontologyColorMap: Map<string, string>;

    beforeEach(() => {
        actualControlRecords = [ cru1, cr21, cru2, cr22, cr41, cr410 ,cr1 ];
        expectedControlRecords = [ cr1, cr21, cr22, cr41, cr410, cru1, cru2 ];
        ontologyColorMap = new Map([['Ont1', 'blue'], ['Ont2', 'red'], ['Ont4', 'green']]);
        controlRecordSubject$ = new Subject<ControlRecordSearchResultI>();

        graphState = new GraphState({
            commitId: 'commitId',
            ontologyId: 'Ont1',
            recordId: 'recordId',
            importedOntologies: [{id: 'Ont2'},{id: 'Ont4'}],
            isOverLimit: false,
            positioned: false,
            allGraphNodes: [],
            allGraphEdges: [],
            ontologyColorMap: ontologyColorMap,
            nodeLimit: 500,
            selectedNodes: false,
            getName,
            allGraphNodesComparer(a: ControlRecordI, b: ControlRecordI): number {
                return a.id.localeCompare(b.id);
            }
        }, controlRecordSubject$);
    });

    afterEach(fakeAsync(() => {
        actualControlRecords = undefined;
        expectedControlRecords = undefined;
        ontologyColorMap = undefined;
        graphState = undefined;
        controlRecordSubject$.complete();
        expect(controlRecordSubject$.observers.length).toBe(0);
    }));

    describe('GraphState class', () => {
        describe('should initialize with the correct data', () => {
            it('successfully', fakeAsync(() => {
                flush();
                // graphState.allGraphNodes = actualControlRecords;
                expectGraphStateDefault(graphState, {ontologyColorMap});
            }));
        });
        describe('setGraphData method set correct data', () => {
            it('successfully', fakeAsync(() => {
                // TODO FIX
                // flush();
                // expectGraphStateDefault(graphState, {ontologyColorMap});

                // const data = { nodes: [ new StateNode() ] };
                // const zoom = 3;
                // const panLocation = { x: '1', y: '8' };

                // graphState.setGraphData(data, true, actualControlRecords, panLocation , zoom);

                // expectGraphStateDefault(graphState, {
                //     allGraphNodes: actualControlRecords,
                //     data,
                //     panLocation,
                //     zoom,
                //     ontologyColorMap
                // });
            }));
        });
        describe('getElementsLength method', () => {
            it('when data is undefined', fakeAsync(() => {
                graphState.allGraphNodes = [];
                expect(graphState.getElementsLength()).toEqual(0);
            }));
            it('when data has two StateNode', fakeAsync(() => {
                const s1 = new StateNode();
                const s2 = new StateNode();
                s1.data = { id: '1', ontologyId: 'ont1' };
                s2.data = { id: '2', ontologyId: 'ont2' };
                const c1 = s1.asControlRecord(true);
                const c2 = s2.asControlRecord(true);
                c1.onGraph = true;
                c2.onGraph = true;
                graphState.allGraphNodes = [ c1, c2 ];
                expect(graphState.getElementsLength()).toEqual(2);
            }));
            it('when data has one StateNode', fakeAsync(() => {
                const s1 = new StateNode();
                s1.data = { id: '1', ontologyId: 'ont1' };
                const c1 = s1.asControlRecord(true);
                c1.onGraph = true;
                graphState.allGraphNodes = [ c1 ];
                expect(graphState.getElementsLength()).toEqual(1);
            }));
        });
        // describe('emitGraphData method', () => {
        //     it('successfully', fakeAsync(() => { 
        //         // 
        //     }));
        // });
    });
});
