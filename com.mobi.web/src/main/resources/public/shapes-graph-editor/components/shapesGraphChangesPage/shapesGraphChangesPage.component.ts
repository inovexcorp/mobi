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
import { Component, OnChanges, Input } from '@angular/core';
import { get, map, concat, intersection, filter, chunk } from 'lodash';

import { OWL, RDF, SKOS } from '../../../prefixes';
import { CommitChange } from '../../../shared/models/commitChange.interface';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { ShapesGraphStateService } from '../../../shared/services/shapesGraphState.service';
import { UtilService } from '../../../shared/services/util.service';

import './shapesGraphChangesPage.component.scss';

interface Statements {
    id: string,
    additions?: CommitChange[],
    deletions?: CommitChange[],
}
interface CommitChanges {
    id: string,
    additions: CommitChange[],
    deletions: CommitChange[],
    disableAll: boolean
}

 /**
 * @class shapes-graph-editor.ShapesGraphChangesPageComponent
 * 
 * A component that creates a page that displays all the current users's saved changes
 * (aka inProgressCommit) of the current ShapesGraphRecord. The changes are grouped by
 * subject. The display will include a button to remove all the saved changes if there are any. If there are
 * no changes, an {@link shared.InfoMessageComponent} is shown stating as such. If the current branch is
 * not up to date and there are changes, an {@link shared.ErrorDisplayComponent} is shown. If there are
 * no changes and the current branch is not up to date, an `errorDisplay` is shown with a link to pull in the
 * latest changes. If there are no changes and the user is on a UserBranch then an `errorDisplay` is shown with
 * a link to "pull changes" which will perform a merge of the UserBranch into the parent branch. If there are
 * no changes, the user is on a UserBranch, and the parent branch no longer exists, an `errorDisplay` is shown
 * with a link to restore the parent branch with the UserBranch.
 */
@Component({
    selector: 'shapes-graph-changes-page',
    templateUrl: './shapesGraphChangesPage.component.html'
})
export class ShapesGraphChangesPageComponent implements OnChanges {

    @Input() additions: JSONLDObject[];
    @Input() deletions: JSONLDObject[];

    catalogId: string = get(this.cm.localCatalog, '@id', '');
    typeIRI = RDF + 'type';
    types = [OWL + 'Class', OWL + 'ObjectProperty', OWL + 'DatatypeProperty',
             OWL + 'AnnotationProperty', OWL + 'NamedIndividual', SKOS
             + 'Concept', SKOS + 'ConceptScheme'];

    commits: CommitChanges[] = [];
    list: CommitChanges[] = [];
    showList: CommitChanges[] = [];
    chunks: CommitChanges[][] = [];
    checkedStatements = {
        additions: [],
        deletions: []
    };

    index = 0;
    size = 100;

    constructor(public state: ShapesGraphStateService, private cm: CatalogManagerService, private util: UtilService) {}

    ngOnChanges(): void {
        const inProgressAdditions: Statements[] = map(this.additions, addition => ({
            additions: this.util.getPredicatesAndObjects(addition),
            id: addition['@id']
        }));
        const inProgressDeletions: Statements[] = map(this.deletions, deletion => ({
            deletions: this.util.getPredicatesAndObjects(deletion),
            id: deletion['@id']
        }));

        const mergedInProgressCommitsMap = [].concat(inProgressAdditions, inProgressDeletions).reduce((dict,
            currentItem) => {
            const existingValue = dict[currentItem['id']] || {};
            const mergedValue = Object.assign({ 'id': '', 'additions': [], 'deletions': []}, existingValue,
                currentItem);
            dict[currentItem.id] = mergedValue;
            return dict;
        }, {});
        const mergedInProgressCommits = Object.keys(mergedInProgressCommitsMap).map(key =>
            mergedInProgressCommitsMap[key]);
        this.list = map(mergedInProgressCommits, inProgressItem => ({
                id: inProgressItem.id,
                additions: inProgressItem.additions,
                deletions: inProgressItem.deletions,
                disableAll: this.hasSpecificType(inProgressItem.additions) || this.hasSpecificType(inProgressItem.deletions)
        } as CommitChanges));
        this.showList = this.getList();
    }
    removeChanges(): void {
        this.cm.deleteInProgressCommit(this.state.listItem.versionedRdfRecord.recordId, this.catalogId)
            .subscribe(() => {
                this.state.clearInProgressCommit();
                this.state.updateShapesGraphMetadata(this.state.listItem.versionedRdfRecord.recordId, this.state.listItem.versionedRdfRecord.branchId, this.state.listItem.versionedRdfRecord.commitId);
                this.util.createSuccessToast('In Progress Commit removed successfully.');
                this.index = 0;
            }, errorMessage => this.util.createErrorToast(`Error removing In Progress Commit: ${errorMessage}`));
    }
    getMoreResults(): void {
        this.index++;
        const currChunk = get(this.chunks, this.index, []);
        this.showList = concat(this.showList, currChunk);
    }
    hasSpecificType(array: CommitChange[]): boolean {
        return !!intersection(map(filter(array, {p: this.typeIRI}), 'o'), this.types).length;
    }
    getList(): CommitChanges[] {
        this.chunks = chunk(this.list, this.size);
        return get(this.chunks, this.index, []);
    }
    getCommitId(commit: CommitChanges): string {
        return commit.id;
    }
    openCommit(commit: CommitChanges): Promise<any> {
        return this.state.changeShapesGraphVersion(this.state.listItem.versionedRdfRecord.recordId, null, commit.id, null, this.util.condenseCommitId(commit.id))
            .then(() => {}, error => this.util.createErrorToast(error));
    }
}
