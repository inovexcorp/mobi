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
import { Component, EventEmitter, Input, Output } from '@angular/core';

import { NodeShapeSummary } from '../../models/node-shape-summary.interface';

/**
 * @class shapes-graph-editor.NodeShapesItemComponent
 *
 * This component displays a summary card for a SHACL Node Shape.
 * 
 * Summary Card displays
 * - name
 * - IRI 
 * - target type
 * - target value
 * - import status
 * 
 * @param {NodeShapeSummary} nodeShapeSummary - The node shape data to display in the card.
 * @param {boolean} selected - Whether this item is currently selected in the list.
 * @param {EventEmitter<NodeShapeSummary>} onItemSelect - Emits the selected node shape when the card is clicked.
 */
@Component({
  selector: 'app-node-shapes-item',
  templateUrl: './node-shapes-item.component.html',
  styleUrls: ['./node-shapes-item.component.scss']
})
export class NodeShapesItemComponent {
  @Input() nodeShapeSummary: NodeShapeSummary;
  @Input() selected: boolean;

  @Output() onItemSelect = new EventEmitter<NodeShapeSummary>();

  constructor() {}

  /**
   * Emits the selected NodeShapeInfo item to parent component.
   * Triggered when a user selects an item from the UI.
   */
  setSelected(): void {
    this.onItemSelect.emit(this.nodeShapeSummary);
  }
}