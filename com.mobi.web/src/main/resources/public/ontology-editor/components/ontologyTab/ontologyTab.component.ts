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
import { find, get } from 'lodash';
import { switchMap } from 'rxjs/operators';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MatTabChangeEvent } from '@angular/material';

import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { ONTOLOGYSTATE } from '../../../prefixes';
import { OntologyListItem } from '../../../shared/models/ontologyListItem.class';

import './ontologyTab.component.scss';

/**
 * @class ontology-editor.OntologyTabComponent
 *
 * A component that creates a `div` containing all the components necessary for displaying an ontology. This includes a
 * {@link ontology-editor.MergeTabComponent}, {@link ontology-editor.OntologyButtonStackComponent}, and a
 * `mat-tab-group`. The `mat-tab-group` contains tabs for the {@link ontology-editor.ProjectTabComponent},
 * {@link ontology-editor.OverviewTabComponent}, {@link ontology-editor.ClassesTabComponent},
 * {@link ontology-editor.PropertiesTabComponent}, {@link ontology-editor.IndividualsTabComponent},
 * {@link ontology-editor.ConceptSchemesTabComponent}, {@link ontology-editor.ConceptsTabComponent},
 * {@link ontology-editor.SearchTabComponent}, {@link ontology-editor.SavedChangesTabComponent}, and
 * {@link ontology-editor.CommitsTabComponent}.
 */
@Component({
    selector: 'ontology-tab',
    templateUrl: './ontologyTab.component.html'
})
export class OntologyTabComponent implements OnInit, OnDestroy {
    constructor(public os: OntologyStateService, private cm: CatalogManagerService, @Inject('utilService') private util) {}
    
    ngOnInit(): void {
        this._checkBranchExists();
    }
    ngOnDestroy(): void {
        if (this.os.listItem && this.os.listItem.openSnackbar) {
            this.os.listItem.openSnackbar.dismiss();
        }
    }
    onTabChanged(event: MatTabChangeEvent): void {
        switch (event.index) {
            case OntologyListItem.PROJECT_TAB:
                this.os.setSelected(this.os.listItem.editorTabStates.project.entityIRI, false, this.os.listItem, this.os.listItem.editorTabStates.project.component).subscribe();
                break;
            case OntologyListItem.OVERVIEW_TAB:
                this.os.setSelected(this.os.listItem.editorTabStates.overview.entityIRI, true).subscribe();
                break;
            case OntologyListItem.CLASSES_TAB:
                this.os.setSelected(this.os.listItem.editorTabStates.classes.entityIRI, true).subscribe();
                break;
            case OntologyListItem.PROPERTIES_TAB:
                this.os.setSelected(this.os.listItem.editorTabStates.properties.entityIRI, true).subscribe();
                break;
            case OntologyListItem.INDIVIDUALS_TAB:
                this.os.setSelected(this.os.listItem.editorTabStates.individuals.entityIRI, false).subscribe();
                break;
            case OntologyListItem.CONCEPTS_SCHEMES_TAB:
                this.os.setSelected(this.os.listItem.editorTabStates.schemes.entityIRI, false).subscribe();
                break;
            case OntologyListItem.CONCEPTS_TAB:
                this.os.setSelected(this.os.listItem.editorTabStates.concepts.entityIRI, false).subscribe();
                break;
            case OntologyListItem.SEARCH_TAB:
                this.os.setSelected(this.os.listItem.editorTabStates.search.entityIRI, false).subscribe();
                break;
            default:
        }
    }

    private _checkBranchExists() {
        if (this.os.listItem.versionedRdfRecord.branchId && !find(this.os.listItem.branches, {'@id': this.os.listItem.versionedRdfRecord.branchId})) {
            const catalogId = get(this.cm.localCatalog, '@id', '');
            const masterBranch = find(this.os.listItem.branches, branch => this.util.getDctermsValue(branch, 'title') === 'MASTER')['@id'];
            const state = this.os.getStateByRecordId(this.os.listItem.versionedRdfRecord.recordId);
            let commitId = this.util.getPropertyId(find(state.model, {[ONTOLOGYSTATE + 'branch']: [{'@id': masterBranch}]}), ONTOLOGYSTATE + 'commit');
            this.cm.getBranchHeadCommit(masterBranch, this.os.listItem.versionedRdfRecord.recordId, catalogId)
                .pipe(switchMap(headCommit => {
                    const headCommitId = get(headCommit, 'commit[\'@id\']', '');
                    if (!commitId) {
                        commitId = headCommitId;
                    }
                    return this.os.updateOntology(this.os.listItem.versionedRdfRecord.recordId, masterBranch, commitId, commitId === headCommitId);
                }))
                .subscribe(() => this.os.resetStateTabs(), error => this.util.createErrorToast(error));
        }
    }
}