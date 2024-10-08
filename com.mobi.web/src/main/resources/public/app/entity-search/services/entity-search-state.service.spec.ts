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

import { EntitySearchStateService } from './entity-search-state.service';
import { EntitySearchManagerService } from './entity-search-manager.service';
import { MockProvider } from 'ng-mocks';

import { PaginatedConfig } from '../../shared/models/paginatedConfig.interface';
import { of } from 'rxjs';
import { EntityRecord } from '../models/entity-record';
import { SearchResultsMock } from '../mock-data/search-results.mock';
import { PaginatedResponse } from '../models/paginated-response.interface';

describe('EntitySearchStateService', () => {
  let service: EntitySearchStateService;
  let stateManagerStub: jasmine.SpyObj<EntitySearchManagerService>;

  const entityRecords: EntityRecord[] = SearchResultsMock;
  
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MockProvider(EntitySearchManagerService)
      ]
    });

    service = TestBed.inject(EntitySearchStateService);
    stateManagerStub = TestBed.inject(EntitySearchManagerService) as jasmine.SpyObj<EntitySearchManagerService>;
  });

  afterEach(function () {
    service = null;
    stateManagerStub = null;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
  it('should set results', () => {
    const mockPaginatedResponse: PaginatedResponse<EntityRecord[]> = {page: entityRecords, totalCount: entityRecords.length};
    stateManagerStub.getEntities.and.returnValue(of(mockPaginatedResponse));
    service.setResults().subscribe(result => {
      expect(result).toEqual(entityRecords);
      expect(service.totalResultSize).toEqual(4);
    });
  });
  it('should reset pagination', () => {
    service.paginationConfig = {
      limit: 10,
      pageIndex: 1,
      searchText: 'test',
      sortOption: {
        field: 'field',
        label: 'label',
        asc: true
      }
    } as PaginatedConfig;
    service.totalResultSize = 10;

    service.reset();

    expect(service.paginationConfig.pageIndex).toBe(0);
    expect(service.paginationConfig.searchText).toBe('');
    expect(service.totalResultSize).toBe(0);
  });
});
