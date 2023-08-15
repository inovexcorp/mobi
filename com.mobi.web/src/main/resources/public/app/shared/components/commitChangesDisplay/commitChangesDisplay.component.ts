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

import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { intersection, sortBy } from 'lodash';

import { ChangesItem } from '../../../ontology-editor/components/savedChangesTab/savedChangesTab.component';
import { OWL, SKOS } from '../../../prefixes';
import { Difference } from '../../models/difference.class';
import { JSONLDObject } from '../../models/JSONLDObject.interface';
import { CatalogManagerService } from '../../services/catalogManager.service';
import { OntologyStateService } from '../../services/ontologyState.service';
import { UtilService } from '../../services/util.service';

/**
 * @class shared.CommitChangesDisplayComponent
 *
 * A *dumb* component that creates a sequence of mat-accordion displaying the changes made to entities separated by
 * additions and deletions. Each changes display uses the `mat-expansion-panel`. The display of an entity's name can be
 * optionally controlled by the provided `entityNameFunc` function and defaults to the
 * {@link shared.UtilService beautified local name} of the IRI. The display of the changes can optionally include a
 * toggle to include all triples for an entity in the expansion panel body. This controlled by the presence of the
 * `commitId` input. If not present, the toggle will not be shown.
 *
 * @param {string} [commitId=''] An optional Commit IRI to use in the Show Full toggle
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
    templateUrl: './commitChangesDisplay.component.html',
    styleUrls: ['./commitChangesDisplay.component.scss']
})
export class CommitChangesDisplayComponent implements OnInit, OnChanges {
    @Input() commitId?: string;
    @Input() additions: JSONLDObject[];
    @Input() deletions: JSONLDObject[];
    @Input() entityNameFunc?: (entityIRI: string) => string;
    @Input() hasMoreResults: boolean;
    @Input() startIndex?: number;

    @Output() showMoreResultsEmitter = new EventEmitter<{limit: number, offset: number}>();

    types = [
        OWL + 'Class',
        OWL + 'ObjectProperty',
        OWL + 'DatatypeProperty',
        OWL + 'AnnotationProperty',
        OWL + 'NamedIndividual',
        SKOS + 'Concept',
        SKOS + 'ConceptScheme'
    ];

    difference = new Difference();
    limit = 100; // Must be the same as the limit prop in the commitHistoryTable - Should be 100
    offsetIndex = 0;
    changesItems: ChangesItem[] = [];

    constructor(private util: UtilService, private cm: CatalogManagerService, public os: OntologyStateService) {}

    ngOnInit(): void {
        if (this.startIndex) {
            this.offsetIndex = this.startIndex;
        }
    }
    ngOnChanges(changesObj: SimpleChanges): void {
        if (changesObj?.additions?.currentValue || changesObj?.deletions?.currentValue) {
            this.difference = new Difference(this.additions, this.deletions);
            let mergedInProgressCommitsMap: { [key: string]: Difference } = (this.difference.additions as JSONLDObject[]).reduce((dict, currentItem) => {
                const diff = new Difference();
                diff.additions = [currentItem];
                dict[currentItem['@id']] = diff;
                return dict;
            }, {});
            mergedInProgressCommitsMap = (this.difference.deletions as JSONLDObject[]).reduce((dict, currentItem) => {
                const diff: Difference = dict[currentItem['@id']] ? dict[currentItem['@id']] : new Difference();
                diff.deletions = [currentItem];
                dict[currentItem['@id']] = diff ;
                return dict;
            }, mergedInProgressCommitsMap);
            const changesItems: ChangesItem[] = Object.keys(mergedInProgressCommitsMap).map(id => ({
                id,
                difference: mergedInProgressCommitsMap[id],
                entityName: this.entityNameFunc ? this.entityNameFunc(id) : this.util.getBeautifulIRI(id),
                disableAll: this._hasSpecificType(mergedInProgressCommitsMap[id], id),
                showFull: false,
                resource: undefined,
                isBlankNode: this.util.isBlankNodeId(id)
            }));
            this.changesItems = sortBy(changesItems, 'entityName');
        }
    }
    loadMore(): void {
        this.offsetIndex += this.limit;
        this.showMoreResultsEmitter.emit({limit: this.limit, offset: this.offsetIndex}); // Will trigger ngOnChanges
    }
    getEntityName(entityIRI: string): string {
        return this.entityNameFunc ? this.entityNameFunc(entityIRI) : this.os.getEntityNameByListItem(entityIRI);
    }
    toggleFull(item: ChangesItem): void {
        if (this.commitId) {
            if (item.showFull) {
                this.cm.getCompiledResource(this.commitId, item.id)
                    .subscribe((resources: JSONLDObject[]) => {
                        item.resource = resources.find(obj => obj['@id'] === item.id);
                    }, () => {
                        this.util.createErrorToast('Error retrieving full entity information');
                    });
            } else {
                item.resource = undefined;
            }
        }
    }

    private _hasSpecificType(difference: Difference, entityId: string): boolean {
        const addObj = (difference.additions as JSONLDObject[]).find(obj => obj['@id'] === entityId);
        const addTypes = addObj ? addObj['@type'] || [] : [];
        const delObj = (difference.deletions as JSONLDObject[]).find(obj => obj['@id'] === entityId);
        const delTypes = delObj ? delObj['@type'] || [] : [];
        return !!intersection(addTypes.concat(delTypes), this.types).length;
    }
}
