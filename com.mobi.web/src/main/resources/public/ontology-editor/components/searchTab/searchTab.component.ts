/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2023 iNovex Information Systems, Inc.
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
import { forEach, isEmpty, omit, cloneDeep } from 'lodash';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { Subscription } from 'rxjs';

import { OntologyManagerService } from '../../../shared/services/ontologyManager.service';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { ProgressSpinnerService } from '../../../shared/components/progress-spinner/services/progressSpinner.service';

import './searchTab.component.scss';

/**
 * @class ontology-editor.SearchTabComponentComponent
 *
 * `searchTab` is a component that creates a page containing a form for searching for entities in the current
 * {@link shared.OntologyStateService#listItem selected ontology}. The display includes a search input, a manual 'tree'
 * of the results grouped by entity type, and a display of the matching properties on the selected search result. The
 * search input performs a case-insensitive search among the property values on entities in the ontology. A search
 * result item can be doubled clicked to open it in its appropriate tab in the
 * {@link ontology-editor.OntologyTabComponent}.
 */
@Component({
    selector: 'search-tab',
    templateUrl: './searchTab.component.html'
})
export class SearchTabComponent implements OnDestroy {
    @ViewChild('searchResults') searchResults: ElementRef;

    sub: Subscription;

    constructor(public os: OntologyStateService, public om: OntologyManagerService, 
        private spinnerSvc: ProgressSpinnerService) {}
        
    ngOnDestroy(): void {
        if (this.sub && !this.sub.closed) {
            this.sub.unsubscribe();
        }
    }
    onKeyup(): void {
        if (this.os.listItem.editorTabStates.search.searchText) {
            this.unselectItem();
            const state = this.os.listItem.editorTabStates;
            this.spinnerSvc.startLoadingForComponent(this.searchResults);
            this.sub = this.om.getSearchResults(this.os.listItem.versionedRdfRecord.recordId, this.os.listItem.versionedRdfRecord.branchId, this.os.listItem.versionedRdfRecord.commitId, this.os.listItem.editorTabStates.search.searchText)
                .pipe(finalize(() => {
                    this.spinnerSvc.finishLoadingForComponent(this.searchResults);
                }))
                .subscribe(results => {
                    state.search.errorMessage = '';
                    forEach(results, arr => {
                        arr.sort((iri1, iri2) => this.os.getEntityNameByListItem(iri1, this.os.listItem).localeCompare(this.os.getEntityNameByListItem(iri2, this.os.listItem)));
                    });
                    state.search.results = results;
                    this.countResults();
                    state.search.infoMessage = !isEmpty(results) ? '' : 'There were no results for your search text.';
                    state.search.highlightText = state.search.searchText;
                }, errorMessage => {
                    state.search.errorMessage = errorMessage;
                    state.search.infoMessage = '';
                    state.search.warningMessage = '';
                });
        } else {
            this.os.resetSearchTab();
        }
    }
    canGoTo(): boolean {
        return !!this.os.listItem.editorTabStates.search.entityIRI && !(this.om.isOntology(this.os.listItem.selected) && this.os.listItem.editorTabStates.search.entityIRI !== this.os.listItem.ontologyId);
    }
    goToIfYouCan(item: string): void {
        if (this.canGoTo()) {
            this.os.goTo(item);
        }
    }
    selectItem(item: string): void {
        this.os.selectItem(item, false)
            .subscribe(() => {
                this.os.listItem.editorTabStates.search.selected = omit(cloneDeep(this.os.listItem.selected), '@id', '@type', 'mobi');
            });
    }
    unselectItem(): void {
        this.os.unSelectItem();
        this.os.listItem.editorTabStates.search.selected = undefined;
    }
    searchChanged(value): void {
        this.os.listItem.editorTabStates.search.searchText = value;
    }
    trackByIndex = (index: number): number => {
        return index;
    };
    trackByKey = (index: number, item: any): string => {
        return item.key;
    };
    private countResults(): void {
        let count = 0;
        for (const key of Object.keys(this.os.listItem.editorTabStates.search.results)) {
            count += this.os.listItem.editorTabStates.search.results[key].length;
        }
        this.os.listItem.editorTabStates.search.warningMessage = (count === 500) ? 'Search results truncated because they exceeded 500 items.' : '';
    }
}
