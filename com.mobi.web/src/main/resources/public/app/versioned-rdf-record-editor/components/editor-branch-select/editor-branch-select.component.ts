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
import { AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatAutocompleteTrigger, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { find, get, remove } from 'lodash';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, finalize, map, startWith, switchMap, tap } from 'rxjs/operators';

import { CATALOG } from '../../../prefixes';
import { ConfirmModalComponent } from '../../../shared/components/confirmModal/confirmModal.component';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { ToastService } from '../../../shared/services/toast.service';
import { condenseCommitId, getDctermsValue, getPropertyId } from '../../../shared/utility';
import { stateServiceToken } from '../../injection-token';
import { VersionedRdfListItem } from '../../../shared/models/versionedRdfListItem.class';
import { VersionedRdfState } from '../../../shared/services/versionedRdfState.service';
import { ProgressSpinnerService } from '../../../shared/components/progress-spinner/services/progressSpinner.service';
import { EditBranchModalComponent } from '../edit-branch-modal/edit-branch-modal.component';

export interface OptionGroup {
    title: string,
    options: Option[]
}

export interface Option {
    title: string,
    branchIri?: string,
    tagIri?: string,
    commitIri?: string,
    description?: string,
    jsonld?: JSONLDObject
}

/**
 * @class versioned-rdf-record-editor.EditorBranchSelectComponent
 *
 * `editor-branch-select` is a component that provides a `mat-select` for choosing what branch, tag, or commit to view
 * in the specific Versioned RDF Record Editor. Contains functionality to edit branches and delete tags and branches.
 * 
 * @param {string} recordIri The IRI of the Versioned RDF Record currently open
 * @param {string} branchTitle The title of the currently selected branch, tag, or commit being viewed
 */
@Component({
    selector: 'app-editor-branch-select',
    templateUrl: './editor-branch-select.component.html',
    styleUrls: ['./editor-branch-select.component.scss']
})
export class EditorBranchSelectComponent<TData extends VersionedRdfListItem> implements OnInit, OnChanges, AfterViewInit {
  @Input() recordIri: string;
  @Input() branchTitle: string;
  @Output() receiveBranches = new EventEmitter<JSONLDObject[]>();

  @ViewChild(MatAutocompleteTrigger, { static: true }) autocompleteTrigger: MatAutocompleteTrigger;
  @ViewChild('textInput', { static: true }) textInput: ElementRef;
  @ViewChild('editorBranchSelectSpinner', { static: true }) editorBranchSelectSpinner: ElementRef;

  branchSearchControl: UntypedFormControl = new UntypedFormControl();
  
  branches: Option[] = [];
  tags: Option[] = [];
  commits: Option[] = [];
  selectedIcon = {
    mat: true,
    icon: ''
  };

  filteredOptions: Observable<OptionGroup[]>

  constructor(@Inject(stateServiceToken) public state: VersionedRdfState<TData>, private _cm: CatalogManagerService,
              private _dialog: MatDialog, private _toast: ToastService, private _spinnerSrv: ProgressSpinnerService) {}
    
