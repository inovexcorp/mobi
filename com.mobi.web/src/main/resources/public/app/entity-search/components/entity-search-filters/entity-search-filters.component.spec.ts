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

import { MockComponent, MockProvider } from 'ng-mocks';

import { EntitySearchFiltersComponent } from './entity-search-filters.component';
import { CatalogStateService } from '../../../shared/services/catalogState.service';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { EntitySearchStateService } from '../../services/entity-search-state.service';
import { DELIM, ONTOLOGYEDITOR, SHAPESGRAPHEDITOR, WORKFLOWS } from '../../../prefixes';
import { ListFilter } from '../../../shared/models/list-filter.interface';
import { ListFiltersComponent } from '../../../shared/components/list-filters/list-filters.component';

describe('Entity Search Filters component', () => {
  let component: EntitySearchFiltersComponent;
  let fixture: ComponentFixture<EntitySearchFiltersComponent>;
  let entityStateStub: jasmine.SpyObj<EntitySearchStateService>;

  let recordTypeFilter: ListFilter;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        EntitySearchFiltersComponent,
        MockComponent(ListFiltersComponent)
      ],
      providers: [
        MockProvider(CatalogStateService),
        MockProvider(CatalogManagerService)
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EntitySearchFiltersComponent);
    entityStateStub = TestBed.inject(EntitySearchStateService) as jasmine.SpyObj<EntitySearchStateService>;
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    component = null;
    entityStateStub = null;
    fixture = null;
    recordTypeFilter = null;
  });

  describe('initializes correctly', () => {
    beforeEach(() => {
      entityStateStub.selectedRecordTypes = [`${ONTOLOGYEDITOR}OntologyRecord`];
      spyOn(component.changeFilter, 'emit');
      component.ngOnInit();
      recordTypeFilter = component.filters[0];
    });
    it('with recordTypeFilter', () => {
      const expectedFilterItems = [
        {value: `${ONTOLOGYEDITOR}OntologyRecord`, checked: true},
        {value: `${WORKFLOWS}WorkflowRecord`, checked: false},
        {value: `${DELIM}MappingRecord`, checked: false},
        {value: `${SHAPESGRAPHEDITOR}ShapesGraphRecord`, checked: false},
      ];

      component.ngOnInit();
      expect(recordTypeFilter.title).toEqual('Record Type');
      expect(recordTypeFilter.filterItems).toEqual(expectedFilterItems);
    });
  });
  describe('has working filter methods', () => {
    beforeEach(() => {
      spyOn(component.changeFilter, 'emit');
      entityStateStub.selectedRecordTypes = [`${ONTOLOGYEDITOR}OntologyRecord`];
      component.ngOnInit();
      recordTypeFilter = component.filters[0];
    });
    describe('for the recordTypeFilter', () => {
      it('if the item has been checked', () => {
        const clickedFilterItem = {value: `${WORKFLOWS}WorkflowRecord`, checked: true};
        recordTypeFilter.filter(clickedFilterItem);

        expect(component.changeFilter.emit).toHaveBeenCalledWith({chosenTypes: [
            `${ONTOLOGYEDITOR}OntologyRecord`,
            `${WORKFLOWS}WorkflowRecord`
          ]});

        expect(entityStateStub.selectedRecordTypes.length).toEqual(2);
      });
      it('if the item has not been checked', () => {
        const clickedFilterItem = {value: `${ONTOLOGYEDITOR}OntologyRecord`, checked: false};
        recordTypeFilter.filter(clickedFilterItem);

        expect(entityStateStub.selectedRecordTypes.length).toEqual(0);
        expect(component.changeFilter.emit).toHaveBeenCalledWith({chosenTypes: []});
      });
    });
  });
});
