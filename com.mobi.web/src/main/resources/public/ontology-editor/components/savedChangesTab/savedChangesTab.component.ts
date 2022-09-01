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
import { get, chunk, intersection, find, concat, forEach, sortBy } from 'lodash';
import { first, switchMap } from 'rxjs/operators';
import { Component, Inject, Input, OnChanges, OnInit } from '@angular/core';

import { CommitDifference } from '../../../shared/models/commitDifference.interface';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { OntologyManagerService } from '../../../shared/services/ontologyManager.service';
import { CATALOG, OWL, RDF, SKOS } from '../../../prefixes';
import { CommitChange } from '../../../shared/models/commitChange.interface';

interface ChangesItem {
    id: string,
    entityName: string,
    additions: CommitChange[],
    deletions: CommitChange[],
    disableAll: boolean
}

/**
 * @class ontology-editor.SavedChangesTabComponent
 *
 * A component that creates a page that displays all the current users's saved changes (aka inProgressCommit) of the
 * current {@link shared.OntologyStateService selected ontology and branch}. The changes are grouped by subject. The
 * display will include a button to remove all the saved changes if there are any. If there are no changes, an
 * {@link shared.InfoMessageComponent} is shown stating as such. If the current branch is not up to date and there are
 * changes, an {@link shared.ErrorDisplayComponent} is shown. If there are no changes and the current branch is not up
 * to date, an `errorDisplay` is shown with a link to pull in the latest changes. If there are no changes and the user
 * is on a UserBranch then an `errorDisplay` is shown with a link to "pull changes" which will perform a merge of the
 * UserBranch into the parent branch. If there are no changes, the user is on a UserBranch, and the parent branch no
 * longer exists, an `errorDisplay` is shown with a link to restore the parent branch with the UserBranch. 
 */
@Component({
    selector: 'saved-changes-tab',
    templateUrl: './savedChangesTab.component.html'
})
export class SavedChangesTabComponent implements OnInit, OnChanges {
    @Input() additions: JSONLDObject[];
    @Input() deletions: JSONLDObject[];

    typeIRI = RDF + 'type';
    types = [OWL + 'Class', OWL + 'ObjectProperty', OWL + 'DatatypeProperty', OWL + 'AnnotationProperty', OWL + 'NamedIndividual', SKOS + 'Concept', SKOS + 'ConceptScheme'];
    list: ChangesItem[] = [];
    showList: ChangesItem[] = [];
    checkedStatements = {
        additions: [],
        deletions: []
    };
    index = 0;
    size = 100;
    catalogId = '';
    error = '';
    chunks = [];

    constructor(public os: OntologyStateService, private om: OntologyManagerService, private cm: CatalogManagerService, @Inject('utilService') private util) {}
    