  ngOnInit(): void {
    this._setFilteredOptions();
    this._updateDisabled(this.recordIri);
  }
  /**
   * If the record IRI changes, update the disabled state of the control. If the selected branch/tag/commit changes,
   * resets the list of branches and tags if a value was previously set and then resets the current value.
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes?.recordIri && !changes?.recordIri.firstChange) {
      this._updateDisabled(changes.recordIri.currentValue);
    }
    if (changes?.branchTitle?.currentValue) {
      if (changes?.branchTitle?.previousValue) {
        this.retrieveBranchesAndTags().subscribe(() => this.resetSearch());
      } else {
        this.resetSearch();
      }
    }
  }
  /**
   * Sets up the handler to reset the control value when the focus moves off of the input.
   */
  ngAfterViewInit(): void {
    this.autocompleteTrigger.panelClosingActions.subscribe(e => {
      if (!(e && e.source)) {
        this._resetControl();
      }
    });
  }
  /**
   * Returns the filtered list of options based on the provided search text. Search is done case insensitive and not
   * exact match. Will only return option groups if they have results.
   * 
   * @param {string} val The text to search with
   * @returns {OptionGroup[]} An array of options to use in the control
   */
  filter(val: string): OptionGroup[] {
    const options = [];
    const filteredBranches = this.branches
      .filter(option => option.title.toLowerCase().includes(val.toString().toLowerCase()));
    if (filteredBranches.length > 0) {
      options.push({ title: 'Branches', options: filteredBranches });
    }
    const filteredTags = this.tags
      .filter(option => option.title.toLowerCase().includes(val.toString().toLowerCase()));
    if (filteredTags.length > 0) {
      options.push({ title: 'Tags', options: filteredTags });
    }
    const filteredCommits = this.commits
      .filter(option => option.title.toLowerCase().includes(val.toString().toLowerCase()));
    if (filteredCommits.length > 0) {
      options.push({ title: 'Commits', options: filteredCommits });
    }
    return options;
  }
  /**
   * Selects an option from the select and handles updating the state appropriately. If the listItem is committable,
   * prevents the change. If a branch was selected, fetches the latest data for it, fetches the user's saved state for
   * that branch, then calls the State service `changeVersion` method. If a tag was selected, fetches the latest commit
   * data and then calls the State service `changeVersion` method.
   * 
   * @param {MatAutocompleteSelectedEvent} event The event from the option selection
   */
  selectVersion(event: MatAutocompleteSelectedEvent): void {
    if (this.state.isCommittable()) {
      this._toast.createWarningToast('Cannot switch branches while there are uncommitted changes');
      this._resetControl();
      return;
    }
    if (event?.option?.value?.branchIri && event?.option?.value?.commitIri) {
      const branchId = event.option.value.branchIri;
      this._cm.getRecordBranch(branchId, this.state.listItem.versionedRdfRecord.recordId,
        get(this._cm.localCatalog, '@id', '')).pipe(
        switchMap(branch => {
          const recordState = this.state.getStateByRecordId(this.state.listItem.versionedRdfRecord.recordId);
          const commitId = this.state.getCommitIdOfBranchState(recordState, branchId) || getPropertyId(branch, `${CATALOG}head`);
          return this.state.changeVersion(this.state.listItem.versionedRdfRecord.recordId, 
            branchId, 
            commitId, 
            undefined, 
            event.option.value.title, commitId === getPropertyId(branch, `${CATALOG}head`), false, false);
        })
      ).subscribe(() => {
        this._resetControl();
      }, error => { 
        this._toast.createErrorToast(error);
      });
    } else if (event?.option?.value?.tagIri && event?.option?.value?.commitIri) {
      this._cm.getCommit(event.option.value.commitIri).pipe(
        switchMap(headCommit => {
          return this.state.changeVersion(this.state.listItem.versionedRdfRecord.recordId, 
            undefined, 
            headCommit['@id'], 
            event.option.value.tagIri, 
            event.option.value.title, true, false, false);
        })
      ).subscribe(() =>  {
        this._resetControl();
      }, error => { 
        this._toast.createErrorToast(error);
      });
    }
  }
  /**
   * On panel first open, refetches the list of ranches and tags then resets the control value. The reset happens after
   * so that it accounts for the new branches and tags that were fetched
   */
  open(): void {
    // Resets the form control, marking it pristine and untouched, and resetting the value.
    this.retrieveBranchesAndTags().subscribe(() => this.branchSearchControl.reset());
  }
  /**
   * Resets the value of the control and the selected icon to display depending on what is selected on the listItem.
   */
  resetSearch(): void {
    if (this.state?.listItem?.currentVersionTitle) {
      this.branchSearchControl.setValue(this.state.listItem.currentVersionTitle, { emitEvent: false });
      const branch = find(this.branches, {branchIri: this.state.listItem.versionedRdfRecord.branchId});
      const tag = find(this.tags, {
        commitIri: this.state.listItem.versionedRdfRecord.commitId, 
        tagIri: this.state.listItem.versionedRdfRecord.tagId
      });
      const commit = find(this.commits, {commitIri: this.state.listItem.versionedRdfRecord.commitId});

      if (branch) {
        this.selectedIcon = {
          mat: false,
          icon: 'fa fa-code-fork fa-lg'
        };
      } else if (tag) {
        this.selectedIcon = {
          mat: true,
          icon: 'local_offer'
        };
      } else if (commit) {
        this.selectedIcon = {
          mat: true,
          icon: 'commit'
        };
      } else {
        this.selectedIcon = {
          mat: true,
          icon: ''
        };
      }
    } else {
      this.branchSearchControl.setValue('', { emitEvent: false });
      this.selectedIcon = {
        mat: true,
        icon: ''
      };
    }
  }
  /**
   * Fetches the list of branches and tags and sets the stored lists appropriately. After fetching the lists, checks to
   * see if the currently selected branch/tag still exists.
   * 
   * @returns {Observable} An Observable that finishes when all the setup is done
   */
  retrieveBranchesAndTags(): Observable<null> {
    this._spinnerSrv.startLoadingForComponent(this.editorBranchSelectSpinner, 15);
    const catalogId = get(this._cm.localCatalog, '@id');
    return forkJoin({
      branches: this._cm.getRecordBranches(this.state.listItem.versionedRdfRecord.recordId, catalogId, undefined, 
        undefined, true),
      tags: this._cm.getRecordVersions(this.state.listItem.versionedRdfRecord.recordId, catalogId, undefined, true)
    }).pipe(
      switchMap(responses => {
        const branches: JSONLDObject[] = responses.branches.body;
        this.receiveBranches.emit(branches);
        this.branches = branches.map(branch => {
          return {
            branchIri: branch['@id'],
            commitIri: getPropertyId(branch, `${CATALOG}head`),
            title: getDctermsValue(branch, 'title'),
            description: getDctermsValue(branch, 'description'),
            jsonld: branch
          };
        });
        const tags: JSONLDObject[] = responses.tags.body;
        this.tags = tags.map(tag => {
          return {
            tagIri: tag['@id'],
            commitIri: getPropertyId(tag, `${CATALOG}commit`),
            title: getDctermsValue(tag, 'title'),
            description: getDctermsValue(tag, 'description'),
            jsonld: tag
          };
        });
        return this.tags.length || this.branches.length ? this._checkVersionDeleted() : of(null);
      }),
      catchError(error => {
        this._toast.createErrorToast(error);
        return of(null);
      }),
      finalize(() => {
        this._spinnerSrv.finishLoadingForComponent(this.editorBranchSelectSpinner);
      }));
  }
  /**
   * Opens the {@link versioned-rdf-record-editor.EditBranchModalComponent} for the provided Branch option. If the
   * branch was edited, resets the selected title and control if it was the selected branch.
   * 
   * @param {Option} option The Branch option being edited
   * @param {Event} event The button click event
   */
  showEditBranchOverlay(option: Option, event: Event): void {
    this.autocompleteTrigger.closePanel();
    event.stopPropagation();
    this._dialog.open(EditBranchModalComponent, { data: { 
      recordId: this.state.listItem.versionedRdfRecord.recordId, 
      branch: option.jsonld
    } }).afterClosed().subscribe(result => {
      if (result) {
        option.title = getDctermsValue(option.jsonld, 'title');
        option.description = getDctermsValue(option.jsonld, 'description');
        if (option.branchIri === this.state.listItem.versionedRdfRecord.branchId) {
          this.state.listItem.currentVersionTitle = getDctermsValue(option.jsonld, 'title');
          this.resetSearch();
        }
      }
    });
    this.resetSearch();
  }
  /**
   * Opens a confirmation modal for deleting the branch identified by the provided Option. Also closes the autocomplete
   * panel. If the confirmation modal is accepted, deletes the branch.
   * 
   * @param {Option} option The Branch option to be deleted
   * @param {Event} event The button click event 
   */
  showDeleteBranchConfirmationOverlay(option: Option, event: Event): void {
    this.autocompleteTrigger.closePanel();
    event.stopPropagation();
    // TODO: insert user branch notification later
    // let msg = '';
    // if (option.isUserBranch) {
    //     msg += `<p>You have made diverging changes from the head of Branch: <strong>${option.title}</strong>. Continuing with this operation will only delete your diverging changes.</p>`;
    // }
    this._dialog.open(ConfirmModalComponent, {
      data: {
        content: `<p>Are you sure you want to delete branch <strong>${option.title}</strong>?</p>`
      }
    }).afterClosed().subscribe(result => {
      if (result) {
        this._deleteBranch(option.branchIri);
      }
    });
    this.resetSearch();
  }
  /**
   * Opens a confirmation modal for deleting the tag identified by the provided Option. Also closes the autocomplete
   * panel. If the confirmation modal is accepted, deletes the tag.
   * 
   * @param {Option} option The Tag option to be deleted
   * @param {Event} event The button click event 
   */
  showDeleteTagConfirmationOverlay(option: Option, event: Event): void {
    this.autocompleteTrigger.closePanel();
    event.stopPropagation();
    this._dialog.open(ConfirmModalComponent, {
      data: {
        content: `<p>Are you sure you want to delete tag <strong>${option.title}</strong>?</p>`
      }
    }).afterClosed().subscribe(result => {
      if (result) {
        this._deleteTag(option.tagIri);
      }
    });
    this.resetSearch();
  }
  /**
   * A method used to calculate the string to display for a selected option.
   * 
   * @param {Option|string} option The option to calculate a display value for. Might also be the search text entered
   * @returns {string} The string to display in the control
   */
  displayWith(option: Option|string): string {
    return option ? typeof option === 'string' ? option : option.title : '';
  }
  /**
   * Determines whether the provided option from the select is the currently selected version in the State service.
   * 
   * @param {Option} option The control option to determine whether it is selected
   * @returns {boolean} True if the version is currently selected; false otherwise
   */
  isSelected(option: Option): boolean {
    const isBranch = !!option.branchIri;
    const isTag = !!option.tagIri;
    return isBranch ? option.branchIri === this.state.listItem?.versionedRdfRecord.branchId :
      isTag ? option.tagIri === this.state.listItem?.versionedRdfRecord.tagId :
      option.commitIri === this.state.listItem?.versionedRdfRecord.commitId;
  }

