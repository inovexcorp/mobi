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
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';
import { MockComponent } from 'ng-mocks';

import { SearchResultsListComponent } from '../search-results-list/search-results-list.component';
import { cleanStylesFromDOM } from '../../../../test/ts/Shared';
import { EntitySearchPageComponent } from './entity-search-page.component';

describe('EntityPageComponent', () => {
  let component: EntitySearchPageComponent;
  let fixture: ComponentFixture<EntitySearchPageComponent>;
  let element: DebugElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        EntitySearchPageComponent,
        MockComponent(SearchResultsListComponent)
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(EntitySearchPageComponent);
    component = fixture.componentInstance;
    element = fixture.debugElement;
    fixture.detectChanges();
  });

  afterEach(function () {
    cleanStylesFromDOM();
    element = null;
    fixture = null;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  describe('contains the correct html', function () {
    it('for wrapping containers', function () {
      expect(element.queryAll(By.css('.entity-search-page')).length).toEqual(1);
    });
    it('with a search-results-list', function () {
      expect(element.queryAll(By.css('app-search-results-list')).length).toBe(1);
    });
  });
});
