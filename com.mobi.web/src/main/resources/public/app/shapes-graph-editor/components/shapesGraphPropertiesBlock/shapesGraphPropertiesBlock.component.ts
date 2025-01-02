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
import { Component, OnChanges, Input } from '@angular/core';

import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';

/**
 * @class shapes-graph-editor.ShapesGraphPropertiesBlockComponent
 *
 * A component that creates a section that displays the shapesGraph properties (and
 * annotations) on the provided shapesGraph using {@link shapes-graph-editor.ShapesGraphPropertyValuesComponent}.
 * 
 * @param {JSONLDObject} shapesGraph A JSON-LD object representing a shapesGraph 
 */
@Component({
    selector: 'shapes-graph-properties-block',
    templateUrl: './shapesGraphPropertiesBlock.component.html'
})
export class ShapesGraphPropertiesBlockComponent implements OnChanges {
    @Input() shapesGraph: JSONLDObject;
    properties: Array<string> = [];

    constructor() {}
    
    ngOnChanges(): void {
        this.properties = Object.keys(this.shapesGraph).filter(property => property.charAt(0) !== '@');
    }
}
