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
import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { LogLevelOption } from '../log-level-manager/log-level-manager.component';
import { LogLevelResponse, LogsManagerService } from '../../../shared/services/logs-manager.service';
import { RESTError } from '../../../shared/models/RESTError.interface';
import { ToastService } from '../../../shared/services/toast.service';

/**
 * @class AddLoggerModalComponent
 * 
 * A component that creates content for a modal that allows users to add a new logger. Meant to be used in conjunction
 * with the `MatDialog` service.
 * 
 * @param {{level: string, icon: string}[]} data.availableLevels An array of available log levels to choose from when
 * adding a new logger.
 */
@Component({
  selector: 'app-add-logger-modal',
  templateUrl: './add-logger-modal.component.html'
})
export class AddLoggerModalComponent {
  error: RESTError = undefined;

  addForm: FormGroup = this._fb.group({
    name: ['', [Validators.required, Validators.pattern('^[a-z][a-z0-9_]*(.[a-z][a-z0-9_]*)*$')]],
    level: [undefined, Validators.required]
  });

  constructor(@Inject(MAT_DIALOG_DATA) public data: { availableLevels: LogLevelOption[]}, 
    private _dialogRef: MatDialogRef<AddLoggerModalComponent>, 
    public lm: LogsManagerService,
    private _toast: ToastService,
    private _fb: FormBuilder) {}

  /**
   * Calls the {@link LogsManagerService} to add a new logger with the specified name and level from the form. If
   * successful, closes the modal and shows a success toast. If there's an error, it sets the error property to display
   * the error message.
   */
  addLogger(): void {
    this.error = undefined;
    this.lm.createLogger(this.addForm.controls.name.value.trim(), this.addForm.controls.level.value.level).subscribe({
      next: (response: LogLevelResponse) => {
        this._toast.createSuccessToast(`Successfully added logger ${response.loggerName} with level ${response.level}`);
        this._dialogRef.close(true);
      },
      error: (err: RESTError) => {
        this.error = err;
      }
    });
  }
}
