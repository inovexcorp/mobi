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
import { Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { find, get, noop, remove } from 'lodash';
import { switchMap, startWith, map } from 'rxjs/operators';
import { MatAutocompleteSelectedEvent, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatDialog } from '@angular/material/dialog';
import { UntypedFormControl } from '@angular/forms';
import { Observable } from 'rxjs';

import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { OntologyManagerService } from '../../../shared/services/ontologyManager.service';
import { OntologyListItem } from '../../../shared/models/ontologyListItem.class';
import { State } from '../../../shared/models/state.interface';
import { CATALOG, DCTERMS, ONTOLOGYSTATE } from '../../../prefixes';
import { ConfirmModalComponent } from '../../../shared/components/confirmModal/confirmModal.component';
import { EditBranchOverlayComponent } from '../editBranchOverlay/editBranchOverlay.component';
import { OntologyAction } from '../../../shared/models/ontologyAction';
import { UtilService } from '../../../shared/services/util.service';

interface OptionGroup {
    title: string
    options: Option[]
}

interface Option {
    title: string,
    type: string,
    canDelete: boolean,
    isUserBranch: boolean,
    jsonld: JSONLDObject,
    icon: OptionIcon
}

export class OptionIcon {
    static readonly BRANCH = new OptionIcon('BRANCH', { mat: false, icon: 'fa fa-code-fork fa-lg'});
    static readonly TAG = new OptionIcon('TAG', { mat: true, icon: 'local_offer'});
    static readonly COMMIT = new OptionIcon('COMMIT', { mat: true, icon: 'commit'});

    private constructor(private readonly key: string, public readonly value: {mat: boolean, icon: string}) {}

    toString(): string {
        return this.key;
    }
}

/**
 * @class ontology-editor.OpenOntologySelectComponent
 *
 * A component that creates a `mat-autocomplete` containing the branches and tags of the provided
 * {@link shared.OntologyStateService listItem} and depending on the state, the currently open commit. Each branch in
 * the `mat-autocomplete` has buttons for editing the metadata and deleting the branch which will open a confirmation
 * modal. Each tag in the `mat-autocomplete` has a button for deleting the tag which will open a  confirmation model.
 * The component also houses the method for opening a modal for
 * {@link ontology-editor.EditBranchOverlayComponent editing a branch}.
 *
 * @param {OntologyListItem} listItem An item from {@link shared.OntologyStateService#list}
 */
@Component({
    selector: 'open-ontology-select',
    templateUrl: './openOntologySelect.component.html',
    styleUrls: ['./openOntologySelect.component.scss']
})
export class OpenOntologySelectComponent implements OnInit, OnChanges/*, DoCheck*/ {
    @Input() listItem: OntologyListItem;
    
    state: State;
    selected: Option = undefined;
    currentState: JSONLDObject = undefined;
    catalogId = '';

    ontologySearchControl: UntypedFormControl = new UntypedFormControl();
    filteredOptions: Observable<OptionGroup[]>

    @ViewChild('ontologySearch', { static: true }) ontologySearch: ElementRef;
    @ViewChild(MatAutocompleteTrigger, { static: true }) autocompleteTrigger: MatAutocompleteTrigger;

    constructor(private dialog: MatDialog, public cm: CatalogManagerService, public os: OntologyStateService, 
        private om: OntologyManagerService, public util: UtilService) {}

    ngOnInit(): void {
        this.catalogId = get(this.cm.localCatalog, '@id', '');
        this.filteredOptions = this.ontologySearchControl.valueChanges
            .pipe(
                startWith(''),
                map(val => this.filter(val))
            );
        if (this.listItem) {
            this.updateState();
        }
        this.os.ontologyRecordAction$.subscribe(action => {
            if (action.recordId === this.listItem?.versionedRdfRecord.recordId && action.action === OntologyAction.UPDATE_STATE) {
                this.updateState();
            }
        });
    }
    ngOnChanges(changes: SimpleChanges): void {
        if (changes.listItem && changes.listItem.currentValue) {
            if (this.os.hasChanges(changes.listItem.currentValue) || this.os.isCommittable(changes.listItem.currentValue)) {
                this.ontologySearchControl.disable();
            } else {
                this.ontologySearchControl.enable();
            }
            this.updateState();
        }
    }
    updateState(): void {
        this.state = this.os.getStateByRecordId(this.listItem?.versionedRdfRecord.recordId);
        const recordState = find(get(this.state, 'model', []), {'@type': [ONTOLOGYSTATE + 'StateRecord']});
        const currentStateId = this.util.getPropertyId(recordState, ONTOLOGYSTATE + 'currentState');
        this.currentState = find(this.state.model, {'@id': currentStateId});
        this._setSelected();
        this.ontologySearchControl.setValue(this.selected?.title);
    }
    filter(val: string): OptionGroup[] {
        if (!this.listItem) {
            return [];
        }
        const search = val || '';
        const filteredBranches = this.listItem.branches
            .map(branch => this._createBranchOption(branch))
            .filter(option => option.title.toLowerCase().includes(search.toString().toLowerCase()));
        const filteredTags = this.listItem.tags
            .map(tag => this._createTagOption(tag))
            .filter(option => option.title.toLowerCase().includes(search.toString().toLowerCase()));
        
        const rtn: OptionGroup[] = [{ title: 'Branches', options: filteredBranches }];
        
        if (filteredTags.length) {
            rtn.push({ title: 'Tags', options: filteredTags });
        }
        if (this.selected?.type === 'Commit') {
            const filteredCommits = [this.selected].filter(option => option.title.toLowerCase().includes(search.toString().toLowerCase()));
            rtn.push({ title: 'Commits', options: filteredCommits });
        }
        
        return rtn;
    }
    canDelete(entity: JSONLDObject): boolean {
        if (this.cm.isBranch(entity)) {
            return get(entity, '@id') !== this.listItem.versionedRdfRecord.branchId && this.listItem.userCanModify && this.util.getDctermsValue(entity, 'title') !== 'MASTER';
        } else if (this.cm.isTag(entity)) {
            return this.util.getPropertyId(this.currentState, ONTOLOGYSTATE + 'tag') !== get(entity, '@id') && this.listItem.userCanModify;
        } else {
            return false;
        }
    }
    changeEntity(event: MatAutocompleteSelectedEvent): void {
        if (!event?.option?.value) {
            return;
        }
        this.updateSelected(event.option.value);
        this.ontologySearch.nativeElement.blur();
    }
    updateSelected(option: Option): void {
        this.selected = option;
        if (this.selected.type === 'Branch') {
            const branchId = this.selected.jsonld['@id'];
            let commitId = this.util.getPropertyId(find(this.state?.model, {[ONTOLOGYSTATE + 'branch']: [{'@id': branchId}]}), ONTOLOGYSTATE + 'commit');
            this.cm.getRecordBranch(branchId, this.listItem.versionedRdfRecord.recordId, this.catalogId).pipe(
                switchMap((branch: JSONLDObject) => {
                    const headCommitId = get(branch, [CATALOG + 'head', 0, '@id'], '');
                    if (!commitId) {
                        commitId = headCommitId;
                    }
                    return this.os.updateOntology(this.listItem.versionedRdfRecord.recordId, branchId, commitId, commitId === headCommitId);
                })).subscribe(() => {
                    this.ontologySearchControl.setValue(this.selected.title);
                    this.os.resetStateTabs(this.listItem);
                }, error => this.util.createErrorToast(error));
        } else if (this.selected.type === 'Tag') {
            const tagId = this.selected.jsonld['@id'];
            const commitId = this.util.getPropertyId(this.selected.jsonld, CATALOG + 'commit');
            this.cm.getCommit(commitId).pipe(
                switchMap(() => this.os.updateOntologyWithCommit(this.listItem.versionedRdfRecord.recordId, commitId, tagId))
            ).subscribe(() => {
                this.ontologySearchControl.setValue(this.selected.title);
                this.os.resetStateTabs(this.listItem);
            }, error => this.util.createErrorToast(error));
        }
    }
    openPanel(): void {
        this.ontologySearchControl.setValue('');
    }
    closePanel(): void {
        this.ontologySearchControl.setValue(this.selected ? this.selected.title : '');
    }
    openDeleteConfirmation(option: Option, event: Event): void {
        this.autocompleteTrigger.closePanel();
        event.stopPropagation();
        if (option.type === 'Branch') {
            let msg = '';
            if (option.isUserBranch) {
                msg += '<p>You have made diverging changes from the head of Branch: <strong>' + option.title + '</strong>. Continuing with this operation will only delete your diverging changes.</p>';
            }
            this.dialog.open(ConfirmModalComponent, {
                data: {
                    content: msg + '<p>Are you sure that you want to delete Branch: <strong>' + option.title + '</strong>?</p>'
                }
            }).afterClosed().subscribe((result: boolean) => {
                if (result) {
                    this.deleteBranch(option.jsonld);
                }
            });
        } else if (option.type === 'Tag') {
            this.dialog.open(ConfirmModalComponent, {
                data: {
                    content: '<p>Are you sure that you want to delete Tag: <strong>' + option.title + '</strong>?</p>'
                }
            }).afterClosed().subscribe((result: boolean) => {
                if (result) {
                    this.deleteTag(option.jsonld);
                }
            });
        }
    }
    openEditOverlay(branch: JSONLDObject, event: Event): void {
        this.autocompleteTrigger.closePanel();
        event.stopPropagation();
        this.dialog.open(EditBranchOverlayComponent, { data: { branch } }).afterClosed().subscribe(result => {
            if (result) {
                this.handleBranchEdit(branch);
            }
        });
    }
    deleteBranch(branch: JSONLDObject): void {
        this.om.deleteOntologyBranch(this.listItem.versionedRdfRecord.recordId, branch['@id']).pipe(
            switchMap(() => this.os.removeBranch(this.listItem.versionedRdfRecord.recordId, branch['@id'])),
            switchMap(() => this.os.deleteBranchState(this.listItem.versionedRdfRecord.recordId, branch['@id']))
        ).subscribe(() => {
            if (!this.os.isStateBranch(this.currentState)) {
                this.cm.getCommit(this.util.getPropertyId(this.currentState, ONTOLOGYSTATE + 'commit'))
                    .subscribe(noop, () => {
                        this.changeToMaster();
                    });
            } else {
                this.ontologySearchControl.setValue(this.selected.title);
                this.os.resetStateTabs(this.listItem);
            }
        }, error => this.util.createErrorToast(error));
    }
    deleteTag(tag: JSONLDObject): void {
        this.cm.deleteRecordVersion(tag['@id'], this.listItem.versionedRdfRecord.recordId, this.catalogId).subscribe(() => {
            remove(this.listItem.tags, {'@id': tag['@id']});
            if (!this.os.isStateTag(this.currentState)) {
                this.cm.getCommit(this.util.getPropertyId(this.currentState, ONTOLOGYSTATE + 'commit')).subscribe(noop, () => {
                    this.changeToMaster();
                });
            } else {
                this.ontologySearchControl.setValue(this.selected.title);
                this.os.resetStateTabs(this.listItem);
            }
        }, error => this.util.createErrorToast(error));
    }
    handleBranchEdit(branch: JSONLDObject): void {
        if (branch['@id'] === this.listItem.versionedRdfRecord.branchId) {
            this._setSelected();
            this.ontologySearchControl.setValue(this.selected?.title);
        }
    }
    changeToMaster(): void {
        this.util.createWarningToast((this.os.isStateTag(this.currentState) ? 'Tag' : 'Commit') + ' no longer exists. Opening MASTER');
        this.updateSelected({
            title: 'MASTER',
            type: 'Branch',
            isUserBranch: false,
            canDelete: false,
            jsonld: {'@id': this.listItem.masterBranchIri, '@type': [CATALOG + 'Branch']},
            icon: OptionIcon.BRANCH
        });
    }

    private _setSelected() {
        if (this.os.isStateBranch(this.currentState)) {
            this.selected = this._createBranchOption(find(this.listItem.branches, {'@id': this.util.getPropertyId(this.currentState, ONTOLOGYSTATE + 'branch')}));
        } else if (this.os.isStateTag(this.currentState)) {
            this.selected = this._createTagOption(find(this.listItem.tags, {'@id': this.util.getPropertyId(this.currentState, ONTOLOGYSTATE + 'tag')}));
        } else {
            const commitId = this.util.getPropertyId(this.currentState, ONTOLOGYSTATE + 'commit');
            this.selected = {
                title: this.util.condenseCommitId(commitId),
                type: 'Commit',
                isUserBranch: false,
                canDelete: false,
                jsonld: {
                    '@id': commitId,
                    '@type': [CATALOG + 'Commit'],
                    [DCTERMS + 'title']: [{'@value': this.util.condenseCommitId(commitId)}]
                },
                icon: OptionIcon.COMMIT
            };
        }
    }
    private _createBranchOption(jsonld: JSONLDObject): Option {
        return {
            title: this.util.getDctermsValue(jsonld, 'title'),
            type: 'Branch',
            canDelete: this.canDelete(jsonld),
            isUserBranch: this.cm.isUserBranch(jsonld),
            jsonld: jsonld,
            icon: OptionIcon.BRANCH
        };
    }
    private _createTagOption(jsonld: JSONLDObject): Option {
        return {
            title: this.util.getDctermsValue(jsonld, 'title'),
            type: 'Tag',
            canDelete: this.canDelete(jsonld),
            isUserBranch: false,
            jsonld: jsonld,
            icon: OptionIcon.TAG
        };
    }
}
