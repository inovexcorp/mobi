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
import { get, chunk, intersection, find, concat, forEach, sortBy } from 'lodash';
import { switchMap } from 'rxjs/operators';
import { Component, Input, OnChanges, OnInit } from '@angular/core';

import { CommitDifference } from '../../../shared/models/commitDifference.interface';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { CATALOG, OWL, SKOS } from '../../../prefixes';
import { ToastService } from '../../../shared/services/toast.service';
import { Difference } from '../../../shared/models/difference.class';
import { getDctermsValue, getPropertyId, isBlankNodeId, replacePropertyId } from '../../../shared/utility';

export interface ChangesItem {
    id: string,
    entityName: string,
    difference: Difference,
    disableAll: boolean,
    showFull: boolean,
    resource: JSONLDObject,
    isBlankNode: boolean
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
    templateUrl: './savedChangesTab.component.html',
    styleUrls: ['./savedChangesTab.component.scss']
})
export class SavedChangesTabComponent implements OnInit, OnChanges {
    @Input() difference: Difference;

    types = [
        `${OWL}Class`,
        `${OWL}ObjectProperty`,
        `${OWL}DatatypeProperty`,
        `${OWL}AnnotationProperty`,
        `${OWL}NamedIndividual`,
        `${SKOS}Concept`,
        `${SKOS}ConceptScheme`
    ];
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

    constructor(public os: OntologyStateService, private cm: CatalogManagerService, private toast: ToastService) {}
    
