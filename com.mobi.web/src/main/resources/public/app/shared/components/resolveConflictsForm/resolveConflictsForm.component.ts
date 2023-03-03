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
import { Component, Input } from '@angular/core';

import { CommitChange } from '../../models/commitChange.interface';
import { UtilService } from '../../services/util.service';

/**
 * @class shared.ResolveConflictsFormComponent
 *
 * A component that creates displays of conflicts from a merge of VersionedRDFRecord branches and ways to resolve those
 * conflicts. The initial view is a list of the conflicts displayed as the entity titles and their resolution statuses.
 * Once a conflict is selected, the view changes to a side-by-side display of the changes from each branch in the
 * conflict. Clicking on one of the displays selects which changes to keep in the resolution. The conflicts should in
 * the form:
 * ```
 * {
 *     iri: '',
 *     resolved: '',
 *     left: {
 *         additions: [],
 *         deletions: []
 *     },
 *     right: {
 *         additions: [],
 *         deletions: []
 *     }
 * }
 * ```
 * 
 * @param {Object[]} conflicts The conflicts to be resolved in the form
 * @param {string} branchTitle The title of the source branch of the merge
 * @param {string} targetTitle The title of the target branch of the merge
 */
@Component({
    selector: 'resolve-conflicts-form',
    templateUrl: './resolveConflictsForm.component.html',
    styleUrls: ['./resolveConflictsForm.component.scss']
})
export class ResolveConflictsFormComponent {
    @Input() conflicts;
    @Input() branchTitle: string;
    @Input() targetTitle: string;
    
    index:number = undefined;
    selected = undefined;
    changes: {
        left: {
            additions: CommitChange[],
            deletions: CommitChange[]
        },
        right: {
            additions: CommitChange[],
            deletions: CommitChange[]
        }
    } = undefined;

    constructor(private util: UtilService) {
    }

    select(index: number): void {
        this.index = index;
        this.selected = this.conflicts[this.index];
        this.changes = {
            left: {
                additions: this.util.getChangesById(this.selected.iri, this.selected.left.additions),
                deletions: this.util.getChangesById(this.selected.iri, this.selected.left.deletions)
            },
            right: {
                additions: this.util.getChangesById(this.selected.iri, this.selected.right.additions),
                deletions: this.util.getChangesById(this.selected.iri, this.selected.right.deletions)
            }
        };
    }
    hasNext(): boolean {
        return (this.index + 1) < this.conflicts.length;
    }
    backToList(): void {
        this.index = undefined;
        this.selected = undefined;
        this.changes = undefined;
    }
}
