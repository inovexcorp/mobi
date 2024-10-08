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
import { EntitySearchManagerService } from './entity-search-manager.service';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { EntityRecord } from '../models/entity-record';
import { PaginatedConfig } from '../../shared/models/paginatedConfig.interface';
import { SearchResultsMock } from '../mock-data/search-results.mock';
import { MockProvider } from 'ng-mocks';
import { CatalogManagerService } from '../../shared/services/catalogManager.service';
import { ProgressSpinnerService } from '../../shared/components/progress-spinner/services/progressSpinner.service';
import { PaginatedResponse } from '../models/paginated-response.interface';

describe('EntitySearchManagerService', () => {
  let service: EntitySearchManagerService;
  let httpMock: HttpTestingController;
  let catalogManagerStub: jasmine.SpyObj<CatalogManagerService>;
  let spinnerStub: jasmine.SpyObj<ProgressSpinnerService>;

  const catalogId = 'catalogId';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        EntitySearchManagerService,
        MockProvider(CatalogManagerService),
        MockProvider(ProgressSpinnerService)
      ]
    });
    service = TestBed.inject(EntitySearchManagerService);
    service.prefix = 'prefix';
    service.catalogId = catalogId;
    service.searchURL = `${service.prefix}/${catalogId}/entities`;
    catalogManagerStub = TestBed.inject(CatalogManagerService) as jasmine.SpyObj<CatalogManagerService>;
    spinnerStub = TestBed.inject(ProgressSpinnerService) as jasmine.SpyObj<ProgressSpinnerService>;
    catalogManagerStub.localCatalog = {'@id': catalogId};
    spinnerStub.track.and.callFake((ob) => ob);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    spinnerStub = null;
    service = null;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('should fetch search result', () => {
    it('successfully', () => {
      const entities: EntityRecord[] = SearchResultsMock;
      const url = `${service.prefix}/${service.catalogId}/entities?limit=5&offset=0&searchText=test`;
      const config: PaginatedConfig = {
        offset: 0,
        infer: false,
        limit: 5,
        pageIndex: 1,
        sortOption: undefined,
        searchText: 'test',
        type: 'test type',
        keywords: ['test'],
        creators: ['test']
      };
      service.getEntities(config).subscribe((response: PaginatedResponse<EntityRecord[]>) => {
        expect(response.page.length).toBe(4);
        expect(response.page).toEqual(entities);
      });
      const req = httpMock.expectOne(`${url}`);
      expect(req.request.method).toBe('GET');
      req.flush(entities);
    });
  });

  describe('Entity Search substring display', () => {
    const str = 'This is a test string that has a bunch of words with more content.';
    const tests = [
      {
        searchText: 'bunch',
        expected: '...has a bunch of words...'
      },
      {
        searchText: 'test',
        expected: '...is a test string that...'
      },
      {
        searchText: 'content',
        expected: '...with more content.'
      },
      {
        searchText: 'This',
        expected: 'This is a...'
      },
      {
        searchText: 'string',
        expected: '...a test string that has...'
      },
      {
        searchText: 'has',
        expected: '...string that has a bunch...'
      }
    ];
    tests.forEach(test => {
      it(`should truncate correctly for search "${test.searchText}"`, () => {
        const result = service.getSubstringMatch(str, test.searchText);
        expect(result).toEqual(test.expected);
      });
    });
  });
});