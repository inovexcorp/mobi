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

import { Component, Inject, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { map, forEach, filter, union, orderBy, isEmpty } from 'lodash';

import './commitChangesDisplay.component.scss';
import { CommitChange } from '../../models/commitChange.interface';
/**
 * @ngdoc component
 * @name shared.component:commitChangesDisplay
 * @requires shared.service:utilService
 *
 * @description
 * `commitChangesDisplay` is a component that creates a sequence of divs displaying the changes made to entities
 * separated by additions and deletions. Each changes display uses the `.property-values` class. The display of an
 * entity's name can be optionally controlled by the provided `entityNameFunc` function and defaults to the
 * {@link shared.service:utilService beautified local name} of the IRI.
 *
 * @param {Object[]} additions An array of JSON-LD objects representing statements added
 * @param {Object[]} deletions An array of JSON-LD objects representing statements deleted
 * @param {Function} [entityNameFunc=undefined] An optional function to retrieve the name of an entity by it's IRI. The component will pass the IRI of the entity as the only argument
 * @param {Function} showMoreResultsFunc A function retrieve more difference results. Will pass the limit and offset as arguments.
 * @param {boolean} hasMoreResults A boolean indicating if the commit has more results to display
 * @param {int} startIndex The startIndex for the offset. Used when reloading the display.
 */

@Component({
    selector: 'commit-changes-display',
    templateUrl: './commitChangesDisplay.component.html'
})
export class CommitChangesDisplayComponent implements OnInit, OnChanges {
    @Input() additions: CommitChange[];
    @Input() deletions: CommitChange[];
    @Input() entityNameFunc?: (args: any) => string;
    @Input() hasMoreResults: boolean;
    @Input() startIndex?: number;
    @Input() showMoreResultsFunc: (limit: number, offset: number) => void

    size = 100; // Must be the same as the limit prop in the commitHistoryTable
    index = 0;
    list = [];
    chunkList = [];
    results = {};
    showMore = false;
    
    constructor(@Inject('utilService') private util) {}

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
            this.addToResults(this.util.getChangesById(id, this.additions), this.util.getChangesById(id, this.deletions), id, this.results);
        });
        this.showMore = this.hasMoreResults;
    }
    getMorePagedChanges(): void {
        this.index += this.size;
        this.showMoreResultsFunc(this.size, this.index); // Should trigger ngOnChanges
    }
    private addToResults(additions, deletions, id, results): void {
        results[id] = { additions: additions, deletions: deletions };
    }
}