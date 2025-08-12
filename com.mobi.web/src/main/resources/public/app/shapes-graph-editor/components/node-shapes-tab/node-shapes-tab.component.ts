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
import { Component, Input } from '@angular/core';

import { ShapesGraphListItem } from '../../../shared/models/shapesGraphListItem.class';

/**
 * @class NodeShapesTabComponent
 *
 * A component which creates main page for searching nodeShapes and display each invidual node shape
 *
 * @param {ShapesGraphListItem} listItem - The selected item containing node shape data to display.
 * @param {boolean} canModify Indicates whether the user has permission to modify the listItem.
 */
@Component({
  selector: 'app-node-shapes-tab',
  templateUrl: './node-shapes-tab.component.html'
})
export class NodeShapesTabComponent {
  @Input() listItem: ShapesGraphListItem;
  @Input() canModify: boolean;
}
