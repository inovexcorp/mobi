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
import { intersection, sortBy } from 'lodash';
import { ChangesItem } from '../../../ontology-editor/components/savedChangesTab/savedChangesTab.component';
import { OWL, RDF, SKOS } from '../../../prefixes';

import { CommitChange } from '../../models/commitChange.interface';
import { JSONLDObject } from '../../models/JSONLDObject.interface';
import { OntologyStateService } from '../../services/ontologyState.service';
import { UtilService } from '../../services/util.service';

import './commitChangesDisplay.component.scss';

export interface AdditionsWithId {
    additions: CommitChange[];
    id: string;
}

export interface DeletionsWithId {
    deletions: CommitChange[];
    id: string;
}

/**
 * @class shared.CommitChangesDisplayComponent
 *
 * A *dumb* component that creates a sequence of mat-accordion displaying the changes made to entities separated by additions and
 * deletions. Each changes display uses the `mat-expansion-panel`. The display of an entity's name can be optionally
 * controlled by the provided `entityNameFunc` function and defaults to the
 * {@link shared.UtilService beautified local name} of the IRI.
 *
 * @param {JSONLDObject[]} additions An array of JSON-LD objects representing statements added
 * @param {JSONLDObject[]} deletions An array of JSON-LD objects representing statements deleted
 * @param {Function} [entityNameFunc=undefined] An optional function to retrieve the name of an entity by it's IRI. The 
 * component will pass the IRI of the entity as the only argument
 * @param {boolean} hasMoreResults A boolean indicating if the commit has more results to display
 * @param {int} startIndex The startIndex for the offset. Used when reloading the display.
 * @param {EventEmitter} showMoreResultsEmitter A EventEmitter to retrieve more difference results. Will pass the limit and offset as 
 * arguments.
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

    @Output() showMoreResultsEmitter = new EventEmitter<{limit: number, offset: number}>();

    typeIRI = RDF + 'type';
    types = [
        OWL + 'Class',
        OWL + 'ObjectProperty',
        OWL + 'DatatypeProperty',
        OWL + 'AnnotationProperty',
        OWL + 'NamedIndividual',
        SKOS + 'Concept',
        SKOS + 'ConceptScheme'
    ];

    limit = 100; // Must be the same as the limit prop in the commitHistoryTable - Should be 100
    offsetIndex = 0;
    changesItems: ChangesItem[] = [];

    constructor(private util: UtilService, public os: OntologyStateService) {}

    ngOnInit(): void {
        if (this.startIndex) {
            this.offsetIndex = this.startIndex;
        }
    }
    ngOnChanges(changesObj: SimpleChanges): void {
        if (changesObj?.additions?.currentValue || changesObj?.deletions?.currentValue) {
            const additions: AdditionsWithId[] = (this.additions).map(addition => ({
                additions: this.util.getPredicatesAndObjects(addition),
                id: addition['@id']
            }));
            const deletions: DeletionsWithId[] = (this.deletions).map(deletion => ({
                deletions: this.util.getPredicatesAndObjects(deletion),
                id: deletion['@id']
            }));
            const commitsMap: {[key: string]: { id: string, additions: CommitChange[], deletions: CommitChange[] }} = [].concat(additions, deletions).reduce((dict, currentItem) => {
                const existingValue = dict[currentItem['id']] || {};
                const mergedValue = Object.assign({ id: '', additions: [], deletions: []}, existingValue, currentItem);
                dict[currentItem.id] = mergedValue;
                return dict;  
            }, {});
            const commits = Object.keys(commitsMap).map(key => commitsMap[key]);
            let changesItems: ChangesItem[] = commits.map(item => ({
                id: item.id,
                entityName: this.entityNameFunc ? this.entityNameFunc(item.id, this.os) : this.util.getBeautifulIRI(item.id),
                additions: this.util.getPredicateLocalNameOrdered(item.additions),
                deletions: this.util.getPredicateLocalNameOrdered(item.deletions),
                disableAll: this._hasSpecificType(item.additions) || this._hasSpecificType(item.deletions)
            }));
            this.changesItems = sortBy(changesItems, 'entityName');
        }
    }
    loadMore(): void {
        this.offsetIndex += this.limit;
        this.showMoreResultsEmitter.emit({limit: this.limit, offset: this.offsetIndex}); // Will trigger ngOnChanges
    }
    getEntityName(entityIRI: string): string {
        return this.entityNameFunc ? this.entityNameFunc(entityIRI, this.os) : this.os.getEntityNameByListItem(entityIRI);
    }
    private _hasSpecificType(array: CommitChange[]): boolean {
        return !!intersection(array.filter(change => change.p === this.typeIRI).map(change => change.o), this.types).length;
    }
}
