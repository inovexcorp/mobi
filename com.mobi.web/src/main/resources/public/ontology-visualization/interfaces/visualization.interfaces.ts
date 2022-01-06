/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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

import {
    D3Forces,
    StateEdge,
    StateNode
} from '../classes';

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

export interface SidePanelPayloadI {
    action: SidePanelAction, 
    controlRecord: ControlRecordI 
}

export interface positionI {
    /**
    * Node’s current x-position
    */
   x?: number | undefined;
   /**
    * Node’s current y-position
    */
   y?: number | undefined;
   
}
// State intefaces
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
    position: positionI
    pannable: boolean;
    removed: boolean;
    selectable: boolean;
    selected: boolean;
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
    data: { 
        id: string, 
        source: string, 
        target: string, 
        [key: string]: any 
    }
    classes?: any;
}

export interface GraphStateI {
    commitId?: string;
    ontologyId: string;
    recordId: string;
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
    selectedNodes: boolean;
    getName?: (iri: any) => any;
}

export interface GraphStateDataI {
    nodes: StateNode[];
    edges: StateEdge[];
}

export interface sidebarStateI {
    selectedOntologyId: string
    recordId: string
    commitId: string
}

// control records
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

export interface  ControlGroupRecordI {
    ontologyId: string,
    classes: ControlRecordI[],
    ontologyColor: string,
    name: string,
    isImported: boolean
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

export interface ControlRecordSearchGroupedI extends Omit<ControlRecordSearchResultI, 'records'> {
    records: ControlGroupRecordI[];
}

export interface d3ForceStaticLoadI {
    [key: string]: positionI
}
