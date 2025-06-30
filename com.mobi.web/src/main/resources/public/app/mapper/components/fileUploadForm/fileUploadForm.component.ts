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
import { Component, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormBuilder } from '@angular/forms';
import { includes, get } from 'lodash';
import { Subscription } from 'rxjs';

import { DelimitedManagerService } from '../../../shared/services/delimitedManager.service';
import { MapperStateService } from '../../../shared/services/mapperState.service';

/**
 * @class mapper.FileUploadFormComponent
 *
 * A component that creates a form for uploaded delimited data into Mobi using the {@link shared.DelimitedManagerService}.
 * If the chosen file is a SV file, the user must select a separator for the columns and selecting a new value will
 * automatically upload the file again. Tests whether the selected file is compatible with the current
 * {@link shared.MapperStateService#selected mapping} and outputs a list of any invalid data property mappings.
 */
@Component({
  selector: 'file-upload-form',
  templateUrl: './fileUploadForm.component.html'
})
export class FileUploadFormComponent implements OnInit, OnDestroy {
  errorMessage = '';
  uploadFileForm = this.fb.group({
    containsHeaders: [true],
    separator: [',']
  });
  isExcel = false;
  readonly acceptFileTypes = ['.csv','.xlsx','.tsv'];

  constructor(public dm: DelimitedManagerService, public state: MapperStateService, private fb: UntypedFormBuilder) {}
  
  containsHeadersSubscription: Subscription;
  separatorSubscription: Subscription;

  ngOnInit(): void {
    this.containsHeadersSubscription = this.uploadFileForm.controls.containsHeaders.valueChanges
      .subscribe((newValue: boolean) => {
        this.dm.containsHeaders = newValue;
      });
    this.separatorSubscription = this.uploadFileForm.controls.separator.valueChanges
      .subscribe((newValue: string) => {
        this.changeSeparator(newValue);
      });
  }
  ngOnDestroy(): void {
    if (this.containsHeadersSubscription && !this.containsHeadersSubscription.closed) {
      this.containsHeadersSubscription.unsubscribe();
    }
    if (this.separatorSubscription && !this.separatorSubscription.closed) {
      this.separatorSubscription.unsubscribe();
    }
  }
  upload(value: File): void {
    this.dm.fileObj = value;
    this.isExcel = includes(get(this.dm.fileObj, 'name', ''), 'x');
    if (this.dm.fileObj) {
      this.dm.upload(this.dm.fileObj).subscribe(data => {
        this.dm.fileName = data;
        this.errorMessage = '';
        this.dm.previewFile(50).subscribe(() => this.state.setInvalidProps(), error => this._onError(error));
      }, error => this._onError(error));
    }
  }
  changeSeparator(value: string): void {
    this.dm.separator = value;
    this.dm.previewFile(50).subscribe(() => {
      this.errorMessage = '';
      this.state.setInvalidProps();
    }, error => this._onError(error));
  }

  private _onError(errorMessage) {
    this.errorMessage = errorMessage;
    this.dm.dataRows = undefined;
    this.state.invalidProps = [];
  }
}
