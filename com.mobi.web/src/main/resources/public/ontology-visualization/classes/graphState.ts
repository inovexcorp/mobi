/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2021 iNovex Information Systems, Inc.
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
import { from, Observable, Subject } from 'rxjs';
import { StateEdge } from './stateEdge';
import { filter, map, shareReplay, toArray } from 'rxjs/operators';
import { StateNode } from './stateNode';
import { ObjectComparer } from './objectComparer';
import { D3Link, D3Node, D3Forces } from './d3Classes';
import * as d3 from 'd3-force';
import {
    GraphStateDataI,
    GraphStateI,
    ControlRecordI,
    ControlRecordSearchI,
    ControlRecordSearchResultI,
    ControlGroupRecordI,
    ControlRecordSearchGroupedI,
    d3ForceStaticLoadI
} from '../interfaces/visualization.interfaces';

export class GraphState implements GraphStateI {
    commitId?: string;
    ontologyId: string;
    recordId: string;
    importedOntologies: any;
    isOverLimit: boolean;
    positioned: boolean;
    style?: any;
    ontologyColorMap?: Map<any, any>;
    ontologiesClassMap?: Map<any, any>;
    positionData?: {
        pan: any,
        zoom: any
    } | undefined;
    d3Forces?: D3Forces;
    nodeLimit: number;
    searchForm: {
        searchText: string,
        importOption: string
    } | undefined;
    selectedNodes: boolean;

    public controlRecordSubject$; // Used for emitting records for displaying;
    public controlRecordObservable$: Observable<ControlRecordSearchResultI>;
    private _allGraphNodes: ControlRecordI[];

    private _allGraphEdges: StateEdge[];
    private _allGraphNodesIndex?: Map<string, number>; // reverse index of node id to array location
    private _allGraphEdgesIndex?: Map<number, number[]>; // reverse index of node location to array location
    private _cyChartData = {
        nodes: [],
        edges: []
    };
    getName: (iri: any) => any;

    constructor(graphStateI: GraphStateI, controlRecordSubject?: Subject<ControlRecordSearchResultI>) {
        this.allGraphNodesIndex = new Map();
        this._allGraphEdgesIndex = new Map();
        this.controlRecordSubject$ = controlRecordSubject ? controlRecordSubject : new Subject<ControlRecordSearchResultI>();
        this.controlRecordObservable$ = this.controlRecordSubject$.asObservable().pipe(shareReplay(1));
        this._allGraphNodes = [];
        this.d3Forces = new D3Forces();
        this.getName = (iri: string) => iri;
        this.searchForm = undefined;
        this.saveGraphStateI(graphStateI);
    }

    /**
     * Cytoscape element data is generated from _allGraphNodes
     * Filter _allGraphNodes to nodes that should be on Cytoscape instance
     * then filter allGraphEdges for the nodes that are shown
     */
    public get data(): GraphStateDataI {
        if (this._cyChartData && this._cyChartData.nodes && this._cyChartData.nodes.length > 0) {
            return this._cyChartData;
        }
        const graphNodes: StateNode[] = this.allGraphNodes
            .filter(c => c.onGraph )
            .map(c => {
                const stateNode: StateNode = c.stateNode;
                if (stateNode.classes === undefined && stateNode.data.isImported) {
                    stateNode.classes = [this.ontologiesClassMap.get(stateNode.data.ontologyId)];
                }
                return stateNode;
            });
        const graphNodesIds = new Set(graphNodes.map((n) => n.data.id));
        const graphEdges: StateEdge[] = this.allGraphEdges.filter(
            (edge: StateEdge) => graphNodesIds.has(edge.data.source) && graphNodesIds.has(edge.data.target)
        );
        this._cyChartData = { nodes: graphNodes, edges: graphEdges };
        return this._cyChartData;
    }

    public set data(graphStateData: GraphStateDataI) {
        // Placeholder for more complex logic for future tickets
        this._cyChartData = graphStateData;
    }

    public get allGraphNodes(): ControlRecordI[] {
        return this._allGraphNodes;
    }

