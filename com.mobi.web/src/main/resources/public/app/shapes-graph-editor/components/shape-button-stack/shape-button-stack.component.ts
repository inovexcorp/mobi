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
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { CreateNodeShapeModalComponent } from '../create-node-shape-modal/create-node-shape-modal.component';

/**
 * @class ShapeButtonStackComponent
 *
 * A component that displays a stack of buttons for creating new shape entities.
 * When activated, it opens the {@link CreateNodeShapeModalComponent}.
 */
@Component({
  selector: 'app-shape-button-stack',
  templateUrl: './shape-button-stack.component.html',
  styleUrls: ['./shape-button-stack.component.scss']
})
export class ShapeButtonStackComponent implements OnChanges {
  @Input() canModify;

  readonly tooltipDefault = 'Create Node Shape';
  readonly tooltipNoPermission = 'You do not have permission to create a node shape';

  tooltipText = '';

  constructor(private _dialog: MatDialog) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.canModify) {
      const canModifyNow = changes.canModify.currentValue;
      if (canModifyNow) {
        this.tooltipText = this.tooltipDefault;
      } else {
        this.tooltipText = this.tooltipNoPermission;
      }
    }
  }

  /**
   * Opens the modal dialog for creating a new node shape.
   */
  showCreateNodeShapeOverlay(): void {
    if (this.canModify) {
      this._dialog.open(CreateNodeShapeModalComponent);
    }
  }
}