  private _deleteBranch(branchId: string): void {
    this._cm.deleteRecordBranch(this.recordIri, branchId, get(this._cm.localCatalog, '@id', '')).subscribe(
      () => {
        this._toast.createSuccessToast(`Branch ${branchId} deleted successfully!`);
        remove(this.branches, branch => branch.branchIri === branchId);
        this.receiveBranches.emit(this.branches.map(opt => opt.jsonld));
        this.resetSearch();
        this.state.validateCurrentStateExists(this.recordIri).subscribe({
          error: () => {
            this._toast.createWarningToast('Current state no longer exists. Opening MASTER');
            this._resetToMaster().subscribe();
          }
        });
      }, 
      error => this._toast.createErrorToast(error)
    );
  }
  private _deleteTag(tagId: string): void {
    this._cm.deleteRecordVersion(tagId, this.recordIri, get(this._cm.localCatalog, '@id', ''))
      .subscribe(() => {
        this._toast.createSuccessToast(`Tag ${tagId} deleted successfully!`);
        remove(this.tags, tag => tag.tagIri === tagId);
        this.resetSearch();
        this.state.validateCurrentStateExists(this.recordIri).subscribe({
          error: () => {
            this._toast.createWarningToast('Current state no longer exists. Opening MASTER');
            this._resetToMaster().subscribe();
          }
        });
      }, error => this._toast.createErrorToast(error));
  }
  protected _setFilteredOptions(): void {
    this.filteredOptions = this.branchSearchControl.valueChanges
        .pipe(
          startWith(''),
          map(val => this.filter(val || ''))
        );
  }
  private _updateDisabled(recordIri: string): void {
    if (recordIri) {
      this.branchSearchControl.enable();
      this.retrieveBranchesAndTags().subscribe(() => this.resetSearch());
    } else {
      this.branches = [];
      this.tags = [];
      this.commits = [];
      this.branchSearchControl.disable();
      this.resetSearch();
    }
  }
  private _checkVersionDeleted(): Observable<null> {
    let ob = of(null);
    this.commits = [];
    if (this.state.listItem.versionedRdfRecord.branchId) {
      const branch = find(this.branches, {branchIri: this.state.listItem.versionedRdfRecord.branchId});
      if (!branch) {
        this._toast.createWarningToast(`Branch ${this.state.listItem.currentVersionTitle} cannot be found. Switching to MASTER`);
        ob = this._resetToMaster();
      } else {
        this.state.listItem.currentVersionTitle = branch.title;
        if (this.state.listItem.upToDate) {
          const recordState = this.state.getStateByRecordId(this.state.listItem.versionedRdfRecord.recordId);
          const commitId = this.state.getCommitIdOfBranchState(recordState, branch.branchIri);
          this.state.listItem.upToDate = commitId === branch.commitIri;
        }
      }
    } else if (this.state.listItem.versionedRdfRecord.tagId) {
      const tag = find(this.tags, {
        commitIri: this.state.listItem.versionedRdfRecord.commitId, 
        tagIri: this.state.listItem.versionedRdfRecord.tagId
      });
      if (!tag) {
        this._toast.createWarningToast(`Tag ${this.state.listItem.currentVersionTitle} cannot be found. Switching to MASTER`);
        ob = this._resetToMaster();
      } else {
        this.state.listItem.currentVersionTitle = tag.title;
      }
    } else if (this.state.listItem.versionedRdfRecord.commitId) {
      const title = condenseCommitId(this.state.listItem.versionedRdfRecord.commitId);
      this.state.listItem.currentVersionTitle = title;
      this.commits = [{
        title,
        commitIri: this.state.listItem.versionedRdfRecord.commitId
      }];
    }
    return ob;
  }
  private _resetToMaster(): Observable<null> {
    this.autocompleteTrigger.closePanel();
    return this.state.deleteState(this.state.listItem.versionedRdfRecord.recordId).pipe(
      switchMap(() => {
        this.state.close(this.state.listItem.versionedRdfRecord.recordId);
        return this.state.open({
          recordId: this.state.listItem.versionedRdfRecord.recordId,
          identifierIRI: this.state.getIdentifierIRI(),
          title: this.state.listItem.versionedRdfRecord.title
        });
      }),
      tap(() => {
        this.state.listItem.currentVersionTitle = 'MASTER';
      })
    );
  }
  private _resetControl() {
    this.resetSearch();
    this.textInput.nativeElement.blur();
    this.autocompleteTrigger.closePanel();
  }
}
