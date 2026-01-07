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
import { Component } from '@angular/core';

import { WorkflowsStateService } from '../../services/workflows-state.service';

/**
 * @class workflows.WorkflowsComponent
 *
 * This component displays a list of workflows records.
 */
@Component({
  selector: 'app-workflows',
  templateUrl: './workflows.component.html',
  styleUrls: []
})
export class WorkflowsComponent {
  /**
   * This constructor is used to initialize the component.
   */
  constructor(public wss: WorkflowsStateService) { }
}
