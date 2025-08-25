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
import { PathNode } from './property-shape.interface';

/**
 * Represents data needed when adding a new path node to a Property Shape's path.
 */
export interface AddPathNodeEvent {
  parentNode: PathNode, // The parent node to add the new node to.
  seqIdx: number, // The index of the current node in its parent sequence, if applicable.
  sibling: PathNode, // The node immediately preceding the one to be added.
  isSeq: boolean // Whether a Sequence should be added/updated
}
