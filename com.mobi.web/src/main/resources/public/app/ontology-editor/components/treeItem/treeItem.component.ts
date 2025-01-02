/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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
import { get, unionWith, map, includes, isEqual } from 'lodash';

import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { OnChanges, Component, Input, Output, EventEmitter } from '@angular/core';

/**
 * @class ontology-editor.TreeItemComponent
 * 
 * `treeItem` is a component that creates the content for an individual entry in a tree hierarchy.
 * 
 * @param {boolean} hasChildren Whether the item has child elements
 * @param {boolean} isActive Whether the item is active
 * @param {Function} onClick A function to be called when the item is clicked
 * @param {Object} entityInfo The object containing the information to display the label
 * @param {boolean} isOpened Whether the item is opened
 * @param {string} path The path to where this item is located in the hierarchy
 * @param {boolean} underline Whether the label should be underlined
 * @param {Function} toggleOpen A function to be called when the icon is clicked or the item is double clicked
 * @param {Object} inProgressCommit The object containing the saved entities
 * @param {string} currentIri The IRI of the item to determine if it is saved
 */
@Component({
    selector: 'tree-item',
    templateUrl: './treeItem.component.html',
    styleUrls: ['./treeItem.component.scss']
})
export class TreeItemComponent implements OnChanges {
    @Input() hasChildren: boolean;
    @Input() isActive: boolean;
    @Input() entityInfo;
    @Input() isOpened: boolean;
    @Input() path;
    @Input() underline;
    @Input() inProgressCommit;
    @Input() currentIri: string;
    @Output() onClick = new EventEmitter<null>();
    @Output() toggleOpen = new EventEmitter<null>();

    saved: boolean;

    constructor(public os: OntologyStateService) {}

    ngOnChanges(): void {
        this.saved = this.isSaved();
    }

    clickAction(): void {
        this.onClick.emit();
    }

    toggleAction(): void {
        this.toggleOpen.emit();
    }

    isSaved(): boolean {
        const ids = unionWith(map(get(this.inProgressCommit, 'additions', []), '@id'), map(get(this.inProgressCommit, 'deletions', []), '@id'), isEqual);
        return includes(ids, this.currentIri);
    }
}
