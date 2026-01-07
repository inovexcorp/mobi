/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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
import { findIndex } from 'lodash';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { finalize, first, switchMap } from 'rxjs/operators';

import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { OntologyManagerService } from '../../../shared/services/ontologyManager.service';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { Commit } from '../../../shared/models/commit.interface';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { CommitDifference } from '../../../shared/models/commitDifference.interface';
import { ProgressSpinnerService } from '../../../shared/components/progress-spinner/services/progressSpinner.service';
import { condenseCommitId, getEntityName, isBlankNodeId } from '../../../shared/utility';

/**
 * @class ontology-editor.SeeHistoryComponent
 *
 * A component that creates a page for viewing the addition and deletion history of commits on a particular entity in an
 * ontology. If no commitId is selected, no compiled resource will be shown.
 */
@Component({
    selector: 'see-history',
    templateUrl: './seeHistory.component.html',
    styleUrls: ['./seeHistory.component.scss']
})

export class SeeHistoryComponent implements OnInit {
    commits: Commit[] = [];
    selectedCommit;
    resource: JSONLDObject;
    changes: CommitDifference;
    error = '';
    entityName = '';

    @ViewChild('compiledResource') compiledResource: ElementRef;
    
    constructor(public os: OntologyStateService, public om: OntologyManagerService, public cm: CatalogManagerService,
                private spinnerSvc: ProgressSpinnerService) {}
    
    ngOnInit(): void {
      this.entityName = getEntityName(this.os.listItem.selected);
    }

    goBack(): void {
        this.os.listItem.seeHistory = undefined;
        this.os.listItem['selectedCommit'] = undefined;
        this.selectedCommit = undefined;
    }
    prev(): void {
        const index = findIndex(this.commits, this.os.listItem.selectedCommit);
        this.selectedCommit = this.commits[index + 1];
        this.selectCommit();
    }
    next(): void {
        const index = this.commits.indexOf(this.os.listItem.selectedCommit);
        this.selectedCommit = this.commits[index - 1];
        this.selectCommit();
    }
    getEntityNameDisplay(iri: string): string {
        return isBlankNodeId(iri) ? this.os.getBlankNodeValue(iri) : this.os.getEntityName(iri);
    }
    receiveCommits(commits: Commit[]): void {
        this.commits = commits;
        if (this.commits[0]) {
            this.selectedCommit = this.commits[0];
            this.selectCommit();
        }
    }
    createLabel(commitId: string): string {
        let label = condenseCommitId(commitId);
        if (commitId === this.commits[0].id) {
            label = `${label} (latest)`;
        }
        return label;
    }
    selectCommit(): void {
        this.os.listItem.selectedCommit = this.selectedCommit;
        this.setData();
    }
    setData(): void {
        const entityId = this.os.listItem.selected['@id'];
        const commitId = this.os.listItem.selectedCommit.id;
        this.spinnerSvc.startLoadingForComponent(this.compiledResource);
        this.cm.getCompiledResource(commitId, entityId, true)
            .pipe(
                finalize(() => {
                    this.spinnerSvc.finishLoadingForComponent(this.compiledResource);
                }),
                first(),
                switchMap( (resources: JSONLDObject[]) => {
                    this.resource = resources.find(obj => obj['@id'] === entityId);
                    return this.cm.getDifferenceForSubject(entityId, commitId).pipe(first());
                })
            )
            .subscribe((response: CommitDifference) => {
                this.changes = response;
                this.error = '';
            }, errorMessage => {
                this.error = errorMessage;
                this.resource = undefined;
                this.changes = undefined;
            });
    }
}
