/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2024 iNovex Information Systems, Inc.
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
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MatSortModule } from '@angular/material/sort';

// Shared 
import { SharedModule } from '../shared/shared.module';

// Workflows
import { ActionExecutionsTableComponent } from './components/action-executions-table/action-executions-table.component';
import { ExecutionHistoryTableComponent } from './components/execution-history-table/execution-history-table.component';
import { LogsPreviewComponent } from './components/logs-preview/logs-preview.component';
import { WorkflowControlsComponent } from './components/workflow-controls/workflow-controls.component';
import { WorkflowsComponent } from './components/workflows/workflows.component';
import { WorkflowDisplayComponent } from './components/workflow-display/workflow-display.component';
import { WorkflowDownloadModalComponent } from './components/workflow-download-modal/workflow-download-modal.component';
import { WorkflowPropertyOverlayComponent} from './components/workflow-property-overlay-component/workflow-property-overlay.component';
import { WorkflowRecordComponent } from './components/workflow-record/workflow-record.component';
import { WorkflowRecordsComponent } from './components/workflow-records/workflow-records.component';
import { WorkflowTableFilterComponent } from './components/workflow-table-filter/workflow-table-filter.component';
import { WorkflowsManagerService } from './services/workflows-manager.service';
import { WorkflowsStateService } from './services/workflows-state.service';

const routes: Routes = [{
  path: '', component: WorkflowsComponent,
  children: []
}];

/**
 * @namespace workflows
 *
 * The `workflows` module provides components that make up the Workflows page of Mobi for managing Workflow Records.
 */
@NgModule({
  declarations: [
    ActionExecutionsTableComponent,
    ExecutionHistoryTableComponent,
    LogsPreviewComponent,
    WorkflowControlsComponent,
    WorkflowsComponent,
    WorkflowDisplayComponent,
    WorkflowDownloadModalComponent,
    WorkflowPropertyOverlayComponent,
    WorkflowRecordComponent,
    WorkflowRecordsComponent,
    WorkflowTableFilterComponent,
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    SharedModule,
    MatSortModule
  ],
  providers: [
    WorkflowsManagerService,
    WorkflowsStateService
  ]
})
export class WorkflowsModule {}