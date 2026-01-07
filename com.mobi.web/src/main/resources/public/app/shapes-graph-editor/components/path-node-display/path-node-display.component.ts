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
import { Component, EventEmitter, Input, Output } from '@angular/core';

import { AddPathNodeEvent } from '../../models/add-path-node-event';
import { PathNode } from '../../models/property-shape.interface';

/**
 * @class PathNodeDisplayComponent
 * 
 * A component which recursively generates a display of the provided {@link PathNode} and all its sub-nodes. Simple IRI
 * nodes are shown as a single `mat-card` with an arrow indicating whether it is a normal predicate path or an inverse. 
 * ZeroOrMore, OneOrMore, and ZeroOrOne nodes are displayed with a bounding fieldset element with a label.
 * Alternative nodes display their sub nodes side by side with "OR" in between. Sequence nodes are just shown one after
 * another downwards. The topmost use of the component will generally only provide the `pathNode` binding and the
 * addNodeToParent output function. All other bindings are used by the recursive logic. Include buttons for adding new
 * nodes to the path.
 * 
 * @param {PathNode} pathNode The node in question that should be displayed
 * @param {PathNode} parentNode The PathNode that pointed to this one. Set by Sequence, Inverse, ZeroOrMore, OneOrMore,
 *    and ZeroOrOne parent nodes
 * @param {boolean} [inverse=false] Whether this node was pointed at inversely. Only taken into account on IRI nodes.
 *    Set by Inverse parent nodes.
 * @param {boolean} [showAdd=true] Whether the add button beneath an IRI node should be displayed. Set by Alternative
 *    parent nodes
 * @param {number} [seqIdx=0] The index of this node in its parent Sequence node. Set by Sequence parent nodes
 * @param {Function} addNodeToParent A function that will emit when the add button is clicked beneath or to the side of
 *    a node. Expects an argument in the shape of an object with keys for `parentNode`, `seqIdx`, and `sibling`
 */
@Component({
  selector: 'app-path-node-display',
  templateUrl: './path-node-display.component.html',
  styleUrls: ['./path-node-display.component.scss']
})
export class PathNodeDisplayComponent {
  @Input() pathNode: PathNode;
  @Input() parentNode: PathNode;
  @Input() inverseParent: PathNode;
  @Input() allowAltButton = true;
  @Input() allowSeqButton = true;
  @Input() seqIdx = 0;

  @Output() addNodeToParent = new EventEmitter<AddPathNodeEvent>();

  /**
   * Handles a click on a button that will either create/update a Sequence or an Alternative. Calls are passed up the
   * recursive chain
   * 
   * @param {PathNode} parentNode The parent node to add the new node to. For IRI node buttons, this is the `parentNode`
   *    binding. For all other node buttons, this is the pathNode binding.
   * @param {number} seqIdx The index of the current node in its parent sequence, if applicable. Only relevant when
   *    adding alternatives in the middle of a sequence
   * @param {PathNode} sibling The node immediately preceding the one to be added. Only populated by IRI node buttons
   *    and will be the IRI node itself. Used to turn the IRI node into a Sequence node
   * @param {boolean} [isSeq=true] Whether a Sequence should be added/updated
   */
  clickAdd(parentNode: PathNode, seqIdx: number, sibling: PathNode, isSeq = true): void {
    this.addNodeToParent.emit({parentNode, seqIdx, sibling, isSeq});
  }
}