    public set allGraphNodes(controlRecords: ControlRecordI[]) {
        this._allGraphNodes = controlRecords;
        this._allGraphNodes.sort(ObjectComparer.ControlRecordI);
        this.allGraphNodesIndex.clear();
        this._allGraphNodes.forEach((controlRecord, index)=>{
            this.allGraphNodesIndex.set(controlRecord.id, index);
        });
    }

    public get allGraphNodesIndex(): Map<string, number> {
        return this._allGraphNodesIndex;
    }

    public set allGraphNodesIndex(value: Map<string, number>) {
        this._allGraphNodesIndex = value;
    }

    public get allGraphEdgesIndex(): Map<number, number[]> {
        return this._allGraphEdgesIndex;
    }

    public set allGraphEdgesIndex(value: Map<number, number[]>) {
        this._allGraphEdgesIndex = value;
    }

    public get allGraphEdges(): StateEdge[] {
        return this._allGraphEdges;
    }

    public set allGraphEdges(value: StateEdge[]) {
        this._allGraphEdges = value;
        this._allGraphEdges.forEach((stateEdge) => {
            const sourceIndex = this.allGraphNodesIndex.get(stateEdge.data.source);
            const targetIndex = this.allGraphNodesIndex.get(stateEdge.data.target);
            if (this._allGraphEdgesIndex.has(sourceIndex)) {
                this._allGraphEdgesIndex.get(sourceIndex).push(targetIndex);
            } else {
                this._allGraphEdgesIndex.set(sourceIndex, [targetIndex]);
            }
        });
    }

    public getControlRecordSearch(limit) : ControlRecordSearchI {
        const controlRecordSearch: ControlRecordSearchI = {};

        if (this.searchForm !== undefined) {
            controlRecordSearch.name = this.searchForm.searchText;
            if (this.searchForm.importOption === 'imported') {
                controlRecordSearch.isImported = true;
            } else if (this.searchForm.importOption === 'local') {
                controlRecordSearch.isImported = false;
            }
        } else {
            controlRecordSearch.name = '';
        }
        if (limit > 0) {
            controlRecordSearch.limit = limit + this.nodeLimit;
        }
        return controlRecordSearch;
    }

    public saveGraphStateI(graphStateI: GraphStateI): void {
        this.commitId = graphStateI.commitId;
        this.ontologyId = graphStateI.ontologyId;
        this.recordId = graphStateI.recordId;
        this.importedOntologies = graphStateI.importedOntologies;
        this.isOverLimit = graphStateI.isOverLimit;
        this.positioned = graphStateI.positioned;
        this.style = graphStateI.style;
        this.ontologyColorMap = graphStateI.ontologyColorMap;
        this.ontologiesClassMap = graphStateI.ontologiesClassMap;
        this.data = graphStateI.data;
        this.nodeLimit = graphStateI.nodeLimit;
        this.allGraphNodes = graphStateI.allGraphNodes;
        this.allGraphEdges = graphStateI.allGraphEdges;
        if (graphStateI.d3Forces) {
            this.d3Forces = graphStateI.d3Forces;
        }
        if (graphStateI.getName) {
            this.getName = graphStateI.getName;
        }
    }

    /**
     * Get Elements Length
     * @param elements
     * @returns number elements length
     */
    getElementsLength(): number {
        if ( this.data ) {
            return  (Object.prototype.hasOwnProperty.call(this.data, 'nodes') ? this.data.nodes.length : 0);
        } else {
            return 0;
        }
    }

