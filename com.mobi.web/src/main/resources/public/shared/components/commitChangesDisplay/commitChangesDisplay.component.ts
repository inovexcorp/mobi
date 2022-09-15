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

import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { map, forEach, filter, union, orderBy, isEmpty } from 'lodash';

import { CommitChange } from '../../models/commitChange.interface';
import { JSONLDObject } from '../../models/JSONLDObject.interface';
import { OntologyStateService } from '../../services/ontologyState.service';
import { UtilService } from '../../services/util.service';

import './commitChangesDisplay.component.scss';

/**
 * @class shared.CommitChangesDisplayComponent
 *
 * A component that creates a sequence of divs displaying the changes made to entities separated by additions and
 * deletions. Each changes display uses the `.property-values` class. The display of an entity's name can be optionally
 * controlled by the provided `entityNameFunc` function and defaults to the
 * {@link shared.UtilService beautified local name} of the IRI.
 *
 * @param {JSONLDObject[]} additions An array of JSON-LD objects representing statements added
 * @param {JSONLDObject[]} deletions An array of JSON-LD objects representing statements deleted
 * @param {Function} [entityNameFunc=undefined] An optional function to retrieve the name of an entity by it's IRI. The 
 * component will pass the IRI of the entity as the only argument
 * @param {Function} showMoreResultsFunc A function retrieve more difference results. Will pass the limit and offset as 
 * arguments.
 * @param {boolean} hasMoreResults A boolean indicating if the commit has more results to display
 * @param {int} startIndex The startIndex for the offset. Used when reloading the display.
 */

@Component({
    selector: 'commit-changes-display',
    templateUrl: './commitChangesDisplay.component.html'
})
export class CommitChangesDisplayComponent implements OnInit, OnChanges {
    @Input() additions: JSONLDObject[];
    @Input() deletions: JSONLDObject[];
    @Input() entityNameFunc?: (entityIRI: string, os: OntologyStateService) => string;
    @Input() hasMoreResults: boolean;
    @Input() startIndex?: number;

    @Output() showMoreResultsFunc = new EventEmitter<{limit: number, offset: number}>();

    size = 100; // Must be the same as the limit prop in the commitHistoryTable
    index = 0;
    list = [];
    chunkList = [];
    results: { [key: string]: { additions: CommitChange[], deletions: CommitChange[] } } = {};
    showMore = false;
    
    constructor(private util: UtilService, public os: OntologyStateService) {}

    ngOnInit(): void {
        if (this.startIndex) {
            this.index = this.startIndex;
        }
    }
    ngOnChanges(changesObj: SimpleChanges): void {
        if (changesObj?.additions?.currentValue || changesObj?.deletions?.currentValue) {
            let adds;
            let deletes;
            if (isEmpty(this.results)) {
                adds = map(this.additions, '@id');
                deletes = map(this.deletions, '@id');
            } else {
                adds = filter(map(this.additions, '@id'), id => !this.results[id]);
                deletes = filter(map(this.deletions, '@id'), id => !this.results[id]);
            }
            const combined = union(adds, deletes);
            this.list = orderBy(combined, item => item, 'asc');
            this.addPagedChangesToResults();
        }
    }
    addPagedChangesToResults(): void {
        forEach(this.list, id => {
            this._addToResults(this.util.getChangesById(id, this.additions), this.util.getChangesById(id, this.deletions), id, this.results);
        });
        this.showMore = this.hasMoreResults;
    }
    getMorePagedChanges(): void {
        this.index += this.size;
        this.showMoreResultsFunc.emit({limit: this.size, offset: this.index}); // Should trigger ngOnChanges
    }
    private _addToResults(additions: CommitChange[], deletions: CommitChange[], id: string, results): void {
        results[id] = { additions: additions, deletions: deletions };
    }
}
