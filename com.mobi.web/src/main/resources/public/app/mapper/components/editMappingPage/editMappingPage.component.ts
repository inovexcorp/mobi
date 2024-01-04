/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2024 iNovex Information Systems, Inc.
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

import { MapperStateService } from '../../../shared/services/mapperState.service';

/**
 * @class mapper.EditMappingPageComponent
 *
 * A component that creates a Material tabset for editing the current {@link shared.MapperStateService#selected mapping}.
 * The first tab contains a {@link mapper.EditMappingFormComponent}, the second a {@link mapper.RdfPreviewFormComponent},
 * and the third a display of the commits of the mapping.
 */
@Component({
    selector: 'edit-mapping-page',
    templateUrl: './editMappingPage.component.html',
    styleUrls: ['./editMappingPage.component.scss']
})
export class EditMappingPageComponent {
    constructor(public state: MapperStateService) {}
}
