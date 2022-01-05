/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2021 iNovex Information Systems, Inc.
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
import { Inject, Component, OnChanges, Input } from '@angular/core';
import { get, map, concat, intersection, filter, chunk } from 'lodash';
import { ShapesGraphStateService } from '../../../shared/services/shapesGraphState.service';

import './shapesGraphChangesPage.component.scss';

 /**
 * @class shapes-graph-editor.ShapesGraphChangesPageComponent
 * 
 * A component that creates a page that displays all the current users's saved changes
 * (aka inProgressCommit) of the current ShapesGraphRecord. The changes are grouped by
 * subject. The display will include a button to remove all the saved changes if there are any. If there are
 * no changes, an {@link shared.component:infoMessage} is shown stating as such. If the current branch is
 * not up to date and there are changes, an {@link shared.component:errorDisplay} is shown. If there are
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

    @Input() additions;
    @Input() deletions;

    catalogId: string = get(this.cm.localCatalog, '@id', '');
    typeIRI = this.prefixes.rdf + 'type';
    types = [this.prefixes.owl + 'Class', this.prefixes.owl + 'ObjectProperty', this.prefixes.owl + 'DatatypeProperty',
             this.prefixes.owl + 'AnnotationProperty', this.prefixes.owl + 'NamedIndividual', this.prefixes.skos
             + 'Concept', this.prefixes.skos + 'ConceptScheme'];

    list = [];
    showList = [];
    checkedStatements = {
        additions: [],
        deletions: []
    };

    index = 0;
    size = 100;

    constructor(public state: ShapesGraphStateService, @Inject('catalogManagerService') private cm,
                @Inject('utilService') private util, @Inject('prefixes') private prefixes) {}

    ngOnChanges(): void {
        const inProgressAdditions = map(this.additions, addition => ({
            additions: this.util.getPredicatesAndObjects(addition),
            id: addition['@id']
        }));
        const inProgressDeletions = map(this.deletions, deletion => ({
            deletions: this.util.getPredicatesAndObjects(deletion),
            id: deletion['@id']
        }));
        const mergedInProgressCommitsMap = [].concat(inProgressAdditions, inProgressDeletions).reduce((dict,
            currentItem) => {
            const existingValue = dict[currentItem['id']] || {};
            const mergedValue = Object.assign({ 'id' : '', 'additions' : [], 'deletions' : []}, existingValue,
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
        }));
        this.showList = this.getList();
    }
    removeChanges(): void {
        this.cm.deleteInProgressCommit(this.state.listItem.versionedRdfRecord.recordId, this.catalogId)
            .then(() => {
                this.state.clearInProgressCommit();
                this.util.createSuccessToast('In Progress Commit removed successfully.');
            }, errorMessage => this.util.createErrorToast(`Error removing In Progress Commit: ${errorMessage}`));
    }
    getMoreResults = function() {
        this.index++;
        const currChunk = get(this.chunks, this.index, []);
        this.showList = concat(this.showList, currChunk);
    }
    hasSpecificType = function(array) {
        return !!intersection(map(filter(array, {p: this.typeIRI}), 'o'), this.types).length;
    }
    getList = function() {
        this.chunks = chunk(this.list, this.size);
        return get(this.chunks, this.index, []);
    }
}