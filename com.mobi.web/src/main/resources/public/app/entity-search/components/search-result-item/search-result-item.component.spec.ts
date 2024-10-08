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
import { MockComponent, MockPipe, MockProvider } from 'ng-mocks';
import { DebugElement } from '@angular/core';

import { PrefixationPipe } from '../../../shared/pipes/prefixation.pipe';
import { HighlightTextPipe } from '../../../shared/pipes/highlightText.pipe';
import { EntityRecord } from '../../models/entity-record';
import { SearchResultsMock } from '../../mock-data/search-results.mock';
import { RecordIconComponent } from '../../../shared/components/recordIcon/recordIcon.component';
import { EntitySearchStateService } from '../../services/entity-search-state.service';
import { SearchResultItemComponent } from './search-result-item.component';
import { OpenRecordButtonComponent } from '../../../catalog/components/openRecordButton/openRecordButton.component';

describe('SearchResultItemComponent', () => {
  let component: SearchResultItemComponent;
  let element: DebugElement;
  let fixture: ComponentFixture<SearchResultItemComponent>;
  let searchManagerStub: jasmine.SpyObj<EntitySearchStateService>;

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
        MockPipe(HighlightTextPipe, (value: string) => value),
        MockComponent(RecordIconComponent),
        MockComponent(OpenRecordButtonComponent)
      ],
      providers: [
        PrefixationPipe,
        MockProvider(EntitySearchStateService)
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

    searchManagerStub = TestBed.inject(EntitySearchStateService) as jasmine.SpyObj<EntitySearchStateService>;
    searchManagerStub.paginationConfig = {
      limit: 10,
      pageIndex: 0,
      searchText: ''
    };
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
    searchManagerStub = null;
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
    it('should display the correct number of matching annotations and annotations list', () => {
      entityRecord.totalNumMatchingAnnotations = 6;
      entityRecord.matchingAnnotations = [
        { propName: 'Entity1Name', prop: 'Entity1', matchValue: 'MatchedValue1', value: 'Value1' },
        { propName: 'Entity2Name', prop: 'Entity2', matchValue: 'MatchedValue2', value: 'Value2' },
        { propName: 'Entity3Name', prop: 'Entity3', matchValue: 'MatchedValue3', value: 'Value3' },
        { propName: 'Entity4Name', prop: 'Entity4', matchValue: 'MatchedValue4', value: 'Value4' },
        { propName: 'Entity5Name', prop: 'Entity5', matchValue: 'MatchedValue5', value: 'Value5' }
      ];
      fixture.detectChanges();
  
      const matchingAnnotations = element.query(By.css('.matching-annotations')).nativeElement;
      const annotationsMessage = element.query(By.css('.annotation-section div:nth-child(2)')).nativeElement;
      const annotationItems = element.queryAll(By.css('.annotation-item'));
  
      expect(matchingAnnotations.textContent.trim()).toEqual('6 Matching Annotations(s)');
      expect(annotationsMessage.textContent.trim()).toEqual('Only the first 5 matching annotations are shown.');
      expect(annotationItems.length).toEqual(5);
      expect(annotationItems[0].queryAll(By.css('.prop-name'))[0].nativeElement.textContent.trim()).toEqual('Entity1Name');
      expect(annotationItems[0].queryAll(By.css('dd'))[0].nativeElement.textContent.trim()).toEqual('MatchedValue1');
    });
  });
});
