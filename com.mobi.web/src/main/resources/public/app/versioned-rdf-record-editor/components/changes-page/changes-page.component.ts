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
import { Component, OnChanges, Input, Inject } from '@angular/core';
import { get, sortBy, uniq } from 'lodash';
import { forkJoin } from 'rxjs';

import { Commit } from '../../../shared/models/commit.interface';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { ToastService } from '../../../shared/services/toast.service';
import { condenseCommitId } from '../../../shared/utility';
import { VersionedRdfListItem } from '../../../shared/models/versionedRdfListItem.class';
import { stateServiceToken } from '../../injection-token';
import { VersionedRdfState } from '../../../shared/services/versionedRdfState.service';

/**
 * @class versioned-rdf-record-editor.ChangesPageComponent
 * 
 * A component that creates a page that displays all the current users's saved changes
 * (aka inProgressCommit) of the current VersionedRDFRecord using a {@link shared.CommitChangesDisplayComponent} and
 * the current {@link shared.CommitHistoryTableComponent}. The display will include a button to remove all the saved
 * changes if there are any. If there are no changes, an {@link shared.InfoMessageComponent} is shown stating as such.
 * 
 * @param {JSONLDObject[]} additions The current saved changes additions. Intended to be the same as the current
 * additions on the State service `listItem`, just passed as an input for change detection
 * @param {JSONLDObject[]} deletions The current saved changes additions. Intended to be the same as the current
 * additions on the State service `listItem`, just passed as an input for change detection
 */
@Component({
    selector: 'app-changes-page',
    templateUrl: './changes-page.component.html',
    styleUrls: ['./changes-page.component.scss']
})
export class ChangesPageComponent<TData extends VersionedRdfListItem> implements OnChanges {
    @Input() additions: JSONLDObject[];
    @Input() deletions: JSONLDObject[];

    private readonly warningMessageCheckout = 'You will need to commit or remove all changes before checking out a commit';

    branches: JSONLDObject[] = [];
    tags: JSONLDObject[] = [];
    commits: Commit[] = [];
    totalIds: string[] = [];
    displayAdditions: JSONLDObject[] = [];
    displayDeletions: JSONLDObject[] = [];
    index = 0;
    size = 100;
    hasMoreResults = false;

    constructor(@Inject(stateServiceToken) public state: VersionedRdfState<TData>, private _cm: CatalogManagerService, 
        private _toast: ToastService) {}

    // TODO: Add user branch creation stuff
    ngOnChanges(): void {
        const catalogId = get(this._cm.localCatalog, '@id');
        forkJoin({
          branches: this._cm.getRecordBranches(this.state.listItem.versionedRdfRecord.recordId, catalogId, undefined, 
            undefined, true),
          tags: this._cm.getRecordVersions(this.state.listItem.versionedRdfRecord.recordId, catalogId, undefined, true)
        }).subscribe(responses => {
            this.branches = responses.branches.body;
            this.tags = responses.tags.body;
        });
        const addedIds = uniq(this.additions.map(item => item['@id']));
        const delIds = uniq(this.deletions.map(item => item['@id']));
        this.totalIds = sortBy(uniq(addedIds.concat(delIds)), id => this.getEntityName(id));
        this.index = 0;
        this.setResults(this.size, this.index);
    }
    getEntityName(id: string): string {
      return this.state.getEntityName(id);
    }
    setResults(limit: number, offset: number): void {
      this.index = offset;
      const shownIds = this.totalIds.slice(0, offset + limit);
      this.hasMoreResults = shownIds.length < this.totalIds.length;
      this.displayAdditions = this.additions.filter(item => shownIds.includes(item['@id']));
      this.displayDeletions = this.deletions.filter(item => shownIds.includes(item['@id']));
    }
    removeChanges(): void {
        this.state.removeChanges().subscribe(() => {
          this._toast.createSuccessToast('Changes removed successfully.');
          this.index = 0;
        }, errorMessage => this._toast.createErrorToast(`Error removing changes: ${errorMessage}`));
    }
    getCommitId(commit: Commit): string {
        return commit.id;
    }
    openCommit(commit: Commit): void {
        if (this.state.isCommittable()) {
            this._toast.createWarningToast(this.warningMessageCheckout);
            return;
        }
        this.state.changeVersion(this.state.listItem.versionedRdfRecord.recordId, null, commit.id, null, 
          condenseCommitId(commit.id), true, false, false)
            .subscribe(() => {}, error => this._toast.createErrorToast(error));
    }
}