    ngOnInit(): void {
        this.catalogId = get(this.cm.localCatalog, '@id', '');
    }
    ngOnChanges(): void {
        let mergedInProgressCommitsMap: { [key: string]: Difference } = (this.difference.additions as JSONLDObject[]).reduce((dict, currentItem) => {
            const diff = new Difference();
            diff.additions = [currentItem];
            dict[currentItem['@id']] = diff;
            return dict;
        }, {});
        mergedInProgressCommitsMap = (this.difference.deletions as JSONLDObject[]).reduce((dict, currentItem) => {
            const diff: Difference = dict[currentItem['@id']] ? dict[currentItem['@id']] : new Difference();
            diff.deletions = [currentItem];
            dict[currentItem['@id']] = diff ;
            return dict;
        }, mergedInProgressCommitsMap);
        this.list = Object.keys(mergedInProgressCommitsMap).map(id => ({
            id,
            difference: mergedInProgressCommitsMap[id],
            entityName: this.os.getEntityNameByListItem(id),
            disableAll: this._hasSpecificType(mergedInProgressCommitsMap[id], id),
            showFull: false,
            resource: undefined,
            isBlankNode: isBlankNodeId(id)
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
            .subscribe(() => this.toast.createSuccessToast('Your ontology has been updated.'), error => this.toast.createErrorToast(error));
    }
    restoreBranchWithUserBranch(): void {
        const userBranchId = this.os.listItem.versionedRdfRecord.branchId;
        const userBranch = find(this.os.listItem.branches, {'@id': userBranchId});
        const createdFromId = getPropertyId(userBranch, `${CATALOG}createdFrom`);
        const branchConfig = {
            title: getDctermsValue(userBranch, 'title'),
            description: getDctermsValue(userBranch, 'description')
        };

        let createdBranchId;
        const localCatalogId = get(this.cm.localCatalog, '@id', '');
        this.cm.createRecordBranch(this.os.listItem.versionedRdfRecord.recordId, this.catalogId, branchConfig, this.os.listItem.versionedRdfRecord.commitId)
            .pipe(switchMap((branchId: string) => {
                createdBranchId = branchId;
                return this.cm.getRecordBranch(branchId, this.os.listItem.versionedRdfRecord.recordId, this.catalogId);
            }),
            switchMap((branch: JSONLDObject) => {
                this.os.listItem.branches.push(branch);
                this.os.listItem.versionedRdfRecord.branchId = branch['@id'];
                const commitId = getPropertyId(branch, `${CATALOG}head`);
                return this.os.updateState({recordId: this.os.listItem.versionedRdfRecord.recordId, commitId, branchId: createdBranchId});
            }),
            switchMap(() => this.cm.deleteRecordBranch(this.os.listItem.versionedRdfRecord.recordId, userBranchId, localCatalogId))
        ).subscribe(() => {
                this._changeUserBranchesCreatedFrom(createdFromId, createdBranchId);
                this.toast.createSuccessToast('Branch has been restored with changes.');
            }, error => this.toast.createErrorToast(error));
    }
    mergeUserBranch(): void {
        const branch = find(this.os.listItem.branches, {'@id': this.os.listItem.versionedRdfRecord.branchId});
        this.os.listItem.merge.target = find(this.os.listItem.branches, {'@id': getPropertyId(branch, `${CATALOG}createdFrom`)});
        this.os.listItem.merge.checkbox = true;
        this.os.checkConflicts()
            .subscribe(() => {
                this.os.merge()
                    .subscribe(() => {
                        this.os.resetStateTabs();
                        this.toast.createSuccessToast('Changes have been pulled successfully');
                        this.os.cancelMerge();
                    }, () => {
                        this.toast.createErrorToast('Pulling changes failed');
                        this.os.cancelMerge();
                    });
            }, () => this.os.listItem.merge.active = true);
    }
    removeChanges(): void {
        this.cm.deleteInProgressCommit(this.os.listItem.versionedRdfRecord.recordId, this.catalogId)
            .pipe(switchMap(() => {
                this.os.resetStateTabs();
                return this.os.updateOntology(this.os.listItem.versionedRdfRecord.recordId, this.os.listItem.versionedRdfRecord.branchId, this.os.listItem.versionedRdfRecord.commitId, this.os.listItem.upToDate);
            }))
            .subscribe(() => {
                this.os.clearInProgressCommit();
                this.index = 0;
            }, errorMessage => this.toast.createErrorToast(errorMessage));
    }
    getMoreResults(): void {
        this.index++;
        const currChunk = get(this.chunks, this.index, []);
        this.showList = concat(this.showList, currChunk);
    }
    getEntityName(entityIRI: string): string {
        return this.os.getEntityNameByListItem(entityIRI);
    }
    toggleFull(item: ChangesItem): void {
        if (item.showFull) {
            this.cm.getCompiledResource(this.os.listItem.versionedRdfRecord.commitId, item.id)
                .subscribe((resources: JSONLDObject[]) => {
                    item.resource = resources.find(obj => obj['@id'] === item.id);
                }, () => {
                    this.toast.createErrorToast('Error retrieving full entity information');
                });
        } else {
            item.resource = undefined;
        }
    }

    private _changeUserBranchesCreatedFrom(oldCreatedFromId: string, newCreatedFromId: string): void {
        forEach(this.os.listItem.branches, branch => {
            if (this.cm.isUserBranch(branch)) {
                const currentCreatedFromId = getPropertyId(branch, `${CATALOG}createdFrom`);
                if (currentCreatedFromId === oldCreatedFromId) {
                    replacePropertyId(branch, `${CATALOG}createdFrom`, getPropertyId(branch, `${CATALOG}createdFrom`), newCreatedFromId);
                    this.cm.updateRecordBranch(branch['@id'], this.os.listItem.versionedRdfRecord.recordId, this.catalogId, branch)
                        .subscribe(() => this.toast.createSuccessToast('Updated referenced branch.'), error => this.toast.createErrorToast(error));
                }
            }
        });
        this.os.listItem.upToDate = true;
        this.os.listItem.userBranch = false;
        this.os.listItem.createdFromExists = true;
    }
    private _hasSpecificType(difference: Difference, entityId: string): boolean {
        const addObj = (difference.additions as JSONLDObject[]).find(obj => obj['@id'] === entityId);
        const addTypes = addObj ? addObj['@type'] || [] : [];
        const delObj = (difference.deletions as JSONLDObject[]).find(obj => obj['@id'] === entityId);
        const delTypes = delObj ? delObj['@type'] || [] : [];
        return !!intersection(addTypes.concat(delTypes), this.types).length;
    }
    private _getList() {
        this.chunks = chunk(this.list, this.size);
        return get(this.chunks, this.index, []);
    }
}
