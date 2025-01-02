/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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
import { ControlRecordI, ControlRecordType } from './controlRecords';

export interface NodePositionI {
    /**
    * Node’s current x-position
    */
   x?: number;
   /**
    * Node’s current y-position
    */
   y?: number;
}

export interface StateNodeI {
    classes: any;
    data: {
        id: string;
        [key: string]: any;
    },
    locked: boolean;
    grabbed: boolean;
    grabbable: boolean;
    group: string;
    position: NodePositionI;
    pannable: boolean;
    removed: boolean;
    selectable: boolean;
    selected: boolean;
}

export class StateNode implements StateNodeI {
    position: NodePositionI;
    classes: any;
    data: {
        id: string,
        ontologyId: string,
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
    inInitialGraph: false;
    disabled: false;

    constructor() {}

    asControlRecord(onGraph: boolean): ControlRecordI {
        const controlRecord: ControlRecordI = {
            type: ControlRecordType.NODE,
            id: this.data.id,
            name: this.data.name,
            isImported: this.data.isImported,
            ontologyId: this.data.ontologyId,
            onGraph: onGraph,
            isChecked: onGraph,
            disabled: !onGraph,
            stateNode: this,
            inInitialGraph: onGraph,
        };
        return controlRecord;
    }
}
