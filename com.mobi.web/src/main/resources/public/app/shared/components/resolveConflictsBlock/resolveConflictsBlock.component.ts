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
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { concat, forEach, find, some } from 'lodash';

import { UtilService } from '../../services/util.service';
import { VersionedRdfListItem } from '../../models/versionedRdfListItem.class';
import { Difference } from '../../models/difference.class';

/**
 * @class ontology-editor.ResolveConflictsBlockComponent
 *
 * A component that creates a series of displays for resolving conflicts between the current branch of the opened
 * VersionedRDFRecord on the provided state service into a target branch. The display includes information about the
 * branches being merged, a {@link shared.ResolveConflictsFormComponent}, a button to submit the merge, and a button to
 * cancel the merge. The component calls the appropriate methods to merge with the selected resolutions from the
 * `resolveConflictsForm`.
 */
@Component({
    selector: 'resolve-conflicts-block',
    templateUrl: './resolveConflictsBlock.component.html'
})
export class ResolveConflictsBlock implements OnInit {
    @Input() error: string;
    @Input() listItem: VersionedRdfListItem;
    @Output() cancelEvent = new EventEmitter<void>();
    @Output() submitEvent = new EventEmitter<void>();

    branchTitle = '';
    targetTitle = '';

    constructor(private util: UtilService) {}

    ngOnInit(): void {
        let branchId;
        if (this.listItem.versionedRdfRecord?.branchId) { // Should be removed when ontologyState is updated to new service
            branchId = this.listItem.versionedRdfRecord.branchId;
        }
        if (this.listItem?.versionedRdfRecord?.branchId) {
            branchId = this.listItem.versionedRdfRecord.branchId;
        }
        const branch = find(this.listItem.branches, {'@id': branchId});
        this.branchTitle = this.util.getDctermsValue(branch, 'title');
        this.targetTitle = this.util.getDctermsValue(this.listItem.merge.target, 'title');
    }
    allResolved(): boolean {
        return !some(this.listItem.merge.conflicts, {resolved: false});
    }
    submit(): void {
        this.listItem.merge.resolutions = new Difference();
        forEach(this.listItem.merge.conflicts, conflict => {
            if (conflict.resolved === 'left') {
                this.addToResolutions(conflict.right);
            } else if (conflict.resolved === 'right') {
                this.addToResolutions(conflict.left);
            }
        });
        this.submitEvent.emit();
    }
    cancelMerge(): void {
        this.cancelEvent.emit();
    }

    private addToResolutions(notSelected): void {
        if (notSelected.additions.length) {
            this.listItem.merge.resolutions.deletions = concat(this.listItem.merge.resolutions.deletions, notSelected.additions);
        } else {
            this.listItem.merge.resolutions.additions = concat(this.listItem.merge.resolutions.additions, notSelected.deletions);
        }
    }
}
