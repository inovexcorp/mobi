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

import { Observable, from, Subject } from 'rxjs';
import { filter, map, shareReplay, toArray } from 'rxjs/operators';

import * as d3 from 'd3-force';

export enum ControlRecordType {
    NODE = 'NODE',
    ONTOLOGY = 'ONTOLOGY'
}

export interface ControlRecordI {
    type: ControlRecordType;
    id: string; // Id of the record used in the graph, Should be unique
    name: string; 
    isImported: boolean;
    ontologyId: string
    onGraph: boolean; // Indicate whether a class is currently shown in the visualization
    ontologyColor?: string // Color for record added while emiting to subscriber
    stateNode?: StateNode;
}

export class ObjectComparer{

    // All the classes in the import closure (i.e. direct and imported) grouped by parent ontology
    // The groups are ordered alphabetically along with their lists of child classes
    static ControlRecordI = (a: ControlRecordI, b: ControlRecordI) => { 
        let isImported = 0;
        let ontologyId = 0;
        let name = 0;

        if (a.isImported === b.isImported) {
            isImported = 0;
        } else if (a.isImported !== undefined && b.isImported === undefined ) {
            isImported = -1;
        } else if (a.isImported === undefined && b.isImported !== undefined ) {
            isImported = 1; 
        } else if (a.isImported === true && b.isImported === false) {
            isImported = 1;
        } else if (a.isImported === false && b.isImported === true) {
            isImported = -1;
        } 
        
        if (a.ontologyId === b.ontologyId) {
            ontologyId = 0;
        } else if (a.ontologyId !== undefined && b.ontologyId === undefined) {
            ontologyId = -1;
        } else if (a.ontologyId === undefined && b.ontologyId !== undefined) {
            ontologyId = 1;
        } else {
            ontologyId = a.ontologyId.localeCompare(b.ontologyId, 'en', { sensitivity: 'base' });
        }

        if (a.name === b.name) {
            name = 0;
        } else if (a.name !== undefined && b.name === undefined) {
            name = -1;
        } else if (a.name === undefined && b.name !== undefined) {
            name = 1;
        } else {
            name = a.name.localeCompare(b.name, 'en', { sensitivity: 'base' });
        }
        return isImported || ontologyId || name;
    }
}

export interface ControlRecordSearchI {
    name?: string;
    isImported?: boolean;
    limit?: number;
}

export interface ControlRecordSearchResultI {
    records: ControlRecordI[];
    limit: number;
    count: number;
}

export class D3Node implements d3.SimulationNodeDatum {
    index?: number;
    x?: number;
    y?: number;
    vx?: number;
    vy?: number;
    fx?: number | null;
    fy?: number | null;
  
    id: string;
  
    constructor(id) {
      this.id = id;
    }
}

export class D3Link implements d3.SimulationLinkDatum<D3Node> {
    index?: number;
    source: D3Node | string | number;
    target: D3Node | string | number;
  
    constructor(source, target) {
      this.source = source;
      this.target = target;
    }
}

export interface StateNodeI {
    classes: any;
    data: { 
        id: string, 
        [key: string]: any
    },
    locked: boolean;
    grabbed: boolean;
    grabbable: boolean;
    group: string,
    position: { x: number, y: number}
    pannable: boolean;
    removed: boolean;
    selectable: boolean;
    selected: boolean;
}

export class StateNode implements StateNodeI {
    position: { 
        x: number, 
        y: number 
    } ;
    classes: any;
    data: { 
        id: string, 
        ontologyId: 
        string, 
        [key: string]: any 
    } 
    locked: false;
    grabbed: false;
    grabbable: true;
    pannable: false;
    removed: false;
    group: 'nodes';
    selectable: true;
    selected: false;

    constructor() {}

    asControlRecord(onGraph: boolean): ControlRecordI {
        const controlRecord: ControlRecordI = {
            type: ControlRecordType.NODE,
            id: this.data.id,
            name: this.data.name,
            isImported: this.data.isImported,
            ontologyId: this.data.ontologyId,
            onGraph: onGraph,
            stateNode: this
        };
        return controlRecord
    }
}

export interface StateEdgeI {
    position: any;
    group: any;
    removed: boolean;
    selected: boolean;
    selectable: boolean;
    locked: boolean;
    grabbed: boolean;
    grabbable: boolean;
    data: { id: string, source: string, target: string, [key: string]: any } 
    classes?: any;
}

export class StateEdge implements StateEdgeI {
    position: unknown;
    group: 'edges';
    removed: false;
    selected: false;
    selectable: true;
    locked: false;
    grabbed: false;
    grabbable: true;
    data: { 
        id: string, 
        source: string, 
        target: string, 
        [key: string]: any 
    } ;
    classes?: any;
}

/**
 * d3-force API 
 * - https://github.com/shichuanpo/cytoscape.js-d3-force/blob/master/src/defaults.js 
 * - https://github.com/d3/d3-force
 * **/
