/*-
* #%L
 * com.mobi.web
 *  $Id:$
 *  $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
 * %%
 * This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *  
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *  
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * #L%
*/
import { Component, Input } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';

/**
 * @class shared.SerializationSelectComponent
 *
 * A component that creates a `mat-form-field` with a `select` containing serialization formats for ontologies. Attaches
 * to a `serialization` control on the provided `parentForm`.
 *
 * @param {FormGroup} parentForm The FormGroup to attach the select to. Expects a control for `serialization`
 */
@Component({
    selector: 'serialization-select',
    templateUrl: './serializationSelect.component.html'
})
export class SerializationSelectComponent {
    @Input() parentForm: UntypedFormGroup;

    constructor() {}
}
