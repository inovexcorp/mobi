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
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { EntitySearchStateService } from '../../services/entity-search-state.service';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { By } from '@angular/platform-browser';

import { MockComponent, MockProvider } from 'ng-mocks';

import { of } from 'rxjs';

import { RecordIconComponent } from '../../../shared/components/recordIcon/recordIcon.component';
import { SearchBarComponent } from '../../../shared/components/searchBar/searchBar.component';
import { InfoMessageComponent } from '../../../shared/components/infoMessage/infoMessage.component';
import { EntityRecord } from '../../models/entity-record';
import { SearchResultsMock } from '../../mock-data/search-results.mock';
import { DCTERMS } from '../../../prefixes';
import { SearchResultsListComponent } from './search-results-list.component';

describe('SearchResultsListComponent', () => {
  let component: SearchResultsListComponent;
  let fixture: ComponentFixture<SearchResultsListComponent>;
  let element: DebugElement;
  let searchManagerStub: jasmine.SpyObj<EntitySearchStateService>;

  const entityRecords: EntityRecord[] = SearchResultsMock;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        SearchResultsListComponent,
        MockComponent(RecordIconComponent),
        MockComponent(SearchBarComponent),
        MockComponent(SearchBarComponent),
        MockComponent(InfoMessageComponent),
      ],
      providers: [
        MockProvider(EntitySearchStateService),
      ],
      imports: [
        NoopAnimationsModule,
        MatPaginatorModule
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(SearchResultsListComponent);
    component = fixture.componentInstance;
    element = fixture.debugElement;
    searchManagerStub = TestBed.inject(EntitySearchStateService) as jasmine.SpyObj<EntitySearchStateService>;
    searchManagerStub.paginationConfig = {
      limit: 10,
      pageIndex: 0,
      searchText: '',
      sortOption: {
        field: `${DCTERMS}title`,
        label: 'Title',
        asc: true
      }
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  describe('should initialize with the correct values', function () {
    it('when no value is specify', () => {
      component.ngOnInit();
      fixture.detectChanges();
      expect(searchManagerStub.setResults).not.toHaveBeenCalledWith();
    });
    it('should set results on when value is set', () => {
      searchManagerStub.setResults.and.returnValue(of(entityRecords));
      searchManagerStub.paginationConfig.searchText = 'test';
      component.ngOnInit();
      fixture.detectChanges();
      expect(searchManagerStub.setResults).toHaveBeenCalledWith();
      expect(component.searchResult).toBeDefined();
      component.searchResult.subscribe(searchResult => {
        expect(searchResult).toBeDefined();
        expect(searchResult.length).toEqual(entityRecords.length);
        expect(searchResult).toEqual(entityRecords);
      });
    });
  });

  it('should reset pagination and load data on searchRecords', () => {
    component.searchRecords();
    expect(searchManagerStub.resetPagination).toHaveBeenCalledWith();
  });
  it('should set results on getResultPage', () => {
    searchManagerStub.setResults.and.returnValue(of(entityRecords));
    searchManagerStub.paginationConfig.searchText = 'test';
    const pageEvent = new PageEvent();
    pageEvent.pageIndex = 0;

    component.getResultPage(pageEvent);
    expect(searchManagerStub.setResults).toHaveBeenCalledWith();
  });

  describe('contains the correct html', function () {
    it('for wrapping containers', function () {
      expect(element.queryAll(By.css('.search-results')).length).toEqual(1);
    });
    ['.entity-results-list', 'search-bar', 'info-message', 'mat-paginator'].forEach(function (test) {
      it(`with a ${test}`, function () {
        expect(element.queryAll(By.css(test)).length).toEqual(1);
      });
    });
    it('should display a list', async () => {
      searchManagerStub.setResults.and.returnValue(of(entityRecords));
      searchManagerStub.paginationConfig.searchText = 'test';
      component.ngOnInit();
      fixture.detectChanges();
      expect(element.queryAll(By.css('app-search-result-item')).length).toEqual(entityRecords.length);
    });
  });
});
