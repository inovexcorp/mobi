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
import { Component, Input, EventEmitter, Output } from '@angular/core';

import { Difference } from '../../models/difference.class';
import { Commit } from '../../models/commit.interface';
import { OntologyStateService } from '../../services/ontologyState.service';

/**
 * @class shared.CommitDifferenceTabsetComponent
 *
 * A directive which creates a div containing a `mat-tabgroup` with tabs for the
 * {@link shared.CommitChangesDisplayComponent changes} and
 * {@link shared.CommitHistoryTableComponent commits} between two branches.
 *
 * @param {string} recordId The IRI of the VersionedRDFRecord that the Commits belong to
 * @param {Object} sourceBranch The JSON-LD of the source branch of the difference
 * @param {string} targetBranchId The IRI of the target branch of the difference
 * @param {Object} difference The object representing the difference between the two Commits
 * @param {Function} showMoreResultsFunc A function that takes limit and offset to update the difference provided
 * @param {Function} entityNameFunc An optional function to pass to `commitChangesDisplay` to control the display of
 * @param {int} startIndex The startIndex for the offset. Used when reloading the display.
 * @param {string} [recordId=''] recordId An optional IRI string representing an OntologyRecord to query for names if present
 * each entity's name
 */
@Component({
    selector: 'commit-difference-tabset',
    templateUrl: './commitDifferenceTabset.component.html',
    styleUrls: ['./commitDifferenceTabset.component.scss']
})
export class CommitDifferenceTabsetComponent {
    @Input() branchTitle: string;
    @Input() commitId: string;
    @Input() targetId: string;
    @Input() difference: Difference;
    @Input() entityNameFunc?: (entityIRI: string) => string;
    @Input() startIndex?: number;
    @Input() recordId: string;
    @Input() type: string;
    @Output() showMoreResultsFunc = new EventEmitter<{limit: number, offset: number}>();
    @Output() receiveCommits = new EventEmitter<Commit[]>();

    middleShowMoreResultsFunc(deets: {limit: number, offset: number}): void {
        this.showMoreResultsFunc.emit(deets);
    }

    emitCommits(value: Commit[]): void {
        this.receiveCommits.emit(value);
    }
}
