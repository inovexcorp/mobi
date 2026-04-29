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
import { Component, Inject, Input, OnChanges } from '@angular/core';

import { forkJoin } from 'rxjs';
import { get, sortBy, uniq } from 'lodash';

import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { Commit } from '../../../shared/models/commit.interface';
import { condenseCommitId, getEntityName } from '../../../shared/utility';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { stateServiceToken } from '../../../shared/injection-token';
import { ToastService } from '../../../shared/services/toast.service';
import { VersionedRdfListItem } from '../../../shared/models/versionedRdfListItem.class';
import { VersionedRdfState } from '../../../shared/services/versionedRdfState.service';

/**
 * @class ChangesPageComponent
 *
 * A component that creates a page that displays all the current users' saved changes
 * (aka inProgressCommit) of the current VersionedRDFRecord using a {@link CommitChangesDisplayComponent} and
 * the current {@link CommitHistoryTableComponent}. The display will include a button to remove all the saved
 * changes if there are any. If there are no changes, an {@link InfoMessageComponent} is shown stating as such.
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
  isOntologyRecord = true;

  constructor(@Inject(stateServiceToken) public state: VersionedRdfState<TData>, private _cm: CatalogManagerService,
              private _toast: ToastService) {
  }

  // TODO: Add user branch creation stuff
  /**
   * Lifecycle hook that is called when any data-bound property of a directive changes.
   * This method determines whether the current state pertains to an ontology record and fetches the branches and tags
   * for the associated RDF record from the catalog. It also computes the unique identifiers for added and deleted items,
   * sorts them, and initializes result pagination.
   *
   * @return {void}
   */
  ngOnChanges(): void {
    this.isOntologyRecord = this.state instanceof OntologyStateService;
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

  /**
   * Retrieves the name of an entity based on its identifier.
   *
   * @param {string} id - The unique identifier of the entity.
   * @return {string} The name of the entity.
   */
  getEntityName(id: string): string {
    const entity = this.__findEntityObject(id, this.additions, this.deletions);
    return getEntityName(entity);
  }

  /**
   * Updates the current set of results based on the provided limit and offset.
   *
   * @param {number} limit - The maximum number of results to display.
   * @param {number} offset - The starting index used to determine which results to display.
   * @return {void}
   */
  setResults(limit: number, offset: number): void {
    this.index = offset;
    const shownIds = this.totalIds.slice(0, offset + limit);
    this.hasMoreResults = shownIds.length < this.totalIds.length;
    this.displayAdditions = this.additions.filter(item => shownIds.includes(item['@id']));
    this.displayDeletions = this.deletions.filter(item => shownIds.includes(item['@id']));
  }

  /**
   * Removes changes from the current state and resets the index to 0 upon successful operation.
   * Displays a success toast message if successful or an error toast message if the operation fails.
   *
   * @return {void}
   */
  removeChanges(): void {
    this.state.removeChanges().subscribe(() => {
      this._toast.createSuccessToast('Changes removed successfully.');
      this.index = 0;
    }, errorMessage => this._toast.createErrorToast(`Error removing changes: ${errorMessage.errorMessage}`));
  }

  /**
   * Retrieves the unique identifier of the specified commit.
   *
   * @param {Commit} commit - The commit object containing the ID.
   * @return {string} The unique identifier of the commit.
   */
  getCommitId(commit: Commit): string {
    return commit.id;
  }

  /**
   * Opens a commit and attempts to change the application's state to the specified commit version.
   *
   * @param {Commit} commit - The commit object that contains information such as the commit ID
   */
  openCommit(commit: Commit): void {
    if (this.state.isCommittable()) {
      this._toast.createWarningToast(this.warningMessageCheckout);
      return;
    }
    this.state.changeVersion(this.state.listItem.versionedRdfRecord.recordId, null, commit.id, null,
      condenseCommitId(commit.id), true, false, false)
      .subscribe(() => {}, error => this._toast.createErrorToast(error.errorMessage));
  }

  private __findEntityObject(id, arr1, arr2) {
    return [...arr1, ...arr2].find(obj => obj['@id'] === id);
  }
}
