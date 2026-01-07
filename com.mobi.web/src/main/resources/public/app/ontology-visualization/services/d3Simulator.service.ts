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
import { Injectable } from '@angular/core';

import * as d3 from 'd3-force';

import { StateEdge, StateNode } from '../classes';
import { D3Link, D3Node, D3NodeIndex } from '../classes/d3Classes';
import { GraphStateDataI } from '../classes/graphState';
import { D3Forces, SimulationOptions } from '../interfaces/simulation.interface';

/**
 * @class ontology-visualization.D3SimulatorService
 * 
 * Service is used to run D3 simulations
 */
@Injectable()
export class D3SimulatorService {
    /**
     * Create default simulationOptions
     * @param simulationOptions 
     * @returns SimulationOptions
     */
    createDefaultSimulationOptions(simulationOptions?: SimulationOptions): SimulationOptions{
        const tempSimulationOptions = simulationOptions ? simulationOptions : {};
        if (tempSimulationOptions.d3Forces === undefined){
            tempSimulationOptions.d3Forces = new D3Forces();
        }
        if (tempSimulationOptions.preProcessClustering === undefined){
            tempSimulationOptions.preProcessClustering = false;
        }
        if (tempSimulationOptions.useExistingNodeLocation === undefined) {
            tempSimulationOptions.useExistingNodeLocation = false;
        }
        return tempSimulationOptions;
    }
    /**
     * Run Simulation and returns node locations
     * 
     * For examples on forces work:
     * - https://observablehq.com/@d3/disjoint-force-directed-graph
     * - https://observablehq.com/@d3/force-directed-tree
     * 
     * @param graphStateData 
     * @param simulationOptions 
     * @returns D3NodeIndex
     */
    runSimulation(graphStateData: GraphStateDataI, simulationOptions?: SimulationOptions): D3NodeIndex {
        const tempSimulationOptions = this.createDefaultSimulationOptions(simulationOptions);
        const nodes: D3Node[] = graphStateData.nodes
            .map(this._nodeMapper(simulationOptions));
        const links: D3Link[] = graphStateData.edges.map((stateEdge: StateEdge) => new D3Link(stateEdge.data.source, stateEdge.data.target));
        this.simulate(nodes, links, tempSimulationOptions);
        const nodePositionMapping: D3NodeIndex = {};
        nodes.forEach((node: D3Node) => {
            nodePositionMapping[node.id] = node;
        });
        return nodePositionMapping;
    }
    /**
     * Convert StateNode into D3Node using simulationOptions
     * @param simulationOptions 
     * @returns a function to map StateNode into D3Node used for location simulation
     */
    _nodeMapper(simulationOptions?: SimulationOptions): (value: StateNode, index: number) => D3Node {
        const tempSimulationOptions = this.createDefaultSimulationOptions(simulationOptions);
        const clusterLocations = {}; // Group ontologies together
        return (stateNode: StateNode): D3Node => {
            const d3Node = new D3Node(stateNode.data.id);
            if (tempSimulationOptions?.useExistingNodeLocation) {
                d3Node.x = stateNode.position?.x | 0;
                d3Node.y = stateNode.position?.y | 0;
            } else if (tempSimulationOptions?.preProcessClustering) {
                if (stateNode.data.ontologyId in clusterLocations) {
                    d3Node.x = clusterLocations[stateNode.data.ontologyId].x;
                    d3Node.y = clusterLocations[stateNode.data.ontologyId].y;
                } else {
                    clusterLocations[stateNode.data.ontologyId] = {
                        x: Math.floor(Math.random() * 200) - 100,
                        y: 100 * Object.keys(clusterLocations).length
                    };
                    d3Node.x = clusterLocations[stateNode.data.ontologyId].x;
                    d3Node.y = clusterLocations[stateNode.data.ontologyId].y;
                }
            } else {
                d3Node.x = 0;
                d3Node.y = 0;
            }
            return d3Node;
        };
    }
    /**
     * Calculate Simulation Ticks
     * @param simulation d3.Simulation object
     * @returns number of ticks for simulation
     */
    getSimulationTicks(simulation:  d3.Simulation<D3Node, undefined>): number{
        return Math.ceil(Math.log(simulation.alphaMin()) / Math.log(1 - simulation.alphaDecay()));
    }
    /**
     * Simulate, modifies the locations of D3Nodes x and y locations
     * 
     * https://github.com/d3/d3-force/blob/master/README.md#simulation_tick
     * 
     * Animation: alphaTarget(restartAlphaTarget).restart()
     * UI Performance can be increased using WebWorker for large graphs, make sure not to block main event loop
     * 
     * @param d3Forces D3Forces
     * @param nodes D3Node
     * @param links D3Link
     * @return time elapsed in millis
     */
    simulate(nodes: D3Node[], links: D3Link[], simulationOptions: SimulationOptions) : number {
        const tempSimulationOptions = this.createDefaultSimulationOptions(simulationOptions);
        const d3Forces: D3Forces = tempSimulationOptions.d3Forces;
        const start = new Date().getTime();
        const simulation =  d3.forceSimulation(nodes)
            .alpha(d3Forces.alpha)
            .alphaDecay(d3Forces.alphaDecay)
            .alphaMin(d3Forces.alphaMin)
            .force('charge', d3.forceManyBody().strength(d3Forces.forceManyBodyStrength))
            .force('link', d3.forceLink(links).id((d: D3Node) => d.id)
                .distance(d3Forces.forceLinkDistance)
                .strength(d3Forces.forceLinkStrength))
            .force('collide', d3.forceCollide().radius(45)) //forceCollide (for preventing elements overlapping)
            .force('x', d3.forceX().strength(.1))
            .force('y', d3.forceY().strength(.1))
            .force('center', d3.forceCenter(100, 100))
            .stop();
        
        for (let i = 0, n = this.getSimulationTicks(simulation) ; i < n; ++i) {
            simulation.tick();
        }
        const elapsed = new Date().getTime() - start;
        return elapsed;
    }
}
