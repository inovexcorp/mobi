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
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { EntitySearchPageComponent } from './components/entity-search-page/entity-search-page.component';
import { SearchResultsListComponent } from './components/search-results-list/search-results-list.component';
import { SearchResultItemComponent } from './components/search-result-item/search-result-item.component';
import { SharedModule } from '../shared/shared.module';
import { CatalogModule } from '../catalog/catalog.module';
import { EntitySearchFiltersComponent } from './components/entity-search-filters/entity-search-filters.component';

@NgModule({
  declarations: [
    EntitySearchPageComponent,
    SearchResultsListComponent,
    SearchResultItemComponent,
    EntitySearchFiltersComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    CatalogModule,
  ],
  providers: []
})
export class EntitySearchModule {
}
