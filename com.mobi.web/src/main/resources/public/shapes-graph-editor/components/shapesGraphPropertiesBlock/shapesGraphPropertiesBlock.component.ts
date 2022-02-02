/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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
import { union } from 'lodash';
import { Component, OnChanges, Input, Inject } from '@angular/core';
import { ShapesGraphStateService } from '../../../shared/services/shapesGraphState.service';
import { ShapesGraphManagerService } from '../../../shared/services/shapesGraphManager.service';

/**
 * @ngdoc component
 * @name shapes-graph-editor.component:shapesGraphPropertiesBlock
 * @requires shared.service:shapesGraphStateService
 * @requires shared.service:shapesGraphManagerService
 * @requires shared.service:propertyManagerService
 *
 * @description
 * `shapesGraphPropertiesBlock` is a component that creates a section that displays the shapesGraph properties (and
 * annotations) on the provided shapesGraph using {@link shapes-graph-editor.component:shapesGraphPropertyValues}.
 * 
 * @param {Object} shapesGraph A JSON-LD object representing a shapesGraph 
 */
@Component({
    selector: 'shapes-graph-properties-block',
    templateUrl: './shapesGraphPropertiesBlock.component.html'
})
export class ShapesGraphPropertiesBlockComponent implements OnChanges {
    @Input() shapesGraph;
    properties: Array<string> = [];

    constructor(public state: ShapesGraphStateService, public sm: ShapesGraphManagerService, @Inject('propertyManagerService') private pm) {}
    
    ngOnChanges(): void {
        this.properties = Object.keys(this.shapesGraph).filter(property => property.charAt(0) !== '@');
    }
}