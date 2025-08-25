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
import { MatDialog } from '@angular/material/dialog';

import { AddPathNodeEvent } from '../../models/add-path-node-event';
import { AddPathNodeModalComponent } from '../add-path-node-modal/add-path-node-modal.component';
import { PathNode } from '../../models/property-shape.interface';

/**
 * @class PropertyShapePathComponent
 * @requires MatDialog
 * 
 * A component that creates the full editable display of a Property Shape's path using the starting {@link PathNode}.
 * Expects the `path` binding to be used as a "banana-in-a-boat" with an emitter specifically for updating the path.
 * Displays a placeholder "Target" `mat-card` to represent the parent Node Shape's selected target with the path
 * beneath and a final add button to add another node to the top level sequence.
 * 
 * @param {PathNode} path The starting node in the parent Property Shape's path 
 * @param {Function} pathChange A function that emits the updates topmost node when additions are made
 */
@Component({
  selector: 'app-property-shape-path',
  templateUrl: './property-shape-path.component.html',
  styleUrls: ['./property-shape-path.component.scss']
})
export class PropertyShapePathComponent {
  @Input() path: PathNode;
  @Output() pathChange = new EventEmitter<PathNode>();

  constructor(private _dialog: MatDialog) {}

  /**
   * Handles the topmost add button on the target that only gets called if there's no path set at all. Uses
   * a {@link AddPathNodeModalComponent} with no parent node provided. Emits the path update if the
   * modal closes properly.
   */
  addFirstNode(): void {
    this._dialog.open(AddPathNodeModalComponent, {
      data: { parentNode: undefined }
    }).afterClosed().subscribe((result: PathNode) => {
      if (result) {
        this.path = result;
        this.pathChange.emit(this.path);
      }
    });
  }

  /**
   * Handles emissions from add buttons in the recursively generated {@link PathNodeDisplayComponent}
   * instances using a {@link AddPathNodeModalComponent}. These buttons are intended to either
   * create or add to a Sequence or Alternative. If `parentNode` is not set or is a cardinality type, will create a new
   * Sequence or Alternative with the `sibling` as the first in the list. If the `parentNode` is a Sequence, will either
   * add a node to the end of the Sequence or swap one of the nodes in the sequence for an Alternative. If the
   * `parentNode` is an Alternative, expects the new node to be added to the end of the Alternative. Emits the path
   * update if the modal closes properly.
   * 
   * @param event The emitted event from the sub display components containing information about the parent node,
   *    sequence index, any existing sibling nodes, and whether a sequence should be generated/updated
   */
  addSubProperty(event: AddPathNodeEvent): void {
    // parentNode should never be IRI or Inverse
    const parentNode = event.parentNode;
    let parentNodeForModal: PathNode;
    
    if (!parentNode || parentNode.type === 'OneOrMore' || parentNode.type === 'ZeroOrMore' || parentNode.type === 'ZeroOrOne') {
      parentNodeForModal = { type: event.isSeq ? 'Sequence' : 'Alternative', items: [event.sibling] };
    } else if (parentNode.type === 'Sequence') {
      if (event.isSeq) {
        parentNodeForModal = parentNode;
      } else {
        parentNodeForModal = { type: 'Alternative', items: [event.sibling] };
      }
    } else if (parentNode.type === 'Alternative') {
      parentNodeForModal = parentNode;
    } else { // parentNode should never be an IRI or Inverse
      console.error('parentNode should not be type IRI or Inverse');
      return;
    }
    this._dialog.open(AddPathNodeModalComponent, {
      data: { parentNode: parentNodeForModal }
    }).afterClosed().subscribe((result: PathNode) => {
      if (result) {
        if (!parentNode) { 
          // No parentNode means there is only a single node in the current path so we need to override it with the
          // generated Alternative or Sequence path
          this.path = result;
        } else if (parentNode.type === 'Sequence' && !event.isSeq) {
          // If the parentNode is a Sequence and we aren't just adding the new node to the end, we are replacing a node
          // in the sequence with an Alternative
          parentNode.items[event.seqIdx] = result;
        } else if (parentNode.type === 'OneOrMore' || parentNode.type === 'ZeroOrMore' || parentNode.type === 'ZeroOrOne') {
          // If parentNode is cardinality type, we are replacing the sub node with a Sequence or Alternative
          parentNode.path = result;
        }
        this.pathChange.emit(this.path);
      }
    });
  }
}
