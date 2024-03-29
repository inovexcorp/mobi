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
import {Component, EventEmitter, Input, Output} from '@angular/core';
import { find } from 'lodash';

import { ONTOLOGYSTATE } from '../../../prefixes';
import { Commit } from '../../../shared/models/commit.interface';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { ToastService } from '../../../shared/services/toast.service';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { getDctermsValue, getPropertyId } from '../../../shared/utility';

/**
 * @class ontology-editor.CommitsTabComponent
 *
 * A component that creates a page containing the {@link shared.CommitHistoryTableComponent} for the current
 * {@link shared.OntologyStateService#listItem selected ontology} with a graph. It also creates a table with buttons for
 * viewing the ontology at each commit.
 */
@Component({
    selector: 'commits-tab',
    templateUrl: './commitsTab.component.html',
    styleUrls: ['./commitsTab.component.scss']
})
export class CommitsTabComponent {
    private readonly warningMessageCheckout = 'You will need to commit or remove all changes before checking out a commit';
    commits: Commit[] = [];
    @Input() branches: JSONLDObject[] = [];
    @Output() doRealignTabs = new EventEmitter<boolean>();

    constructor(public os: OntologyStateService, private toast: ToastService) {}
    
    getHeadTitle(): string {
        if (this.os.listItem.versionedRdfRecord.branchId) {
            const branch = find(this.os.listItem.branches, { '@id': this.os.listItem.versionedRdfRecord.branchId });
            return getDctermsValue(branch, 'title');
        } else {
            const currentState = this.os.getCurrentStateByRecordId(this.os.listItem.versionedRdfRecord.recordId);
            if (this.os.isStateTag(currentState)) {
                const tagId = getPropertyId(currentState, `${ONTOLOGYSTATE}tag`);
                const tag = find(this.os.listItem.tags, {'@id': tagId});
                return getDctermsValue(tag, 'title');
            } else {
                return '';
            }
        }
    }
    openOntologyAtCommit(commit: Commit): void {
        if (this.os.isCommittable(this.os.listItem)) {
            this.toast.createWarningToast(this.warningMessageCheckout);
            return;
        }
        this.os.updateOntologyWithCommit(this.os.listItem.versionedRdfRecord.recordId, commit.id).subscribe(() => {
            this.doRealignTabs.emit(true);
        });
    }
    trackCommits(index: number, item: Commit): string {
        return item.id;
    }
}
