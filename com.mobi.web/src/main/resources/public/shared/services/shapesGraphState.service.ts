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
import { RecordSelectFiltered } from '../../shapes-graph-editor/models/recordSelectFiltered.interface';

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
     * `currentShapesGraphBranchIri` is the currently viewed ShapesGraphRecord branch IRI
     */
    currentShapesGraphBranchIri = '';

    /**
     * `currentShapesGraphCommitIri` is the currently viewed ShapesGraphRecord commit IRI
     */
    currentShapesGraphCommitIri = '';

    /**
     * `changesPagesOpen` reflects if the changes page is currently open
     */
    changesPageOpen = false;

    /**
     * `openRecords` is the list of open ShapesGraphRecords
     */
    openRecords: RecordSelectFiltered[] = [];

    /**
     * `inProgressCommit` is an object consisting of the list of additions and deletions for the in progress commit and the currently viewed
     * ShapesGraphRecord
     */
    inProgressCommit = {
        additions: [],
        deletions: []
    };

    /**
     * `upToDate` is a boolean reflecting whether the currently viewed ShapesGraphRecord commit is the head of the current branch.
     */
    upToDate = true;

    /**
     * Resets all the main state variables.
     */
    reset(): void {
        this.currentShapesGraphRecordIri = '';
        this.currentShapesGraphRecordTitle = '';
        this.currentShapesGraphBranchIri = '';
        this.currentShapesGraphCommitIri = '';
        this.changesPageOpen = false;
        this.openRecords = [];
        this.inProgressCommit = {
            additions: [],
            deletions: []
        };
    }

    /**
     * Resets the additions and deletions in the in progress commit.
     */
    clearInProgressCommit(): void {
        this.inProgressCommit = {
            additions: [],
            deletions: []
        };
    }

    /**
     * Indicates whether the currently viewed ShapesGraphRecord can be committed. 
     * 
     * @returns {boolean} A boolean indicating if the currently viewed shapes graph record is committable.
     */
    isCommittable(): boolean {
        return (!!this.inProgressCommit.additions.length || !!this.inProgressCommit.deletions.length) && !!this.currentShapesGraphRecordIri;
    }
}