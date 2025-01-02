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
import { Component } from '@angular/core';

import { CatalogStateService } from '../../../shared/services/catalogState.service';

/**
 * @class catalog.CatalogPageComponent
 * 
 * A component which creates the main page of the Catalog module. The component contains different content depending on
 * whether a catalog Record has been selected.
 */
@Component({
    selector: 'catalog-page',
    templateUrl: './catalogPage.component.html',
    styleUrls: ['./catalogPage.component.scss']
})
export class CatalogPageComponent {
    constructor(public state: CatalogStateService) {}
}
