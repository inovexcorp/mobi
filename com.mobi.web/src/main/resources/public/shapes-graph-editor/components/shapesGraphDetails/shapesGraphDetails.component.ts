/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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
import { join, orderBy, map, get } from 'lodash';

import './shapesGraphDetails.component.scss';
import { Component, Inject } from '@angular/core';
import { ShapesGraphStateService } from '../../../shared/services/shapesGraphState.service';
import { PrefixationPipe } from '../../../shared/pipes/prefixation.pipe';

/**
 * @ngdoc component
 * @name shapes-graph-editor.component:selectedDetails
 * @requires shared.service:ontologyManagerService
 * @requires shared.service:shapesGraphStateService
 * @requires shared.pipes:prefixationPipe
 *
 * @description
 * `shapesGraphDetails` is a component that creates div with details about the entity representing 
 * the current shapesGraph. This includes the entity's name, a
 * {@link shapes-graph-editor.component:staticIriLimited}, and a display of the types of the entity. The display is
 * `readOnly`.
 * 
 */
@Component({
    selector: 'shapes-graph-details',
    templateUrl: './shapesGraphDetails.component.html'
})
export class ShapesGraphDetailsComponent {

    constructor(public state: ShapesGraphStateService, @Inject('ontologyManagerService') public om, private prefixation: PrefixationPipe) {}

    getTypes(): string {
        return join(orderBy(
                map(get(this.state.listItem.metadata, '@type', []), t => { 
                    return this.prefixation.transform(t);
                })
        ), ', ');
    }
}