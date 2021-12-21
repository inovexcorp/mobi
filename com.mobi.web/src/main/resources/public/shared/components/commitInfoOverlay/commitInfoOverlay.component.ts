/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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

import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {get, map, merge, union} from 'lodash';
import { UserManagerService } from '../../services/userManager.service';
import './commitInfoOverlay.component.scss'

/**
 * @ngdoc component
 * @name shared.component:commitInfoOverlay
 * @requires shared.service:utilService
 * @requires shared.service:userManagerService
 * @requires shared.service:catalogManagerService
 *
 * @description
 * `commitInfoOverlay` is a component that creates content for a modal displaying information about the passed
 * commit object including a {@link shared.component:commitChangesDisplay commit changes display} of the passed
 * additions and deletions for the commit. Meant to be used in conjunction with the
 * {@link shared.service:modalService}.
 *
 * @param {Object} resolve Information provided to the modal
 * @param {Function} resolve.entityNameFunc An optional function to pass to `commitChangesDisplay` to control the
 * display of each entity's name
 * @param {Object} resolve.commit The commit to display information about
 * @param {string} resolve.commit.id The IRI string identifying the commit
 * @param {string} resolve.commit.message The message associated with the commit
 * @param {Object} resolve commit.creator An object containing information about the creator of the commit,
 * including the username, first name, and last name
 * @param {string} resolve.commit.date The date string of when the commit was created
 * @oaram {string} [recordId=''] resolve.recordId An optional IRI string representing an OntologyRecord to query for names if present
 */
@Component({
    selector: 'commit-info-overlay',
    templateUrl: './commitInfoOverlay.component.html'
})
export class CommitInfoOverlayComponent implements OnInit {
    additions = [];
    deletions = [];
    hasMoreResults = false;
    entityNames = {};
    tempAdditions = [];
    tempDeletions = [];

    constructor(private dialogRef: MatDialogRef<CommitInfoOverlayComponent>, @Inject(MAT_DIALOG_DATA) public data: any,
                @Inject('utilService') public util, public um: UserManagerService,
                @Inject('catalogManagerService') private cm, @Inject('ontologyManagerService') private om) {
    }

    ngOnInit(): void {
        this.retrieveMoreResults(100, 0);
    }
    cancel(): void {
        this.dialogRef.close(false);
    }
    retrieveMoreResults(limit: number, offset: number): Promise<any> {
        return this.cm.getDifference(this.data.commit.id, null, limit, offset)
            .then(response => {
                this.tempAdditions = response.data.additions;
                this.tempDeletions = response.data.deletions;
                const headers = response.headers();
                this.hasMoreResults = get(headers, 'has-more-results', false) === 'true';

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