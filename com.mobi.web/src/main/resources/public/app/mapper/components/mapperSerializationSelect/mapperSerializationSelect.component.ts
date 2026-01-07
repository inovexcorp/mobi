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
import { UntypedFormGroup } from '@angular/forms';

/**
 * @class mapper.MapperSerializationSelectComponent
 *
 * A component which creates a select with the following options for a RDF serialization format: JSON-LD, Turtle, and
 * RDF/XML that is bound to `format`.
 *
 * @param {FormGroup} parentForm THe parent FormGroup that is expected to have a FormControl for `serialization`
 * @param {string} label The label to display for the field
 * @param {boolean} required Whether the select should be required
 */
@Component({
    selector: 'mapper-serialization-select',
    templateUrl: './mapperSerializationSelect.component.html'
})
export class MapperSerializationSelectComponent {
    options = [
        {
            name: 'JSON-LD',
            value: 'jsonld'
        },
        {
            name: 'Turtle',
            value: 'turtle'
        },
        {
            name: 'RDF/XML',
            value: 'rdf/xml'
        }
    ];

    @Input() parentForm: UntypedFormGroup;
    @Input() label: string;
    
    constructor() {}
}
