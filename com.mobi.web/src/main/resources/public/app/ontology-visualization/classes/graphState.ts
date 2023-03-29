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
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { ControlRecordI, ControlRecordSearchGroupedI } from './controlRecords';
import { D3Forces } from '../interfaces/simulation.interface';
import { StateEdge } from './stateEdge';
import { StateNode } from './stateNode';

export interface GraphStateDataI {
    nodes: StateNode[];
    edges: StateEdge[];
}

export interface GraphStateI {
    commitId: string;
    ontologyId: string;
    recordId: string;
    importedOntologies: any;
    isOverLimit: boolean;
    nodeLimit: number;
    positioned: boolean;
    style?: any;
    ontologyColorMap?: Map<any, any>;
    ontologiesClassMap?: Map<any, any>;
    d3Forces?: D3Forces;
    allGraphNodes: ControlRecordI[]; // Source of truth for all nodes
    allGraphEdges: StateEdge[]; // Source of truth for all edges
    selectedNodes: boolean;
    getName?: (iri: string) => string;
    allGraphNodesComparer: (a: ControlRecordI, b: ControlRecordI) => number;
}

export interface SearchForm {
    searchText: string;
    importOption: string;
}

/**
 * GraphState respresent 
 * - All the data used to display the graph 
 * - Controlling the d3forces for nodes
 */
export class GraphState implements GraphStateI {
    commitId: string;
    ontologyId: string;
    recordId: string;
    importedOntologies: any[];
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
    searchForm?: SearchForm | undefined;
    selectedNodes: boolean;

    public controlRecordSubject$: Subject<ControlRecordSearchGroupedI>; // Used for emitting records for displaying;
    public controlRecordObservable$: Observable<ControlRecordSearchGroupedI>;
    private _allGraphNodes: ControlRecordI[];
    private _allGraphEdges: StateEdge[];
    private _allGraphNodesIndex: Map<string, number>; // reverse index of node id to array location to access ControlRecordI
    private _allGraphEdgesIndex: Map<number, number[]>; // reverse index of node location to array location used to access ControlRecordI
    getName: (iri: string) => string;

    constructor(graphStateI: GraphStateI, controlRecordSubject?: BehaviorSubject<ControlRecordSearchGroupedI>) {
        this._allGraphNodes = [];
        this._allGraphEdges = [];
        this._allGraphNodesIndex = new Map<string, number>();
        this._allGraphEdgesIndex = new Map<number, number[]>();
        const defaultControlRecordSearchResultI: ControlRecordSearchGroupedI = {
            records: [],
            allClassesAllOntologies: [],
            limit: 0,
            count: 0
        };
        this.controlRecordSubject$ = controlRecordSubject ? controlRecordSubject : new BehaviorSubject<ControlRecordSearchGroupedI>(defaultControlRecordSearchResultI);
        this.controlRecordObservable$ = this.controlRecordSubject$.asObservable();
        this.d3Forces = new D3Forces();
        this.getName = (iri: string) => iri;
        this.saveGraphStateI(graphStateI);
    }
    /**
     * Default Comparer
     * @param a ControlRecordI
     * @param b ControlRecordI
     * @returns number
     */
    allGraphNodesComparer(a: ControlRecordI, b: ControlRecordI): number {
        return a.id.localeCompare(b.id);
    }
    /**
     * Cytoscape element data is generated from _allGraphNodes
     * Filter _allGraphNodes to nodes that should be on Cytoscape instance
     * then filter allGraphEdges for the nodes that are shown
     */
    public getFilteredGraphData(filters?: {ontologyId?: string, recordId?: string}): GraphStateDataI {
        const sourceGraphNodes: StateNode[] = this.allGraphNodes
            .filter(record => {
                if (filters?.recordId) {
                    return record.onGraph && record.id === filters.recordId;
                } else if (filters?.ontologyId) {
                    return record.onGraph && record.ontologyId === filters.ontologyId;
                } else {
                    return record.onGraph;
                }
            })
            .map(record => {
                const stateNode: StateNode = record.stateNode;
                if (stateNode.classes === undefined && stateNode.data.isImported) {
                    stateNode.classes = [this.ontologiesClassMap.get(stateNode.data.ontologyId)];
                }
                return stateNode;
            });
        const graphNodesIds = new Set(sourceGraphNodes.map((n) => n.data.id));

        // Could be optimized so that sourceGraphNodes makes a list with all nodes on graph
        const targetGraphNodes: StateNode[] = this.allGraphNodes
            .filter(record => record.onGraph)
            .map(record => record.stateNode);
        const targetNodesIds = new Set(targetGraphNodes.map((n) => n.data.id));
        // Ensures that edges with different ontologyId show up in the graph 
        const graphEdges: StateEdge[] = this.allGraphEdges.filter(
            (edge: StateEdge) => { 
                const sourceSubClassTarget =  graphNodesIds.has(edge.data.source) && targetNodesIds.has(edge.data.target);
                const targetSubClassSource =  graphNodesIds.has(edge.data.target) && targetNodesIds.has(edge.data.source);
                return sourceSubClassTarget ||  targetSubClassSource;
            }
        );
        return { 
            nodes: sourceGraphNodes, 
            edges: graphEdges 
        };
    }
    /**
     * Getter for allGraphNodes
     */
    public get allGraphNodes(): ControlRecordI[] {
        return this._allGraphNodes;
    }
    /**
     * Setter for allGraphNodes
     */
    public set allGraphNodes(controlRecords: ControlRecordI[]) {
        this._allGraphNodes = controlRecords;
        this._allGraphNodes.sort(this.allGraphNodesComparer);
        this.allGraphNodesIndex.clear();
        this._allGraphNodes.forEach((controlRecord, index) => {
            this.allGraphNodesIndex.set(controlRecord.id, index);
        });
    }
    public get allGraphNodesIndex(): Map<string, number> {
        return this._allGraphNodesIndex;
    }
    public set allGraphNodesIndex(allGraphNodesIndex: Map<string, number>) {
        this._allGraphNodesIndex = allGraphNodesIndex;
    }
    public get allGraphEdgesIndex(): Map<number, number[]> {
        return this._allGraphEdgesIndex;
    }
    public set allGraphEdgesIndex(allGraphEdgesIndex: Map<number, number[]>) {
        this._allGraphEdgesIndex = allGraphEdgesIndex;
    }
    public get allGraphEdges(): StateEdge[] {
        return this._allGraphEdges;
    }
    public set allGraphEdges(stateEdges: StateEdge[]) {
        this._allGraphEdges = stateEdges;
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
        this.nodeLimit = graphStateI.nodeLimit;
        this.allGraphNodes = graphStateI.allGraphNodes;
        this.allGraphEdges = graphStateI.allGraphEdges;
        if (graphStateI.d3Forces) {
            this.d3Forces = graphStateI.d3Forces;
        }
        if (graphStateI.getName) {
            this.getName = graphStateI.getName;
        }
        if (graphStateI.allGraphNodesComparer) {
            this.allGraphNodesComparer = graphStateI.allGraphNodesComparer;
        }
    }
    /**
     * Get Elements Length
     * @param elements
     * @returns number elements length
     */
    getElementsLength(): number {
        const graphStateDataI: GraphStateDataI = this.getFilteredGraphData();
        if (graphStateDataI) {
            const hasNodes = Object.prototype.hasOwnProperty.call(graphStateDataI, 'nodes');
            return hasNodes ? graphStateDataI.nodes.length : 0;
        } else {
            return 0;
        }
    }
}
