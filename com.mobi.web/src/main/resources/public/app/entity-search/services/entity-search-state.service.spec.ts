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
import { TestBed } from '@angular/core/testing';

import { MockProvider } from 'ng-mocks';
import { of } from 'rxjs';

import { CatalogManagerService } from '../../shared/services/catalogManager.service';
import { EntityRecord } from '../models/entity-record';
import { PaginatedConfig } from '../../shared/models/paginatedConfig.interface';
import { PaginatedResponse } from '../../shared/models/paginated-response.interface';
import { SearchResultsMock } from '../mock-data/search-results.mock';
import { EntitySearchStateService } from './entity-search-state.service';

describe('EntitySearchStateService', () => {
  let service: EntitySearchStateService;
  let catalogManagerStub: jasmine.SpyObj<CatalogManagerService>;

  const entityRecords: EntityRecord[] = SearchResultsMock;
  
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MockProvider(CatalogManagerService)
      ]
    });

    service = TestBed.inject(EntitySearchStateService);
    catalogManagerStub = TestBed.inject(CatalogManagerService) as jasmine.SpyObj<CatalogManagerService>;
  });

  afterEach(function () {
    service = null;
    catalogManagerStub = null;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
  it('should set results', () => {
    const mockPaginatedResponse: PaginatedResponse<EntityRecord[]> = {page: entityRecords, totalCount: entityRecords.length};
    catalogManagerStub.getEntities.and.returnValue(of(mockPaginatedResponse));
    service.setResults('http://mobi.com/catalog-local').subscribe(result => {
      expect(result).toEqual(entityRecords);
      expect(service.totalResultSize).toEqual(4);
    });
  });
  it('should reset pagination', () => {
    service.paginationConfig = {
      limit: 10,
      pageIndex: 1,
      searchText: 'test',
      keywords: ['keyword1'],
      sortOption: {
        field: 'field',
        label: 'label',
        asc: true
      }
    } as PaginatedConfig;
    service.totalResultSize = 10;
    service.keywordSearchText = "keywordSearch";

    service.reset();
    expect(service.paginationConfig.pageIndex).toEqual(0);
    expect(service.paginationConfig.searchText).toEqual('');
    expect(service.paginationConfig.type).toEqual([]);
    expect(service.paginationConfig.keywords).toEqual([]);
    expect(service.totalResultSize).toEqual(0);
    expect(service.keywordSearchText).toEqual('');
  });
});