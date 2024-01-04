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
import { fakeAsync, TestBed } from '@angular/core/testing';
import * as d3 from 'd3-force';
import { D3Node, StateNode } from '../classes';
import { D3NodeIndex } from '../classes/d3Classes';
import { GraphStateDataI } from '../classes/graphState';
import { D3Forces } from '../interfaces/simulation.interface';
import { D3SimulatorService } from './d3Simulator.service';

describe('D3SimulatorService service', () => {
    let d3Simulator : D3SimulatorService;
    let stateNode1: StateNode;
    let stateNode2: StateNode;
    let stateNodes: StateNode[] = [stateNode1, stateNode2];

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            providers: [
                D3SimulatorService
            ]
        }).compileComponents();
        d3Simulator = TestBed.inject(D3SimulatorService);
        stateNode1 = new StateNode();
        stateNode2 = new StateNode();
        stateNode1.data = {id: '1', ontologyId: 'ont1'};
        stateNode2.data = {id: '2', ontologyId: 'ont2'};
        stateNodes = [stateNode1, stateNode2];
    });

    afterEach(() => {
        d3Simulator = undefined;
        stateNode1 = undefined;
        stateNode2 = undefined;
        stateNodes = undefined;
    });
    describe('when createDefaultSimulationOptions is executed', () => {
        it('successfully default', fakeAsync(() => {
            const simulationOptions = d3Simulator.createDefaultSimulationOptions();
            const expectedSimulationOptions = {
                d3Forces: new D3Forces(),
                preProcessClustering: false,
                useExistingNodeLocation: false
            };
            expect(simulationOptions).toEqual(expectedSimulationOptions);
        }));
        it('successfully with simulationOptions', fakeAsync(() => {
            const expectedSimulationOptions = {
                d3Forces: new D3Forces(),
                preProcessClustering: true,
                useExistingNodeLocation: true
            };
            const simulationOptions = d3Simulator.createDefaultSimulationOptions(expectedSimulationOptions);
            expect(simulationOptions).toEqual(expectedSimulationOptions);
        }));
    });
    describe('when runSimulation is executed', () => {
        it('successfully', fakeAsync(() => {
            spyOn(d3Simulator, 'simulate');
            const graphStateData: GraphStateDataI = {nodes: [], edges: []};
            const nodePositionMapping: D3NodeIndex = d3Simulator.runSimulation(graphStateData);
            const expectedNodePositionMapping = {
            };
            expect(nodePositionMapping).toEqual(expectedNodePositionMapping);
        }));
    });
    describe('when _nodeMapper is executed', () => {
        it('successfully default', fakeAsync(() => {
            const stateNodesMapped: D3Node[] = stateNodes.map(d3Simulator._nodeMapper());
            const expectedD3Nodes = [
                new D3Node('1', 0, 0),
                new D3Node('2', 0, 0),
            ];
            expect(stateNodesMapped).toEqual(expectedD3Nodes);
        }));
        it('successfully useExistingNodeLocation and stateNodes has no positions', fakeAsync(() => {
            const simulationOptions = { useExistingNodeLocation: true };
            const stateNodesMapped: D3Node[] = stateNodes.map(d3Simulator._nodeMapper(simulationOptions));
            const expectedD3Nodes = [
                new D3Node('1', 0, 0),
                new D3Node('2', 0, 0),
            ];
            expect(stateNodesMapped).toEqual(expectedD3Nodes);
        }));
        it('successfully useExistingNodeLocation is true and stateNodes has positions', fakeAsync(() => {
            const simulationOptions = { useExistingNodeLocation: true };
            stateNode1.position = {x: 2, y: 4};
            stateNode2.position = {x: 4, y: 6};
            const stateNodesMapped: D3Node[] = stateNodes.map(d3Simulator._nodeMapper(simulationOptions));
            const expectedD3Nodes = [
                new D3Node('1', 2, 4),
                new D3Node('2', 4, 6),
            ];
            expect(stateNodesMapped).toEqual(expectedD3Nodes);
        }));
        it('successfully preProcessClustering is true', fakeAsync(() => {
            const simulationOptions = { preProcessClustering: true };
            stateNode1.position = {x: 2, y: 4};
            stateNode2.position = {x: 4, y: 6};
            const stateNodesMapped: D3Node[] = stateNodes.map(d3Simulator._nodeMapper(simulationOptions));

            const expectedD3Nodes = [
                new D3Node('1', 0, 0),
                new D3Node('2', 0, 0),
            ];
            expect(stateNodesMapped.map(n => n.id)).withContext('stateNodesMapped ids').toEqual(expectedD3Nodes.map(n => n.id));
            expect(stateNodesMapped.map(n => [n.x, n.y])).withContext('stateNodesMapped x and y').not.toEqual(expectedD3Nodes.map(n => [n.x, n.y]));
        }));
    });
    describe('when getSimulationTicks is executed', () => {
        it('successfully', (() => {
            const simulation =  d3.forceSimulation([]).stop();
            const ticks = d3Simulator.getSimulationTicks(simulation);
            expect(ticks).toEqual(300);
        }));
    });
});
