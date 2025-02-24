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
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

import { RESTError } from '../../../shared/models/RESTError.interface';

/**
 * @class workflows.WorkflowCommitErrorModalComponent
 * 
 * A component that creates content for a modal that displays a {@link workflows.ShaclValidationReportComponent} from
 * the provided {@link RESTError} object. This validation report represents the errors encountered when trying to save
 * changes to a Workflow.
 * 
 * @param {RESTError} errorObject The REST error object containing the SHACL Validation report to display.
 */
@Component({
  selector: 'app-workflow-commit-error-modal',
  templateUrl: './workflow-commit-error-modal.component.html'
})
export class WorkflowCommitErrorModalComponent{

  constructor(@Inject(MAT_DIALOG_DATA) public data: { errorObject: RESTError }) { }

}
