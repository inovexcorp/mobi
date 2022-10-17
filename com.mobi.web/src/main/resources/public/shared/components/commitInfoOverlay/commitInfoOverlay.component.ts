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
import { get, merge, union } from 'lodash';
import { catchError, map, switchMap } from 'rxjs/operators';
import { of, throwError, noop, Observable } from 'rxjs';

import { CommitDifference } from '../../models/commitDifference.interface';
import { UserManagerService } from '../../services/userManager.service';
import { CatalogManagerService } from '../../services/catalogManager.service';
import { JSONLDObject } from '../../models/JSONLDObject.interface';
import { OntologyManagerService } from '../../services/ontologyManager.service';
import { UtilService } from '../../services/util.service';

import './commitInfoOverlay.component.scss';
import { EntityNames } from '../../models/entityNames.interface';

/**
 * @class shared.CommitInfoOverlayComponent
 *
 * A component that creates content for a modal displaying information about the passed
 * commit object including a {@link shared.CommitChangesDisplayComponent commit changes display} of the passed
 * additions and deletions for the commit. Meant to be used in conjunction with the `MatDialog` service. Expects the
 * following data to be provided.
 *
 * @param {Object} MAT_DIALOG_DATA.commit The commit to display information about
 * @param {string} MAT_DIALOG_DATA.commit.id The IRI string identifying the commit
 * @param {string} MAT_DIALOG_DATA.ontRecordId An optional IRI string representing an OntologyRecord to query for names if present
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
                public util: UtilService, public um: UserManagerService, private cm: CatalogManagerService,
                private om: OntologyManagerService) {
    }

    ngOnInit(): void {
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

                    if (this.data.ontRecordId) {
                        const diffIris = union(this.tempAdditions.map(obj => obj['@id']), this.tempDeletions.map(obj => obj['@id']));
                        const filterIris = union(diffIris, this.util.getObjIrisFromDifference(this.tempAdditions), this.util.getObjIrisFromDifference(this.tempDeletions));
                        return this.om.getOntologyEntityNames(this.data.ontRecordId, '', this.data.commit.id, false, false, filterIris);
                    }
                    return of(null);
                }),
                map(data => {
                    if (data) {
                        merge(this.entityNames, data);
                    }
                    this.additions = this.additions.concat(this.tempAdditions);
                    this.deletions = this.deletions.concat(this.tempDeletions);
                    this.tempAdditions = [];
                    this.tempDeletions = [];
                    return null;
                }),
                catchError(errorMessage => {
                    if (errorMessage) {
                        this.util.createErrorToast(errorMessage);
                    }
                    return throwError(errorMessage);
                })
            ).subscribe(noop, this.util.createErrorToast);
    }
    getEntityName(iri: string): string {
        if (get(this.entityNames, [iri, 'label'])) {
            return this.entityNames[iri].label;
        } else {
            return this.util.getBeautifulIRI(iri);
        }
    }
}
