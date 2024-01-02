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
import { StateNode } from './stateNode';

/**
 * ControlRecordType represent the entity that should be affect on the graph display
 */
export enum ControlRecordType {
    NODE = 'NODE',
    ONTOLOGY = 'ONTOLOGY'
}

/**
 * Represent all nodes that will be displayed in the sidebar and filtered for displaying in the graph
 */
export interface ControlRecordI {
    type: ControlRecordType;
    id: string; // Id of the record used in the graph, Should be unique
    name: string;
    isImported: boolean;
    ontologyId: string
    onGraph: boolean; // Indicate whether a class is currently shown in the visualization
    disabled: boolean; // Indicates whether a class checkbox is disabled or not.
    ontologyColor?: string; // Color for record added while emiting to subscriber
    stateNode?: StateNode;
    isChecked?: boolean | undefined; // Whether the element is Checked
    inInitialGraph?: boolean | undefined; // indicates whether a class was loaded the first time the graph was created
    updateAllClassChecked?: () => void 
}

export interface ControlRecordSearchI {
    name?: string;
    isImported?: boolean;
    limit?: number;
    isChecked?: boolean | undefined; // Whether the ontology is selected
}

/**
 * Represent the results of ControlRecordSearchI searching
 */
export interface ControlRecordSearchResultI {
    records: ControlRecordI[];
    recordsOverLimit: ControlRecordI[];
    limit: number;
    count: number;
}

/**
 * Represent the results of ControlRecordSearchI searching that is grouped by Ontologies and has all records
 */
export interface ControlRecordSearchGroupedI {
    records: ControlGroupRecordI[];
    allClassesAllOntologies: ControlRecordI[];
    limit: number,
    count: number
}

export interface ControlGroupRecordI {
    ontologyId: string,
    classes: ControlRecordI[],
    allClasses: ControlRecordI[],
    ontologyColor: string,
    name: string,
    isImported: boolean,
    allClassesChecked?: boolean | undefined;
    someClassesChecked?: boolean | undefined;
}

/**
 * Represent Ontology and all the classes under it
 */
export class GroupedRecord implements ControlGroupRecordI {
    ontologyId: string;
    classes: ControlRecordI[];
    allClasses: ControlRecordI[];
    isImported: boolean;
    name: string;
    ontologyColor: string;
    allClassesChecked: boolean;
    someClassesChecked: boolean;

    constructor(record: ControlGroupRecordI) {
        this.classes = record.classes;
        this.allClasses = record.allClasses;
        this.isImported = record.isImported;
        this.name = record.name;
        this.ontologyColor =  record.ontologyColor;
        this.ontologyId =  record.ontologyId;
        this.updateCheckedAttr();
    }

    public updateCheckedAttr(): void {
        this.allClassesChecked = this.allClasses.every(item => item.isChecked);
        this.someClassesChecked =  this.allClassesChecked === false && this.allClasses.some(node => {
            return node.isChecked === true;
        });
    }

    public getUncheckClasses(): ControlRecordI[] {
        return this.classes.filter(item => !item.isChecked);
    }
}
