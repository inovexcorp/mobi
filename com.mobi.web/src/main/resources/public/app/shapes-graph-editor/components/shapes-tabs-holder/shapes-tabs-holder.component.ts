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
import { Component, ViewChild } from '@angular/core';
import { MatTabChangeEvent, MatTabGroup } from '@angular/material/tabs';
import { ShapesGraphStateService } from '../../../shared/services/shapesGraphState.service';

@Component({
  selector: 'app-shapes-tabs-holder',
  templateUrl: './shapes-tabs-holder.component.html',
  styleUrls: ['./shapes-tabs-holder.component.scss']
})
export class ShapesTabsHolderComponent {
  @ViewChild('tabsGroup') tabsGroup: MatTabGroup;

  constructor(public state: ShapesGraphStateService) {}

  onTabChanged(event: MatTabChangeEvent): void {
    //TODO Pending logic for when more tabs get implemented and we can select entities.
  }
}
