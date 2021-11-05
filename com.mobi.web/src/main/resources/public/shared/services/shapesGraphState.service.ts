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
import { Injectable } from '@angular/core';
import {RecordSelectFiltered} from "../../shapes-graph-editor/models/recordSelectFiltered.interface";

/**
 * @class shared.ShapesGraphStateService
 *
 * A service which contains various variables to hold the state of the Shapes Graph editor
 */
@Injectable()
export class ShapesGraphStateService {
    /**
     * `currentShapesGraphRecordIri` is the currently viewed ShapesGraphRecord IRI
     */
    currentShapesGraphRecordIri = '';

    /**
     * `currentShapesGraphRecordTitle` is the currently viewed ShapesGraphRecord title
     */
    currentShapesGraphRecordTitle = '';

    /**
     * `openRecords` is the list of open ShapesGraphRecords
     */
    openRecords: RecordSelectFiltered[] = [];

    /**
     * Resets all the main state variables.
     */
    reset(): void {
        this.currentShapesGraphRecordIri = '';
        this.currentShapesGraphRecordTitle = '';
        this.openRecords = [];
    }
}
