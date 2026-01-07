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
import { fakeAsync, TestBed, tick } from '@angular/core/testing';

import { MockProvider } from 'ng-mocks';
import { of, throwError } from 'rxjs';

import { CatalogManagerService } from '../../shared/services/catalogManager.service';
import { EntityRecord } from '../models/entity-record';
import { PaginatedConfig } from '../../shared/models/paginatedConfig.interface';
import { PaginatedResponse } from '../../shared/models/paginated-response.interface';
import { SearchResultsMock } from '../mock-data/search-results.mock';
import { ToastService } from '../../shared/services/toast.service';
import { RESTError } from '../../shared/models/RESTError.interface';
import { ONTOLOGYEDITOR } from '../../prefixes';
import { EntitySearchStateService } from './entity-search-state.service';

describe('EntitySearchStateService', () => {
  let service: EntitySearchStateService;
  let catalogManagerStub: jasmine.SpyObj<CatalogManagerService>;
  let toastStub: jasmine.SpyObj<ToastService>;

  const entityRecords: EntityRecord[] = SearchResultsMock;
  const catalogId = 'http://mobi.com/catalog-local';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MockProvider(CatalogManagerService),
        MockProvider(ToastService)
      ]
    });

    service = TestBed.inject(EntitySearchStateService);
    catalogManagerStub = TestBed.inject(CatalogManagerService) as jasmine.SpyObj<CatalogManagerService>;
    toastStub = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;
  });

  afterEach(function () {
    service = null;
    catalogManagerStub = null;
    toastStub = null;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
  it('should reset the service', () => {
    spyOn(service, 'resetPagination');
    service.paginationConfig.type = [`${ONTOLOGYEDITOR}OntologyRecord`];
    service.paginationConfig.keywords = ['keyword1', 'keyword2'];
    service.keywordSearchText = 'keyword';
    service.currentResults = entityRecords;
    service.reset();
    expect(service.resetPagination).toHaveBeenCalledWith();
    expect(service.paginationConfig.type).toEqual([]);
    expect(service.paginationConfig.keywords).toEqual([]);
    expect(service.keywordSearchText).toEqual('');
    expect(service.currentResults).toEqual([]);
  });
  describe('should set results', () => {
    const mockPaginatedResponse: PaginatedResponse<EntityRecord[]> = {page: entityRecords, totalCount: entityRecords.length};
    beforeEach(() => {
      service.paginationConfig.pageIndex = 2;
    });
    it('successfully', fakeAsync(() => {
      catalogManagerStub.getEntities.and.returnValue(of(mockPaginatedResponse));
      service.setResults(catalogId).subscribe(result => {
        expect(toastStub.createErrorToast).not.toHaveBeenCalled();
        expect(service.paginationConfig.pageIndex).toEqual(2);
        expect(result).toEqual(entityRecords);
        expect(service.currentResults).toEqual(entityRecords);
        expect(service.totalResultSize).toEqual(4);
      });
      tick();
    }));
    it('if the page index exceeds the number of results', fakeAsync(() => {
      const mockErrorObject: RESTError = {
        error: 'IllegalArgumentException',
        errorMessage: 'Offset exceeds total size',
        errorDetails: []
      };
      catalogManagerStub.getEntities.and.returnValues(throwError(mockErrorObject), of(mockPaginatedResponse));
      service.setResults(catalogId).subscribe(result => {
        expect(toastStub.createErrorToast).toHaveBeenCalledWith(jasmine.any(String));
        expect(service.paginationConfig.pageIndex).toEqual(0);
        expect(result).toEqual(entityRecords);
        expect(service.currentResults).toEqual(entityRecords);
        expect(service.totalResultSize).toEqual(4);
      });
      tick();
    }));
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
    service.keywordSearchText = 'keywordSearch';

    service.reset();
    expect(service.paginationConfig.pageIndex).toEqual(0);
    expect(service.paginationConfig.searchText).toEqual('');
    expect(service.paginationConfig.type).toEqual([]);
    expect(service.paginationConfig.keywords).toEqual([]);
    expect(service.paginationConfig.sortOption).toEqual({
        field: 'entityName',
        asc: true,
        label: 'Entity Name (asc)'
    }, {
        field: 'entityName',
        asc: false,
        label: 'Entity Name (desc)'
    });
    expect(service.totalResultSize).toEqual(0);
    expect(service.keywordSearchText).toEqual('');
  });
});
