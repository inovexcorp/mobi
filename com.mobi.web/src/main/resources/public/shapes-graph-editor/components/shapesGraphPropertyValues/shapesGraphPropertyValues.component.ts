/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2023 iNovex Information Systems, Inc.
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
import { UtilService } from '../../../shared/services/util.service';

import './shapesGraphPropertyValues.component.scss';

/**
 * @class shapes-graph-editor.ShapesGraphPropertyValuesComponent
 *
 * A component that creates a display of the values of the provided `property` on the provided
 * JSON-LD `entity`. Display includes the property as a header and the individual values displayed using a
 * {@link shared.component:valueDisplay}.
 *
 * @param {string} property The ID of a property on the `entity`
 * @param {Object} entity A JSON-LD object
 */
@Component({
    selector: 'shapes-graph-property-values',
    templateUrl: './shapesGraphPropertyValues.component.html'
})
export class ShapesGraphPropertyValuesComponent {
    @Input() property;
    @Input() entity;
    
    constructor(public util: UtilService) {}
}
