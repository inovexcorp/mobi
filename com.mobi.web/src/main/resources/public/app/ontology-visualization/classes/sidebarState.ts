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

import { ControlRecordI } from './controlRecords';
import { GroupedRecord } from './controlRecords';

export enum SidePanelAction {
    CLASS_SELECT,
    CLASS_CENTER,
    CLASS_CHECKED,
    CLASS_UNCHECKED,
    ONTOLOGY_SELECT,
    ONTOLOGY_CHECKED,
    ONTOLOGY_UNCHECKED
}

export interface SidePanelPayloadI {
    action: SidePanelAction;
    controlRecord?: ControlRecordI;
    ontology?: GroupedRecord;
}

export interface SidebarStateI {
    selectedOntologyId?: string;
    recordId: string;
    commitId: string;
}

export class SidebarState implements SidebarStateI {
    selectedOntologyId: string | null;
    recordId: string;
    commitId: string;
    constructor(stateData: SidebarStateI) {
        this.commitId = stateData.commitId;
        this.recordId = stateData.recordId;
    }
}
