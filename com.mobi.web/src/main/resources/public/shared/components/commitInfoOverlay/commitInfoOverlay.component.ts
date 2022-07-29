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

import { HttpResponse } from '@angular/common/http';
import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { get, map, merge, union } from 'lodash';
import { first } from 'rxjs/operators';

import { CommitDifference } from '../../models/commitDifference.interface';
import { UserManagerService } from '../../services/userManager.service';
import { CatalogManagerService } from '../../services/catalogManager.service';
import { JSONLDObject } from '../../models/JSONLDObject.interface';

import './commitInfoOverlay.component.scss';

/**
 * @class shared.CommitInfoOverlayComponent
 *
 * A component that creates content for a modal displaying information about the passed
 * commit object including a {@link shared.CommitChangesDisplayComponent commit changes display} of the passed
 * additions and deletions for the commit. Meant to be used in conjunction with the `MatDialog` service. Expects the
 * following data to be provided.
 *
 * @param {Object} resolve.commit The commit to display information about
 * @param {string} resolve.commit.id The IRI string identifying the commit
 * @param {string} resolve.ontRecordId An optional IRI string representing an OntologyRecord to query for names if present
 */
@Component({
    selector: 'commit-info-overlay',
    templateUrl: './commitInfoOverlay.component.html'
})
export class CommitInfoOverlayComponent implements OnInit {
    additions: JSONLDObject[] = [];
    deletions: JSONLDObject[] = [];
    hasMoreResults = false;
    entityNames = {};
    tempAdditions: JSONLDObject[] = [];
    tempDeletions: JSONLDObject[] = [];

    constructor(private dialogRef: MatDialogRef<CommitInfoOverlayComponent>, @Inject(MAT_DIALOG_DATA) public data: any,
                @Inject('utilService') public util, public um: UserManagerService,
                private cm: CatalogManagerService, @Inject('ontologyManagerService') private om) {
    }

    ngOnInit(): void {
        this.retrieveMoreResults(100, 0);
    }
    cancel(): void {
        this.dialogRef.close(false);
    }
    retrieveMoreResults(limit: number, offset: number): Promise<any> {
        return this.cm.getDifference(this.data.commit.id, null, limit, offset).pipe(first()).toPromise()
            .then((response: HttpResponse<CommitDifference>) => {
                this.tempAdditions = response.body.additions as JSONLDObject[];
                this.tempDeletions = response.body.deletions as JSONLDObject[];
                const headers = response.headers;
                this.hasMoreResults = (headers.get('has-more-results') || 'false') === 'true';

                if (this.data.ontRecordId) {
                    const diffIris = union(map(this.tempAdditions, '@id'), map(this.tempDeletions, '@id'));
                    const filterIris = union(diffIris, this.util.getObjIrisFromDifference(this.tempAdditions), this.util.getObjIrisFromDifference(this.tempDeletions));
                    return this.om.getOntologyEntityNames(this.data.ontRecordId, '', this.data.commit.id, false, false, filterIris);
                }
                return Promise.resolve();
            }, errorMessage => {
                return Promise.reject(errorMessage);
            })
            .then(data => {
                if (data) {
                    merge(this.entityNames, data);
                }
                this.additions = this.tempAdditions;
                this.deletions = this.tempDeletions;
                this.tempAdditions = [];
                this.tempDeletions = [];
            }, errorMessage => {
                if (errorMessage) {
                    this.util.createErrorToast(errorMessage);
                }
            });
    }
    getEntityName(iri: string): string {
        if (get(this.entityNames, [iri, 'label'])) {
            return this.entityNames[iri].label;
        } else {
            return this.util.getBeautifulIRI(iri);
        }
    }
}
