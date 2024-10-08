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
import { MatIconModule } from '@angular/material/icon';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { By } from '@angular/platform-browser';
import { MatCardModule } from '@angular/material/card';

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MockComponent } from 'ng-mocks';
import { DebugElement } from '@angular/core';

import { PrefixationPipe } from '../../../shared/pipes/prefixation.pipe';
import { EntityRecord } from '../../models/entity-record';
import { SearchResultsMock } from '../../mock-data/search-results.mock';
import { RecordIconComponent } from '../../../shared/components/recordIcon/recordIcon.component';
import { SearchResultItemComponent } from './search-result-item.component';
import { OpenRecordButtonComponent } from '../../../catalog/components/openRecordButton/openRecordButton.component';

describe('SearchResultItemComponent', () => {
  let component: SearchResultItemComponent;
  let element: DebugElement;
  let fixture: ComponentFixture<SearchResultItemComponent>;

  const entityRecord: EntityRecord = SearchResultsMock[0];
  const record = {
    '@id': entityRecord.record.iri,
    '@type': [entityRecord.record.type],
    'entityIRI': 'http://www.co-ode.org/ontologies/pizza/pizza.owl#IceCream'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        SearchResultItemComponent,
        MockComponent(RecordIconComponent),
        MockComponent(OpenRecordButtonComponent)
      ],
      providers: [
        PrefixationPipe
      ],
      imports: [
        MatIconModule,
        NoopAnimationsModule,
        MatCardModule,
        MatTooltipModule,
        ClipboardModule,
        MatIconTestingModule
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(SearchResultItemComponent);
    component = fixture.componentInstance;
    element = fixture.debugElement;
    component.entity = entityRecord;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture = null;
    component = null;
    element = null;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  describe('it should initialize properly', () => {
    beforeEach(() => {
      component.record = record;
    });
    it('should initialize the correct controller methods', async () => {
      component.ngOnInit();
      expect(component.record).toEqual(record);
      expect(component.types).toEqual('owl:Class');
    });
  });
  describe('contains the correct html', function () {
    it('for wrapping containers', function () {
      expect(element.queryAll(By.css('.entity-record')).length).toEqual(1);
    });
    ['mat-card-title', 'mat-card-subtitle', 'mat-card-content', '.entity-iri', 'mat-icon', '.entity-type',
      '.entity-record_prop', '.entity-description', 'open-record-button'].forEach(function (test) {
      it(`with a ${test}`, function () {
        expect(element.queryAll(By.css(test)).length).toEqual(1);
      });
    });
    it('should display the record correctly', () => {
      const entityName = element.query(By.css('.entity-name span')).nativeElement;
      const entityIri = element.query(By.css('.entity-iri span')).nativeElement;
      const entityDescription = element.query(By.css('.entity-description')).nativeElement;
      const recordTitle = element.query(By.css('.entity-record-title')).nativeElement;

      expect(entityName.textContent.trim()).toBe(entityRecord.entityName);
      expect(entityIri.textContent.trim()).toBe(entityRecord.iri);
      expect(entityDescription.textContent.trim()).toBe(entityRecord.description);
      expect(recordTitle.textContent.trim()).toBe(entityRecord.record.title);
      const recordIconComponent = element.query(By.directive(RecordIconComponent)).componentInstance;
      expect(recordIconComponent.record).toEqual(record);
    });
  });
});
