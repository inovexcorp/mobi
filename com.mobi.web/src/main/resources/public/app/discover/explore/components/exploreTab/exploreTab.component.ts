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

import { Component } from '@angular/core';
import { DiscoverStateService } from '../../../../shared/services/discoverState.service';

/**
 * @class explore.ExploreTabComponent
 *
 * `exploreTab` is a component that creates a {@link explore.ClassBlockComponent} to explore data within a dataset.
 * It also provides an {@link explore.InstanceBlockComponent}, an {@link explore.InstanceViewComponent},
 * an {@link explore.InstanceEditorComponent}, and an {@link explore.InstanceCreatorComponent} for viewing and
 * managing instance data.
 *
 */
@Component({
    selector: 'explore-tab',
    templateUrl: './exploreTab.component.html'
})

export class ExploreTabComponent {
    constructor(public state: DiscoverStateService) {}
}
