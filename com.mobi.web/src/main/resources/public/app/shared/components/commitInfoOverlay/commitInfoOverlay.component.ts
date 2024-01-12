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
import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { get, merge, union } from 'lodash';
import { map, switchMap } from 'rxjs/operators';
import { of, Observable } from 'rxjs';

import { CommitDifference } from '../../models/commitDifference.interface';
import { CatalogManagerService } from '../../services/catalogManager.service';
import { JSONLDObject } from '../../models/JSONLDObject.interface';
import { OntologyManagerService } from '../../services/ontologyManager.service';
import { ToastService } from '../../services/toast.service';
import { EntityNames } from '../../models/entityNames.interface';
import { Commit } from '../../models/commit.interface';
import { ONTOLOGYEDITOR } from '../../../prefixes';
import { getBeautifulIRI, getDate, getObjIrisFromDifference } from '../../utility';
import { User } from '../../models/user.class';

/**
 * @class shared.CommitInfoOverlayComponent
 *
 * A component that creates content for a modal displaying information about the passed
 * commit object including a {@link shared.CommitChangesDisplayComponent commit changes display} of the passed
 * additions and deletions for the commit. Meant to be used in conjunction with the `MatDialog` service. Expects the
 * following data to be provided.
 *
 * @param {Commit} MAT_DIALOG_DATA.commit The commit to display information about including the commit IRI
 * @param {string} MAT_DIALOG_DATA.ontRecordId An optional IRI string representing an OntologyRecord to query for names
 * if present
 */
@Component({
    selector: 'commit-info-overlay',
    templateUrl: './commitInfoOverlay.component.html',
    styleUrls: ['./commitInfoOverlay.component.scss']
})
export class CommitInfoOverlayComponent implements OnInit {
    additions: JSONLDObject[] = [];
    deletions: JSONLDObject[] = [];
    hasMoreResults = false;
    entityNames = {};
    tempAdditions: JSONLDObject[] = [];
    tempDeletions: JSONLDObject[] = [];
    date = '';
    userDisplay: string;

    constructor(private dialogRef: MatDialogRef<CommitInfoOverlayComponent>, 
                @Inject(MAT_DIALOG_DATA) public data: {ontRecordId: string, commit: Commit, type: string},
                private toast: ToastService, private cm: CatalogManagerService,
                private om: OntologyManagerService) {
    }

    ngOnInit(): void {
        this.userDisplay = User.getDisplayName(this.data.commit.creator);
        this.date = getDate(this.data.commit.date, 'short');
        this.retrieveMoreResults(100, 0);
    }
    cancel(): void {
        this.dialogRef.close(false);
    }
    retrieveMoreResults(limit: number, offset: number): void {
        this.cm.getDifference(this.data.commit.id, null, limit, offset)
            .pipe(
                switchMap((response: HttpResponse<CommitDifference>): Observable<EntityNames> => {
                    this.tempAdditions = response.body.additions as JSONLDObject[];
                    this.tempDeletions = response.body.deletions as JSONLDObject[];
                    const headers = response.headers;
                    this.hasMoreResults = (headers.get('has-more-results') || 'false') === 'true';

                    if (this.data.ontRecordId && (this.data.type === ONTOLOGYEDITOR + 'OntologyRecord')) {
                        const diffIris = union(this.tempAdditions.map(obj => obj['@id']), this.tempDeletions.map(obj => obj['@id']));
                        const filterIris = union(diffIris, getObjIrisFromDifference(this.tempAdditions), getObjIrisFromDifference(this.tempDeletions));
                        return this.om.getOntologyEntityNames(this.data.ontRecordId, '', this.data.commit.id, false, false, filterIris);
                    }
                    return of(null);
                }),
                map(data => {
                    if (data) { // only do this if ontology record, otherwise, set to empty object
                        merge(this.entityNames, data);
                    }
                    this.additions = this.additions.concat(this.tempAdditions);
                    this.deletions = this.deletions.concat(this.tempDeletions);
                    this.tempAdditions = [];
                    this.tempDeletions = [];
                    return null;
                })
            ).subscribe(() => {}, error => this.toast.createErrorToast(error));
    }
    getEntityName(iri: string): string {
        if (get(this.entityNames, [iri, 'label'])) {
            return this.entityNames[iri].label;
        } else {
            return getBeautifulIRI(iri);
        }
    }
}
