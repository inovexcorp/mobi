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
import { findIndex } from 'lodash';
import { Component, Inject, OnInit } from '@angular/core';

import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { OntologyManagerService } from '../../../shared/services/ontologyManager.service';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';


/**
 * @ngdoc component
 * @class ontology-editor.SeeHistoryComponent
 * @requires shared.service:catalogManagerService
 * @requires shared.service:ontologyManagerService
 * @requires shared.service:ontologyStateService
 * @requires shared.service:utilService
 *
 * @description
 * The `seeHistory` component creates a page for viewing the addition and deletion history of commits on a
 * particular entity in an ontology. If no commitId is selected, no compiled resource will be shown.
 */
@Component({
    selector: 'see-history',
    templateUrl: './seeHistory.component.html'
})

export class SeeHistoryComponent{
    commits = [];
    selectedCommit;

    constructor(public os: OntologyStateService, public om: OntologyManagerService, public cm: CatalogManagerService,
                @Inject('utilService') private util) {}

    goBack() {
        this.os.listItem.seeHistory = undefined;
        this.os.listItem['selectedCommit'] = undefined;
        this.selectedCommit = undefined;
    }
    prev() {
        const index = findIndex(this.commits, this.os.listItem.selectedCommit);
        this.os.listItem['selectedCommit'] = this.commits[index + 1];
        this.selectedCommit = this.commits[index + 1];
    }
    next() {
        const index = this.commits.indexOf(this.os.listItem.selectedCommit);
        this.os.listItem['selectedCommit'] = this.commits[index - 1];
        this.selectedCommit = this.commits[index - 1];
    }
    getEntityNameDisplay(iri) {
        return this.om.isBlankNodeId(iri) ? this.os.getBlankNodeValue(iri) : this.os.getEntityNameByListItem(iri);
    }
    receiveCommits(commits) {
        this.commits = commits;
        if (this.commits[0]) {
            this.os.listItem.selectedCommit = this.commits[0];
            this.selectedCommit = this.commits[0];
            this.selectCommit();
        }
    }
    createLabel(commitId) {
        let label = this.util.condenseCommitId(commitId);
        if (commitId == this.commits[0].id) {
            label = label + ' (latest)';
        }
        return label;
    }
    selectCommit() {
        this.os.listItem.selectedCommit = this.selectedCommit;
    }
}
