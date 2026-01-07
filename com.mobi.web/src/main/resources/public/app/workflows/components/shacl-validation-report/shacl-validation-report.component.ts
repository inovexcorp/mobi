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
import { Component, Input } from '@angular/core';

import { RESTError } from '../../../shared/models/RESTError.interface';

/**
 * @class workflows.ShaclValidationReportComponent
 * 
 * Displays the SHACL validation report attached to a {@link shared.RESTError} object. Assumes the report is in Turtle
 * format as an array of lines in the `errorDetails` property.
 * 
 * @param {RESTError} errorObject The error object returned form aREST call containing a SHACL Validation report
 */
@Component({
  selector: 'app-shacl-validation-report',
  templateUrl: './shacl-validation-report.component.html',
  styleUrls: ['./shacl-validation-report.component.scss']
})
export class ShaclValidationReportComponent {

  report = '';
  private _errorObject: RESTError;

  options = {
    mode: 'text/turtle',
    lineWrapping: true,
    readOnly: true
}

  @Input() set errorObject(value: RESTError) {
    this._errorObject = value;
    this.report = value.errorDetails.join('\n');
  }

  get errorObject(): RESTError {
    return this._errorObject;
  }

  constructor() { }

}
