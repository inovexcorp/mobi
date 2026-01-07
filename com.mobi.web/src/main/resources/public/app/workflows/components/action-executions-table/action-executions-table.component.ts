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
import { Component, Input, OnChanges } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { sortBy } from 'lodash';

import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { ActionExecution } from '../../models/action-execution.interface';
import { WORKFLOWS } from '../../../prefixes';
import { getEntityName, getPropertyId, getPropertyValue, orNone, runningTime, toFormattedDateString } from '../../../shared/utility';
import { WorkflowsStateService } from '../../services/workflows-state.service';

/**
 * @class workflows.ActionExecutionsTableComponent
 * 
 * A component that creates a table of Action Executions for a Workflow Execution Activity. Fetches Action details from
 * the provided Workflow RDF.
 * 
 * @param {JSONLDObject[]} actions The JSON-LD of the Action Executions to display
 * @param {JSONLDObject[]} workflowRdf The JSON-LD of the current compiled resource of the Workflow
 */
@Component({
  selector: 'app-action-executions-table',
  templateUrl: './action-executions-table.component.html',
  styleUrls: ['./action-executions-table.component.scss'],
})
export class ActionExecutionsTableComponent implements OnChanges {
  @Input() actions: JSONLDObject[] = [];
  @Input() workflowRdf: JSONLDObject[] = [];

  displayedColumns = ['action', 'status', 'startTime', 'runningTime'];
  dataSource = new MatTableDataSource<ActionExecution>();

  constructor(public wss: WorkflowsStateService) { }

  ngOnChanges(): void {
    this.dataSource.data = sortBy(this.actions.map(actionExec => {
      const succeeded = getPropertyValue(actionExec, `${WORKFLOWS}succeeded`);
      const startedAtStr = getPropertyValue(actionExec, `${WORKFLOWS}startedAt`);
      const startedAtTime = startedAtStr ? new Date(startedAtStr) : undefined;
      const endedAtStr = getPropertyValue(actionExec, `${WORKFLOWS}endedAt`);
      const endedAtTime = endedAtStr ? new Date(endedAtStr) : undefined;
      const action = this.workflowRdf.find(obj => obj['@id'] === getPropertyId(actionExec, `${WORKFLOWS}aboutAction`));
      return {
        iri: actionExec['@id'],
        displayName: action ? getEntityName(action) : '(Action Not Found)',
        statusDisplay: succeeded ? succeeded === 'true' ? 'success' : 'failure' : 'never_run',
        startTimeDisplay: orNone(toFormattedDateString(startedAtTime)),
        runningTimeDisplay: orNone(runningTime(startedAtTime, endedAtTime))
      };
    }), row => row.displayName);
  }
}
