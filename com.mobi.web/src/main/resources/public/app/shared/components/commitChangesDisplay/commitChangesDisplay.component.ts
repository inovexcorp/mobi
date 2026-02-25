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

import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';

import { intersection, sortBy } from 'lodash';

import { CatalogManagerService } from '../../services/catalogManager.service';
import { ChangesItem } from '../../models/changes-item';
import { Difference } from '../../models/difference.class';
import { getBeautifulIRI, isBlankNodeId } from '../../utility';
import { JSONLDObject } from '../../models/JSONLDObject.interface';
import { OntologyStateService } from '../../services/ontologyState.service';
import { OWL, SKOS } from '../../../prefixes';
import { ToastService } from '../../services/toast.service';

/**
 * @class CommitChangesDisplayComponent
 *
 * A *dumb* component that creates a sequence of mat-accordion displaying the changes made to entities separated by
 * additions and deletions. Each changes display uses the `mat-expansion-panel`. The display of an entity's name can be
 * optionally controlled by the provided `entityNameFunc` function and defaults to the beautified local name of the IRI.
 * The display of the changes can optionally include a toggle to include all triples for an entity in the expansion
 * panel body. This toggle is controlled by the presence of the `commitId` input. If not present, the toggle will not be
 * shown.
 *
 * @param {string} [commitId=''] An optional Commit IRI to use in the Show Full toggle
 * @param {JSONLDObject[]} additions An array of JSON-LD objects representing statements added
 * @param {JSONLDObject[]} deletions An array of JSON-LD objects representing statements deleted
 * @param {Function} [entityNameFunc=undefined] An optional function to retrieve the name of an entity by its IRI. The
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
  @Input() goToEnabled: boolean;

  @Output() showMoreResultsEmitter = new EventEmitter<{ limit: number, offset: number }>();

  private readonly errorMessageNoData = 'Error retrieving full entity information';
  types = [
    `${OWL}Class`,
    `${OWL}ObjectProperty`,
    `${OWL}DatatypeProperty`,
    `${OWL}AnnotationProperty`,
    `${OWL}NamedIndividual`,
    `${SKOS}Concept`,
    `${SKOS}ConceptScheme`
  ];

  difference = new Difference();
  limit = 100; // Must be the same as the limit prop in the commitHistoryTable - Should be 100
  offsetIndex = 0;
  changesItems: ChangesItem[] = [];

  constructor(private toast: ToastService, private cm: CatalogManagerService, public os: OntologyStateService) {}

  /**
   * Lifecycle hook that is called after Angular has initialized the component.
   * Typically used to perform initialization logic for the component.
   *
   * Updates the `offsetIndex` property to the value of `startIndex` if it is defined.
   *
   * @return {void}.
   */
  ngOnInit(): void {
    if (this.startIndex) {
      this.offsetIndex = this.startIndex;
    }
  }

  /**
   * Handles changes in input properties and processes additions and deletions to update the component state.
   * This method is invoked whenever the value of any bound input property changes.
   *
   * @param {SimpleChanges} changesObj - An object representing the changes to the input properties. Each key corresponds to an input property, and the value describes the previous and current state of the property.
   * @return {void}
   */
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
        dict[currentItem['@id']] = diff;
        return dict;
      }, mergedInProgressCommitsMap);
      const changesItems: ChangesItem[] = Object.keys(mergedInProgressCommitsMap).map(id => ({
        id,
        difference: mergedInProgressCommitsMap[id],
        entityName: this.entityNameFunc ? this.entityNameFunc(id) : getBeautifulIRI(id),
        disableAll: this._hasSpecificType(mergedInProgressCommitsMap[id], id),
        showFull: false,
        resource: undefined,
        isBlankNode: isBlankNodeId(id),
        deleted: this._hasBeenDeleted(id, mergedInProgressCommitsMap[id])
      }));
      this.changesItems = sortBy(changesItems, 'entityName');
    }
  }

  /**
   * Handles the logic for loading additional data or content when more results are requested.
   * This method updates the offset index and emits an event with the current limit and updated offset values.
   * The emitted event can be used to fetch and display more results.
   * @return {void}
   */
  loadMore(): void {
    this.offsetIndex += this.limit;
    this.showMoreResultsEmitter.emit({ limit: this.limit, offset: this.offsetIndex }); // Will trigger ngOnChanges
  }

  /**
   * Toggles the full resource loading for the given item. If the item's `showFull` property is true,
   * it fetches the compiled resource corresponding to the item's id and assigns it to the item's `resource`.
   * If `showFull` is false, it sets the item's `resource` to undefined.
   *
   * @param {ChangesItem} item - The item whose full resource loading state is being toggled. The item's `showFull` property
   * determines whether to load or unload the resource.
   * @return {void}
   */
  toggleFull(item: ChangesItem): void {
    if (this.commitId) {
      if (item.showFull) {
        this.cm.getCompiledResource(this.commitId, item.id)
          .subscribe((resources: JSONLDObject[]) => {
            item.resource = resources.find(obj => obj['@id'] === item.id);
          }, () => {
            this.toast.createErrorToast(this.errorMessageNoData);
          });
      } else {
        item.resource = undefined;
      }
    }
  }

  goToEntity(event:MouseEvent, entityId: string): void {
    if (this.goToEnabled && !isBlankNodeId(entityId)) {
      event.stopPropagation();
      this.os.listItem.changesPageOpen = false;
      this.os.goTo(entityId);
    }
  }

  private _hasSpecificType(difference: Difference, entityId: string): boolean {
    const addObj = (difference.additions as JSONLDObject[]).find(obj => obj['@id'] === entityId);
    const addTypes = addObj ? addObj['@type'] || [] : [];
    const delObj = (difference.deletions as JSONLDObject[]).find(obj => obj['@id'] === entityId);
    const delTypes = delObj ? delObj['@type'] || [] : [];
    return !!intersection(addTypes.concat(delTypes), this.types).length;
  }

  private _hasBeenDeleted(entityId: string, difference: Difference): boolean {
    if (difference.deletions.length > 0 && !(difference.additions.length > 0)) {
      const deletions = difference.deletions[0];
      if (deletions['@id'] === entityId && deletions['@type'] !== undefined) {
        return true;
      }
    }
    return false;
  }
}
