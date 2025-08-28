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
import { Component, OnDestroy } from '@angular/core';
import { MatTabChangeEvent } from '@angular/material/tabs';

import { ShapesGraphStateService } from '../../../shared/services/shapesGraphState.service';
import { ShapesGraphListItem } from '../../../shared/models/shapesGraphListItem.class';

/**
 * @class ShapesTabsHolderComponent
 * @requires ShapesGraphStateService
 *
 * A component that holds and manages the tab layout for the shapes graph editor.
 * It reacts to tab changes and can be extended to trigger actions when specific tabs are selected.
 */
@Component({
  selector: 'app-shapes-tabs-holder',
  templateUrl: './shapes-tabs-holder.component.html',
  styleUrls: ['./shapes-tabs-holder.component.scss']
})
export class ShapesTabsHolderComponent implements OnDestroy {

  constructor(public state: ShapesGraphStateService) {}

  ngOnDestroy(): void {
    this.state.closeSnackbar();
  }

  onTabChanged(event: MatTabChangeEvent): void {
    switch (event.index) {
      case ShapesGraphListItem.PROJECT_TAB_IDX:
        this.state.setSelected(
          this.state.listItem.shapesGraphId,
          this.state.listItem
        ).subscribe();
        break;
      case ShapesGraphListItem.NODE_SHAPES_TAB_IDX:
        this.state.setSelected(
            this.state.listItem.selectedNodeShapeIri,
            this.state.listItem
        ).subscribe();
        break;
      default:
    }
  }
}
