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
import { HttpResponse } from '@angular/common/http';
import { Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatAutocompleteTrigger, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { find, get, remove } from 'lodash';
import { forkJoin, Observable } from 'rxjs';
import { first, map, startWith, switchMap } from 'rxjs/operators';

import { CATALOG } from '../../../prefixes';
import { ConfirmModalComponent } from '../../../shared/components/confirmModal/confirmModal.component';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { ShapesGraphStateService } from '../../../shared/services/shapesGraphState.service';
import { ToastService } from '../../../shared/services/toast.service';
import { condenseCommitId, getDctermsValue, getPropertyId } from '../../../shared/utility';

export interface OptionGroup {
    title: string,
    options: Option[]
}

export interface Option {
    title: string,
    branchIri?: string,
    tagIri?: string,
    commitIri?: string,
    description?: string
}

/**
 * @class shape-graph-editor.EditorBranchSelectComponent
 *
 * `editor-branch-select` is a component that provides a `mat-select` for choosing what branch to view.
 */
@Component({
    selector: 'editor-branch-select',
    templateUrl: './editorBranchSelect.component.html'
})
export class EditorBranchSelectComponent implements OnInit, OnChanges {
    @Input() recordIri;
    @Input() branchTitle;
    @ViewChild(MatAutocompleteTrigger, { static: true }) autocompleteTrigger: MatAutocompleteTrigger;
    @ViewChild('textInput', { static: true }) textInput: ElementRef;

    branchSearchControl: UntypedFormControl = new UntypedFormControl();
   
    branches: Option[] = [];
    tags: Option[] = [];
    commits: Option[] = [];
    selectedIcon = {
        mat: true,
        icon: ''
    };

    filteredOptions: Observable<OptionGroup[]>

    constructor(private state: ShapesGraphStateService, private cm: CatalogManagerService,
                private dialog: MatDialog, private toast: ToastService) {}

    ngOnInit(): void {
        this.setFilteredOptions();
        this.updateDisabled(this.recordIri);
    }
    ngOnChanges(changes: SimpleChanges): void {
        if (changes?.recordIri && !changes?.recordIri.firstChange) {
            this.updateDisabled(changes.recordIri.currentValue);
        }
        if (changes?.branchTitle?.currentValue) {
            if (changes?.branchTitle?.previousValue) {
                this.retrieveBranchesAndTags();
            }
            this.resetSearch();
        }
    }
    filter(val: string): OptionGroup[] {
        const filteredBranches = this.branches
          .filter(option => option.title.toLowerCase().includes(val.toString().toLowerCase()));
        const rtn = [{ title: 'Branches', options: filteredBranches }];
        if (this.tags.length > 0) {
            const filteredTags = this.tags
              .filter(option => option.title.toLowerCase().includes(val.toString().toLowerCase()));
            rtn.push({ title: 'Tags', options: filteredTags });
        }
        if (this.commits.length > 0) {
            const filteredCommits = this.commits
              .filter(option => option.title.toLowerCase().includes(val.toString().toLowerCase()));
            rtn.push({ title: 'Commits', options: filteredCommits });
        }
        return rtn;
    }
    selectVersion(event: MatAutocompleteSelectedEvent): void {
        if (this.state.isCommittable()) {
            this.toast.createWarningToast('Cannot switch branches while there are uncommitted changes');
            return;
        }
        if (event?.option?.value?.branchIri && event?.option?.value?.commitIri) {
            const branchId = event.option.value.branchIri;
            this.cm.getRecordBranch(branchId, this.state.listItem.versionedRdfRecord.recordId,
                get(this.cm.localCatalog, '@id', '')).pipe(
                switchMap(branch => {
                    return this.state.changeShapesGraphVersion(this.state.listItem.versionedRdfRecord.recordId, 
                        branchId, 
                        getPropertyId(branch, `${CATALOG}head`), 
                        undefined, 
                        event.option.value.title);
                })
            ).subscribe(() => {
                  this.resetSearch();
            }, error => { 
                this.toast.createErrorToast(error);
            });
        }
        if (event?.option?.value?.tagIri && event?.option?.value?.commitIri) {
            this.cm.getCommit(event.option.value.commitIri).pipe(
                switchMap(headCommit => {
                    return this.state.changeShapesGraphVersion(this.state.listItem.versionedRdfRecord.recordId, 
                      undefined, 
                      headCommit['@id'], 
                      event.option.value.tagIri, 
                      event.option.value.title);
                })
            ).subscribe(() =>  {
                return this.resetSearch();
            }, error => { 
                this.toast.createErrorToast(error);
            });
        }
    }
    close(): void {
        this.textInput.nativeElement.blur();
        this.resetSearch();
    }
    resetSearch(): void {
        if (this.state?.listItem?.currentVersionTitle) {
            this.branchSearchControl.setValue(this.state.listItem.currentVersionTitle);
            const branch = find(this.branches, {'branchIri': this.state.listItem.versionedRdfRecord.branchId});
            const tag = find(this.tags, {
              'commitIri': this.state.listItem.versionedRdfRecord.commitId, 
              'tagIri': this.state.listItem.versionedRdfRecord.tagId
            });
            const commit = find(this.commits, {'commitIri': this.state.listItem.versionedRdfRecord.commitId});

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
            this.branchSearchControl.setValue('');
            this.selectedIcon = {
                mat: true,
                icon: ''
            };
        }
    }
    retrieveBranchesAndTags(): Promise<void> {
        const getBranchesOb: Observable<HttpResponse<JSONLDObject[]>> = 
          this.cm.getRecordBranches(this.state.listItem.versionedRdfRecord.recordId, get(this.cm.localCatalog, '@id'));
        const getTagsOb: Observable<HttpResponse<JSONLDObject[]>> = 
          this.cm.getRecordVersions(this.state.listItem.versionedRdfRecord.recordId, get(this.cm.localCatalog, '@id'));
        return forkJoin([getBranchesOb, getTagsOb]).toPromise()
            .then((responses: HttpResponse<JSONLDObject[]>[]) => {
                const branches: JSONLDObject[] = responses[0].body;
                this.branches = branches.map(branch => {
                    return {
                        branchIri: branch['@id'],
                        commitIri: getPropertyId(branch, `${CATALOG}head`),
                        title: getDctermsValue(branch, 'title'),
                        description: getDctermsValue(branch, 'description')
                    } as Option;
                });
                const tags: JSONLDObject[] = responses[1].body;
                this.tags = tags.map(tag => {
                    return {
                        tagIri: tag['@id'],
                        commitIri: getPropertyId(tag, `${CATALOG}commit`),
                        title: getDctermsValue(tag, 'title'),
                        description: getDctermsValue(tag, 'description')
                    } as Option;
                });
                let promise = Promise.resolve();
                if (this.tags.length || this.branches.length) {
                    promise = this.checkVersionDeleted();
                }
                this.setFilteredOptions();
                this.resetSearch();
                return promise;
            }, error => Promise.reject(error))
            .then(() => {}, error => this.toast.createErrorToast(error));
    }
    showDeleteBranchConfirmationOverlay(option: Option, event: Event): void {
        this.autocompleteTrigger.closePanel();
        event.stopPropagation();
        this.dialog.open(ConfirmModalComponent, {
            data: {
                content: `<p>Are you sure you want to delete branch <strong>${option.title}</strong>?</p>`
            }
        }).afterClosed().subscribe(result => {
            if (result) {
                this.deleteShapesGraphBranch(option.branchIri);
            }
        });
        this.resetSearch();
    }
    showDeleteTagConfirmationOverlay(option: Option, event: Event): void {
        this.autocompleteTrigger.closePanel();
        event.stopPropagation();
        this.dialog.open(ConfirmModalComponent, {
            data: {
                content: `<p>Are you sure you want to delete tag <strong>${option.title}</strong>?</p>`
            }
        }).afterClosed().subscribe(result => {
            if (result) {
                this.deleteShapesGraphTag(option.tagIri);
            }
        });
        this.resetSearch();
    }
    private deleteShapesGraphBranch(branchId: string): void {
        this.state.deleteShapesGraphBranch(this.recordIri, branchId).subscribe(
            () => this.toast.createSuccessToast(`Branch ${branchId} deleted successfully!`), 
            error => this.toast.createErrorToast(error)
        );
    }
    private deleteShapesGraphTag(tagId: string): void {
        this.cm.deleteRecordVersion(tagId, this.recordIri, get(this.cm.localCatalog, '@id', ''))
            .subscribe(() => {
                remove(this.state.listItem.tags, {'@id': tagId});
                this.toast.createSuccessToast(`Tag ${tagId} deleted successfully!`);
            }, error => this.toast.createErrorToast(error));
    }
    protected setFilteredOptions(): void {
        this.filteredOptions = this.branchSearchControl.valueChanges
            .pipe(
                startWith(''),
                map(val => this.filter(val))
            );
    }
    private updateDisabled(recordIri: string): void {
        if (recordIri) {
            this.branchSearchControl.enable();
            this.retrieveBranchesAndTags();
        } else {
            this.branchSearchControl.disable();
            this.resetSearch();
        }
    }
    private checkVersionDeleted(): Promise<void> {
        let promise = Promise.resolve();
        this.commits = [];
        if (this.state.listItem.versionedRdfRecord.branchId) {
            const branch = find(this.branches, {branchIri: this.state.listItem.versionedRdfRecord.branchId});
            if (!branch) {
                this.toast.createWarningToast(`Branch ${this.state.listItem.currentVersionTitle} cannot be found. Switching to MASTER`);
                promise = this.resetToMaster();
            } else {
                this.state.listItem.currentVersionTitle = branch.title;
            }
        } else if (this.state.listItem.versionedRdfRecord.tagId) {
            const tag = find(this.tags, {
              commitIri: this.state.listItem.versionedRdfRecord.commitId, 
              tagIri: this.state.listItem.versionedRdfRecord.tagId
            });
            if (!tag) {
                this.toast.createWarningToast(`Tag ${this.state.listItem.currentVersionTitle} cannot be found. Switching to MASTER`);
                promise = this.resetToMaster();
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
        return promise;
    }
    private resetToMaster(): Promise<void> {
        this.autocompleteTrigger.closePanel();
        return this.state.deleteState(this.state.listItem.versionedRdfRecord.recordId).toPromise()
          .then(() => {
              this.state.closeShapesGraph(this.state.listItem.versionedRdfRecord.recordId);
              return this.state.openShapesGraph({
                  recordId: this.state.listItem.versionedRdfRecord.recordId,
                  title: this.state.listItem.versionedRdfRecord.title
              }).pipe(first()).toPromise();
          }, error => Promise.reject(error))
          .then(() => {
              this.state.listItem.currentVersionTitle = 'MASTER';
          }, error => Promise.reject(error));
    }
}