export class D3Forces {
    forceManyBodyStrength = -700;
    forceLinkDistance = 300;
    forceLinkStrength = .5;
}

export interface GraphStateI {
    commitId?: string;
    ontologyId: string;
    importedOntologies: any;
    isOverLimit: boolean;
    nodeLimit: number;
    positioned: boolean;
    style?: any;
    ontologyColorMap?: Map<any, any>;
    ontologiesClassMap?: Map<any, any>;
    zoom?: number;
    d3Forces?: D3Forces;
    data?: { 
        nodes: StateNode[], 
        edges: StateEdge[] 
    };
    allGraphNodes: ControlRecordI[]; 
    allGraphEdges: StateEdge[];
}

export interface GraphStateDataI {
     nodes: StateNode[];
     edges: StateEdge[];
}  

export class GraphState implements GraphStateI {
    commitId?: string;
    ontologyId: string;
    importedOntologies: any;
    isOverLimit: boolean;
    positioned: boolean;
    style?: any;
    ontologyColorMap?: Map<any, any>;
    ontologiesClassMap?: Map<any, any>;
    positionData?: {pan: any, zoom: any} | undefined;
    d3Forces?: D3Forces;
    nodeLimit: number;
    searchForm: { searchText: string, importOption: string } | undefined;

    public controlRecordSubject$; // Used for emitting records for displaying;
    public controlRecordObservable$: Observable<ControlRecordSearchResultI>;

    private _allGraphNodes: ControlRecordI[];
    private _allGraphEdges: StateEdge[];
    private _allGraphNodesIndex?: Map<string, number>; // reverse index of node id to array location 
    private _allGraphEdgesIndex?: Map<number, number[]>; // reverse index of node location to array location
    
    constructor(graphStateI: GraphStateI, controlRecordSubject?: Subject<ControlRecordSearchResultI>) {
        this.allGraphNodesIndex = new Map();
        this._allGraphEdgesIndex = new Map();
        this.controlRecordSubject$ = controlRecordSubject ? controlRecordSubject : new Subject<ControlRecordSearchResultI>(); 
        this.controlRecordObservable$ = this.controlRecordSubject$.asObservable().pipe(shareReplay(1));;
        this._allGraphNodes = [];
        this.d3Forces = new D3Forces()
        this.searchForm = undefined;
        this.saveGraphStateI(graphStateI);
    }
    
    /**
     * Cytoscape element data is generated from _allGraphNodes
     * Filter _allGraphNodes to nodes that should be on Cytoscape instance
     * then filter allGraphEdges for the nodes that are shown
     */
    public get data(): GraphStateDataI {
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
        return { nodes: graphNodes, edges: graphEdges };
    }

    public set data(graphStateData: GraphStateDataI) {
        // Placeholder for more complex logic for future tickets
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
    
    public getControlRecordSearch(limit){
        const controlRecordSearch: ControlRecordSearchI = {};

        if (this.searchForm != undefined) {
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
   
    public saveGraphStateI(graphStateI: GraphStateI) {
        this.commitId = graphStateI.commitId;
        this.ontologyId = graphStateI.ontologyId;
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
    public emitGraphData(controlRecordSearch: ControlRecordSearchI): void{
        const limit = controlRecordSearch?.limit ? controlRecordSearch.limit : this.nodeLimit;

        from(this.allGraphNodes).pipe(
            filter((controlRecord: ControlRecordI) =>  {
                let matches: boolean[] = [];

                if (controlRecord.name === undefined)
                    return false;
        
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
                const controlRecordSearchResult: ControlRecordSearchResultI = {
                    records: controlRecords.slice(0, limit),
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
     public d3ForceStaticLoad() {
        const clusterLocations = {} // Group ontologies together
        const nodes = this.data.nodes.map((stateNode: StateNode) =>  {
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

        const nodePositionMapping = {};
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

export interface ParentMapI {
    [key: string]: Array<string>
}

export interface RangesI {
    domain: string,
    property: string,
    range: string
}

export interface ChildIrisI {
    [key: string]: string
}

export interface CommitItemI {
    '@id': string[]
    '@type': Array<string>,
    [key: string]:  Array<string>

}

export interface inProgressCommitI {
    additions: Array<CommitItemI>
    deletions: Array<CommitItemI> 
}

export interface EntityItemI {
    label: string,
    names: Array<string>,
    imported: boolean,
    ontologyId: string
}

export interface EntityInfoI {
    [key: string] :EntityItemI
}

export enum SidePanelAction {
    RECORD_SELECT,
    RECORD_CENTER,
    RECORD_CHECKED,
    RECORD_UNCHECKED,
    ONTOLOGY_SELECT
}

export interface SidePanelPayload {
    action: SidePanelAction, 
    controlRecord: ControlRecordI 
}