    /**
     * Used to emit controlRecords to subscribers of controlRecordSubject$
     * @param controlRecordSearch Used for searching records
     */
    public emitGraphData(controlRecordSearch: ControlRecordSearchI): void {
        const limit = controlRecordSearch?.limit ? controlRecordSearch.limit : this.nodeLimit;
        const ontologies = [{ id: this.ontologyId, isImported: false }, ...this.importedOntologies];

        from(this.allGraphNodes).pipe(
            filter((controlRecord: ControlRecordI) =>  {
                const matches: boolean[] = [];

                if (controlRecord.name === undefined) { 
                    return false;
                }

                if (controlRecordSearch.name !== undefined && controlRecordSearch.name?.length > 0) {
                    matches.push(controlRecord.name.toLowerCase().includes(controlRecordSearch.name.toLowerCase()));
                }

                if (controlRecordSearch.isImported !== undefined) {
                    matches.push(controlRecord.isImported === controlRecordSearch.isImported);
                }

                if (matches.length === 0 || matches.every(Boolean) === true) {
                    return true;
                }

                return false;
            }),
            map((controlRecord: ControlRecordI) => {
                const ontologyColorMap = this.ontologyColorMap;
                controlRecord.ontologyColor = ontologyColorMap.has(controlRecord.ontologyId) ? ontologyColorMap.get(controlRecord.ontologyId) : 'gray';
                return controlRecord;
            }),
            toArray(),
            map((controlRecords: ControlRecordI[]) => {
                const classes =  controlRecords.slice(0, limit);
                const importedIrs = this.importedOntologies.map(item => item.id);
                // group ontology Classes by OntologyId
                const groupedOnto = ontologies.reduce((previousValue, currentValue) => {
                    const ontologyClasses =  classes.filter(item => {
                        return item.ontologyId === currentValue.id;
                    });

                    if (ontologyClasses.length > 0) {
                        const groupedRecord : ControlGroupRecordI = {
                            ontologyId: currentValue.id,
                            classes: ontologyClasses,
                            ontologyColor: this.ontologyColorMap.get(currentValue.id),
                            name: this?.getName(currentValue.id),
                            isImported: importedIrs.includes(currentValue.id)
                        };
                        previousValue.push(groupedRecord);
                    }
                    return previousValue;
                }, []);

                const controlRecordSearchResult: ControlRecordSearchGroupedI = {
                    records: groupedOnto,
                    limit: limit,
                    count: controlRecords.length
                };
                return controlRecordSearchResult;
            })
        ).subscribe(controlRecordSearchResult => {
            this.controlRecordSubject$.next(controlRecordSearchResult);
        });
    }

    /**
     * D3-Force Static Load
     *
     * For examples on forces work:
     * - https://observablehq.com/@d3/disjoint-force-directed-graph
     * - https://observablehq.com/@d3/force-directed-tree
     *
     * UI Performance can be increased using WebWorker for large graphs, make sure not to block main event loop
     *
     * Animation: alphaTarget(restartAlphaTarget).restart();
     *
     * @returns Map with positions of nodes, the key is the class iri
     */
    public d3ForceStaticLoad(): d3ForceStaticLoadI {
        const clusterLocations = {}; // Group ontologies together
        const nodes = this.data.nodes.map((stateNode: StateNode): D3Node =>  {
            const d3Node = new D3Node(stateNode.data.id);

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
            return d3Node;
        });

        const links = this.data.edges.map((stateEdge:StateEdge) => new D3Link(stateEdge.data.source , stateEdge.data.target));
        const d3Forces = this.d3Forces;
        const simulation = d3.forceSimulation(nodes)
            .force('charge', d3.forceManyBody().strength(d3Forces.forceManyBodyStrength))
            .force('link', d3.forceLink(links).id((d:D3Node) => d.id)
                .distance(d3Forces.forceLinkDistance)
                .strength(d3Forces.forceLinkStrength))
            .force('collide', d3.forceCollide().radius(45)) //forceCollide (for preventing elements overlapping)
            .force('x', d3.forceX().strength(.1))
            .force('y', d3.forceY().strength(.1))
            .force('center', d3.forceCenter(100, 100))
            .stop();

        // https://github.com/d3/d3-force/blob/master/README.md#simulation_tick
        for (let i = 0, n = Math.ceil(Math.log(simulation.alphaMin()) / Math.log(1 - simulation.alphaDecay())); i < n; ++i) {
            simulation.tick();
        }

        const nodePositionMapping : d3ForceStaticLoadI = {};
        nodes.forEach((node: D3Node) => {
            nodePositionMapping[node.id] = { x: node.x, y: node.y };
        });
        this.data.nodes.forEach((stateNode:StateNode) => {
            stateNode.position = nodePositionMapping[stateNode.data.id];
        });
        this.positioned = true;
        return nodePositionMapping;
    }
}