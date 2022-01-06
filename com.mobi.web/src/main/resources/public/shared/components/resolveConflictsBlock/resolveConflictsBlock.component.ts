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
import { Component, Inject, Input, OnInit } from '@angular/core';
import { concat, forEach, find, some } from 'lodash';
import { ShapesGraphStateService } from '../../services/shapesGraphState.service';

/**
 * @ngdoc component
 * @name ontology-editor.component:resolveConflictsBlock
 * @requires shared.service:utilService
 * @requires shared.service:ontologyStateService
 *
 * @description
 * `resolveConflictsBlock` is a component that creates a series of displays for resolving conflicts between the
 * current branch of the opened {@link shared.service:ontologyStateService ontology} into a target
 * branch. The display includes information about the branches being merged, a
 * {@link shared.component:resolveConflictsForm}, a button to submit the merge, and a button to
 * cancel the merge. The component calls the appropriate methods to merge with the selected resolutions from
 * the `resolveConflictsForm`.
 */
@Component({
    selector: 'resolve-conflicts-block',
    templateUrl: './resolveConflictsBlock.component.html'
})
export class ResolveConflictsBlock implements OnInit {
    @Input() state: any;

    error = '';
    branchTitle = '';
    targetTitle = '';

    constructor(@Inject('utilService') private util) {
    }

    ngOnInit(): void {
        let branchId;
        if (this.state.listItem?.ontologyRecord?.branchId) { // Should be removed when ontologyState is updated to new service
            branchId = this.state.listItem.ontologyRecord.branchId;
        }
        if (this.state.listItem?.versionedRdfRecord?.branchId) {
            branchId = this.state.listItem.versionedRdfRecord.branchId;
        }
        var branch = find(this.state.listItem.branches, {'@id': branchId});
        this.branchTitle = this.util.getDctermsValue(branch, 'title');
        this.targetTitle = this.util.getDctermsValue(this.state.listItem.merge.target, 'title');
    }
    allResolved(): boolean {
        return !some(this.state.listItem.merge.conflicts, {resolved: false});
    }
    submit(): void {
        this.state.listItem.merge.resolutions = {
            additions: [],
            deletions: []
        };
        forEach(this.state.listItem.merge.conflicts, conflict => {
            if (conflict.resolved === 'left') {
                this.addToResolutions(conflict.right);
            } else if (conflict.resolved === 'right') {
                this.addToResolutions(conflict.left);
            }
        });
        this.state.merge()
            .then(() => {
                if (!(this.state instanceof ShapesGraphStateService)) {
                    this.state.resetStateTabs();
                }
                this.util.createSuccessToast('Your merge was successful with resolutions.');
                this.state.cancelMerge();
            }, error => this.error = error);
    }

    private addToResolutions(notSelected): void {
        if (notSelected.additions.length) {
            this.state.listItem.merge.resolutions.deletions = concat(this.state.listItem.merge.resolutions.deletions, notSelected.additions);
        } else {
            this.state.listItem.merge.resolutions.additions = concat(this.state.listItem.merge.resolutions.additions, notSelected.deletions);
        }
    }
}