    ngOnInit(): void {
        this.catalogId = get(this.cm.localCatalog, '@id', '');
    }
    ngOnChanges(): void {
        const inProgressAdditions: {additions: CommitChange[], id: string}[] = (this.os.listItem.inProgressCommit.additions as JSONLDObject[]).map(addition => ({
            additions: this.util.getPredicatesAndObjects(addition),
            id: addition['@id']
        }));
        const inProgressDeletions: {deletions: CommitChange[], id: string}[] = (this.os.listItem.inProgressCommit.deletions as JSONLDObject[]).map(deletion => ({
            deletions: this.util.getPredicatesAndObjects(deletion),
            id: deletion['@id']
        }));
        const mergedInProgressCommitsMap: {[key: string]: { id: string, additions: CommitChange[], deletions: CommitChange[] }} = [].concat(inProgressAdditions, inProgressDeletions).reduce((dict, currentItem) => {
            const existingValue = dict[currentItem['id']] || {};
            const mergedValue = Object.assign({ id: '', additions: [], deletions: []}, existingValue, currentItem);
            dict[currentItem.id] = mergedValue;
            return dict;  
        }, {});
        const mergedInProgressCommits = Object.keys(mergedInProgressCommitsMap).map(key => mergedInProgressCommitsMap[key]);
        this.list = mergedInProgressCommits.map(inProgressItem => ({
                id: inProgressItem.id,
                entityName: this.os.getEntityNameByListItem(inProgressItem.id),
                additions: this.util.getPredicateLocalNameOrdered(inProgressItem.additions),
                deletions: this.util.getPredicateLocalNameOrdered(inProgressItem.deletions),
                disableAll: this._hasSpecificType(inProgressItem.additions) || this._hasSpecificType(inProgressItem.deletions)
        }));
        this.list = sortBy(this.list, 'entityName');
        this.showList = this._getList();
    }
    go($event: Event, id: string): void {
        $event.stopPropagation();
        this.os.goTo(id);
    }
    update(): void {
        this.cm.getBranchHeadCommit(this.os.listItem.versionedRdfRecord.branchId, this.os.listItem.versionedRdfRecord.recordId, this.catalogId)
            .pipe(switchMap((headCommit: CommitDifference) => {
                const commitId = get(headCommit, 'commit[\'@id\']', '');
                return this.os.updateOntology(this.os.listItem.versionedRdfRecord.recordId, this.os.listItem.versionedRdfRecord.branchId, commitId);
            }))
            .subscribe(() => this.util.createSuccessToast('Your ontology has been updated.'), error => this.util.createErrorToast(error));
    }
    restoreBranchWithUserBranch(): void {
        const userBranchId = this.os.listItem.versionedRdfRecord.branchId;
        const userBranch = find(this.os.listItem.branches, {'@id': userBranchId});
        const createdFromId = this.util.getPropertyId(userBranch, CATALOG + 'createdFrom');
        const branchConfig = {
            title: this.util.getDctermsValue(userBranch, 'title'),
            description: this.util.getDctermsValue(userBranch, 'description')
        };

        let createdBranchId;
        this.cm.createRecordBranch(this.os.listItem.versionedRdfRecord.recordId, this.catalogId, branchConfig, this.os.listItem.versionedRdfRecord.commitId)
            .pipe(switchMap((branchId: string) => {
                createdBranchId = branchId;
                return this.cm.getRecordBranch(branchId, this.os.listItem.versionedRdfRecord.recordId, this.catalogId);
            }),
            switchMap((branch: JSONLDObject) => {
                this.os.listItem.branches.push(branch);
                this.os.listItem.versionedRdfRecord.branchId = branch['@id'];
                const commitId = this.util.getPropertyId(branch, CATALOG + 'head');
                return this.os.updateState({recordId: this.os.listItem.versionedRdfRecord.recordId, commitId, branchId: createdBranchId});
            }),
            switchMap(() => this.om.deleteOntologyBranch(this.os.listItem.versionedRdfRecord.recordId, userBranchId)),
            switchMap(() => this.os.deleteBranchState(this.os.listItem.versionedRdfRecord.recordId, userBranchId)))
            .subscribe(() => {
                this.os.removeBranch(this.os.listItem.versionedRdfRecord.recordId, userBranchId).subscribe();
                this._changeUserBranchesCreatedFrom(createdFromId, createdBranchId);
                this.util.createSuccessToast('Branch has been restored with changes.');
            }, error => this.util.createErrorToast(error));
    }
    mergeUserBranch(): void {
        const branch = find(this.os.listItem.branches, {'@id': this.os.listItem.versionedRdfRecord.branchId});
        this.os.listItem.merge.target = find(this.os.listItem.branches, {'@id': this.util.getPropertyId(branch, CATALOG + 'createdFrom')});
        this.os.listItem.merge.checkbox = true;
        this.os.checkConflicts()
            .subscribe(() => {
                this.os.merge()
                    .subscribe(() => {
                        this.os.resetStateTabs();
                        this.util.createSuccessToast('Changes have been pulled successfully');
                        this.os.cancelMerge();
                    }, () => {
                        this.util.createErrorToast('Pulling changes failed');
                        this.os.cancelMerge();
                    });
            }, () => this.os.listItem.merge.active = true);
    }
    removeChanges(): void {
        this.cm.deleteInProgressCommit(this.os.listItem.versionedRdfRecord.recordId, this.catalogId)
            .pipe(switchMap(() => {
                this.os.resetStateTabs();
                return this.os.updateOntology(this.os.listItem.versionedRdfRecord.recordId, this.os.listItem.versionedRdfRecord.branchId, this.os.listItem.versionedRdfRecord.commitId, this.os.listItem.upToDate).pipe(first()).toPromise();
            }))
            .subscribe(() => this.os.clearInProgressCommit(), errorMessage => this.util.createErrorToast(errorMessage));
    }
    getMoreResults(): void {
        this.index++;
        const currChunk = get(this.chunks, this.index, []);
        this.showList = concat(this.showList, currChunk);
    }
    getEntityName(entityIRI: string): string {
        return this.os.getEntityNameByListItem(entityIRI);
    }

    private _changeUserBranchesCreatedFrom(oldCreatedFromId: string, newCreatedFromId: string): void {
        forEach(this.os.listItem.branches, branch => {
            if (this.cm.isUserBranch(branch)) {
                const currentCreatedFromId = this.util.getPropertyId(branch, CATALOG + 'createdFrom');
                if (currentCreatedFromId === oldCreatedFromId) {
                    this.util.replacePropertyId(branch, CATALOG + 'createdFrom', this.util.getPropertyId(branch, CATALOG + 'createdFrom'), newCreatedFromId);
                    this.cm.updateRecordBranch(branch['@id'], this.os.listItem.versionedRdfRecord.recordId, this.catalogId, branch)
                        .subscribe(() => this.util.createSuccessToast('Updated referenced branch.'), error => this.util.createErrorToast(error));
                }
            }
        });
        this.os.listItem.upToDate = true;
        this.os.listItem.userBranch = false;
        this.os.listItem.createdFromExists = true;
    }
    private _hasSpecificType(array: CommitChange[]): boolean {
        return !!intersection(array.filter(change => change.p === this.typeIRI).map(change => change.o), this.types).length;
    }
    private _getList() {
        this.chunks = chunk(this.list, this.size);
        return get(this.chunks, this.index, []);
    }
}