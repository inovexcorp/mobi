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
import { find, get, noop, reject } from 'lodash';
import { Inject, Component, OnInit, OnDestroy } from '@angular/core';
import { first } from 'rxjs/operators';
import { HttpResponse } from '@angular/common/http';

import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { ShapesGraphStateService } from '../../../shared/services/shapesGraphState.service';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { CATALOG } from '../../../prefixes';

import './shapesGraphMergePage.component.scss';

/**
 * @class shapes-graph-editor.ShapesGraphMergePageComponent
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
    selector: 'shapes-graph-merge-page',
    templateUrl: './shapesGraphMergePage.component.html'
})
export class ShapesGraphMergePageComponent implements OnInit, OnDestroy {
    constructor(private cm: CatalogManagerService, @Inject('utilService') private util,
                public state: ShapesGraphStateService) {
    }

    catalogId = '';
    error = '';
    branches: JSONLDObject[] = [];
    branchTitle = '';
    targetHeadCommitId = undefined;
    
    ngOnInit(): void {
        this.catalogId = get(this.cm.localCatalog, '@id', '');
        this.cm.getRecordBranches(this.state.listItem.versionedRdfRecord.recordId, this.catalogId).pipe(first()).toPromise()
            .then((response: HttpResponse<JSONLDObject[]>) => {
                this.branches = reject(response.body, {'@id': this.state.listItem.versionedRdfRecord.branchId});
                const branch = find(response.body, {'@id': this.state.listItem.versionedRdfRecord.branchId});
                this.branchTitle = this.util.getDctermsValue(branch, 'title');
                this.state.listItem.merge.difference = undefined;
                this.state.listItem.merge.startIndex = 0;
                this.state.listItem.merge.target = undefined;
            }, error => this.util.createErrorToast(error));
    }
    ngOnDestroy(): void {
        if (this.state.listItem.merge) {
            this.state.listItem.merge.difference = undefined;
            this.state.listItem.merge.startIndex = 0;
        }
    }
    changeTarget(value: JSONLDObject): void {
        this.state.listItem.merge.difference = undefined;
        this.state.listItem.merge.startIndex = 0;
        this.state.listItem.merge.target = value;
        if (this.state.listItem.merge.target) {
            this.cm.getRecordBranch(this.state.listItem.merge.target['@id'], this.state.listItem.versionedRdfRecord.recordId, this.catalogId).pipe(first()).toPromise()
                .then((target: JSONLDObject) => {
                    this.targetHeadCommitId = this.util.getPropertyId(target, CATALOG + 'head');
                    return this.state.getMergeDifferences(this.state.listItem.versionedRdfRecord.commitId, this.targetHeadCommitId, this.cm.differencePageSize, 0);
                }, error => Promise.reject(error))
                .then(noop, errorMessage => {
                    this.util.createErrorToast(errorMessage);
                    this.state.listItem.merge.difference = undefined;
                });
        } else {
            this.state.listItem.merge.difference = undefined;
        }
    }
    retrieveMoreResults(limit: number, offset: number): void {
        this.state.getMergeDifferences(this.state.listItem.versionedRdfRecord.commitId, this.targetHeadCommitId, limit, offset)
            .then(noop, this.util.createErrorToast);
    }
    submit(): void {
        this.state.attemptMerge()
            .then(() => {
                this.util.createSuccessToast('Your merge was successful.');
                this.state.cancelMerge();
            }, error => this.error = error);
    }
}
