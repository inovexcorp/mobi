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
import { HttpResponse } from '@angular/common/http';
import { DebugElement } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MockComponent, MockProvider } from 'ng-mocks';
import { of, throwError } from 'rxjs';

import {
  cleanStylesFromDOM,
} from '../../../../../public/test/ts/Shared';
import { CATALOG, DCTERMS, ONTOLOGYEDITOR, OWL, XSD } from '../../../prefixes';
import { ErrorDisplayComponent } from '../../../shared/components/errorDisplay/errorDisplay.component';
import { InfoMessageComponent } from '../../../shared/components/infoMessage/infoMessage.component';
import { ProgressSpinnerService } from '../../../shared/components/progress-spinner/services/progressSpinner.service';
import { SearchBarComponent } from '../../../shared/components/searchBar/searchBar.component';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { DatasetsOntologyPickerComponent } from './datasetsOntologyPicker.component';

describe('Datasets Ontology Picker component', function () {
  let component: DatasetsOntologyPickerComponent;
  let element: DebugElement;
  let fixture: ComponentFixture<DatasetsOntologyPickerComponent>;
  let catalogManagerStub: jasmine.SpyObj<CatalogManagerService>;

  const catalogId = 'http://mobi.com/catalog-local';
  const ontology1Id = 'ontology1Record';
  const ontology1IRI = 'ontology1';
  const ontology1Title = 'Ontology 1';
  const ontology2Id = 'ontology2Record';
  const ontology2Title = 'Ontology 2';
  let ontology1Record: JSONLDObject;
  let ontology2Record: JSONLDObject;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatListModule,
        MatChipsModule,
        MatIconModule,
        NoopAnimationsModule
      ],
      declarations: [
        DatasetsOntologyPickerComponent,
        MockComponent(InfoMessageComponent),
        MockComponent(ErrorDisplayComponent),
        MockComponent(SearchBarComponent)
      ],
      providers: [
        MockProvider(CatalogManagerService),
        MockProvider(ProgressSpinnerService),
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DatasetsOntologyPickerComponent);
    component = fixture.componentInstance;
    element = fixture.debugElement;
    component.readyFlag = true;
    catalogManagerStub = TestBed.inject(CatalogManagerService) as jasmine.SpyObj<CatalogManagerService>;

    ontology1Record = {
      '@id': ontology1Id,
      '@type': [`${OWL}Thing`,
      `${CATALOG}Record`,
      `${CATALOG}VersionedRecord`,
      `${ONTOLOGYEDITOR}OntologyRecord`,
      `${CATALOG}VersionedRDFRecord`],
      [`${CATALOG}branch`]: [{ '@id': 'ontology1Branch' }],
      [`${CATALOG}catalog`]: [{ '@id': catalogId }],
      [`${CATALOG}masterBranch`]: [{ '@id': 'ontology1Branch' }],
      [`${CATALOG}trackedIdentifier`]: [{ '@id': 'ontology1' }],
      [`${DCTERMS}description`]: [{ '@value': '' }],
      [`${DCTERMS}issued`]: [{
        '@type': `${XSD}dateTime`,
        '@value': '2017-07-12T10:28:15-04:00'
      }],
      [`${DCTERMS}modified`]: [{
        '@type': `${XSD}dateTime`,
        '@value': '2017-07-12T10:28:15-04:00'
      }],
      [`${DCTERMS}publisher`]: [{ '@id': 'http://mobi.com/users/user1' }],
      [`${DCTERMS}title`]: [{ '@value': ontology1Title }]
    };
    ontology2Record = {
      '@id': ontology2Id,
      '@type': [`${OWL}Thing`,
      `${CATALOG}Record`,
      `${CATALOG}VersionedRecord`,
      `${ONTOLOGYEDITOR}OntologyRecord`,
      `${CATALOG}VersionedRDFRecord`],
      [`${CATALOG}branch`]: [{ '@id': 'ontology2Branch' }],
      [`${CATALOG}catalog`]: [{ '@id': catalogId }],
      [`${CATALOG}masterBranch`]: [{ '@id': 'ontology2Branch' }],
      [`${CATALOG}trackedIdentifier`]: [{ '@id': 'ontology2' }],
      [`${DCTERMS}description`]: [{ '@value': '' }],
      [`${DCTERMS}issued`]: [{
        '@type': `${XSD}dateTime`,
        '@value': '2017-07-12T10:28:15-04:00'
      }],
      [`${DCTERMS}modified`]: [{
        '@type': `${XSD}dateTime`,
        '@value': '2017-07-12T10:28:15-04:00'
      }],
      [`${DCTERMS}publisher`]: [{ '@id': 'http://mobi.com/users/user1' }],
      [`${DCTERMS}title`]: [{ '@value': ontology2Title }]
    };

    catalogManagerStub.localCatalog = { '@id': catalogId };

    catalogManagerStub.getRecords.and.returnValue(of(new HttpResponse({ body: [] })));
  });

  afterEach(function () {
    cleanStylesFromDOM();
    component = null;
    element = null;
    fixture = null;
    catalogManagerStub = null;
  });

  it('should initialize correctly', function () {
    spyOn(component, 'setOntologies');
    component.ngOnChanges();
    expect(component.catalogId).toEqual(catalogId);
    expect(component.ontologySearchConfig).toEqual({
      pageIndex: 0,
      sortOption: undefined,
      type: [`${ONTOLOGYEDITOR}OntologyRecord`],
      limit: 100,
      searchText: ''
    });
    expect(component.setOntologies).toHaveBeenCalledWith();
  });
  describe('controller methods', function () {
    it('should get the ontology IRI of an OntologyRecord', function () {
      expect(component.getOntologyIRI(ontology1Record)).toEqual(ontology1IRI);
    });
    describe('should set the list of ontologies', function () {
      beforeEach(function () {
        spyOn(component, 'getOntologyIRI').and.returnValue('ontology');
        component.catalogId = catalogId;
      });
      it('unless an error occurs', fakeAsync(function () {
        catalogManagerStub.getRecords.and.callFake(() => throwError('Error Message'));
        component.setOntologies();
        tick();
        expect(catalogManagerStub.getRecords).toHaveBeenCalledWith(catalogId, component.ontologySearchConfig, true);
        expect(component.ontologies).toEqual([]);
        expect(component.error).toEqual('Error Message');
      }));
      it('successfully', fakeAsync(function () {
        catalogManagerStub.getRecords.and.returnValue(of(new HttpResponse({ body: [ontology1Record, ontology2Record] })));
        component.selected = [{
          recordId: ontology1Id,
          ontologyIRI: ontology1IRI,
          title: ontology1Title,
          selected: true,
          jsonld: ontology1Record
        }];
        component.setOntologies();
        tick();
        expect(catalogManagerStub.getRecords).toHaveBeenCalledWith(catalogId, component.ontologySearchConfig, true);
        expect(component.ontologies).toEqual([
          { recordId: ontology1Id, title: ontology1Title, ontologyIRI: 'ontology', selected: true, jsonld: ontology1Record },
          { recordId: ontology2Id, title: ontology2Title, ontologyIRI: 'ontology', selected: false, jsonld: ontology2Record },
        ]);
        expect(component.error).toEqual('');
      }));
    });
    describe('should toggle an ontology if it has been', function () {
      beforeEach(function () {
        spyOn(component.selectedChange, 'emit');
      });
      it('selected', function () {
        const ontology = {
          recordId: ontology1Id,
          ontologyIRI: ontology1IRI,
          title: ontology1Title,
          selected: true,
          jsonld: ontology1Record
        };
        component.selected = [ontology];
        component.toggleOntology(ontology);
        expect(ontology.selected).toBe(false);
        expect(component.selected).toEqual([]);
        expect(component.selectedChange.emit).toHaveBeenCalledWith([]);
      });
      it('unselected', function () {
        const ontology = {
          recordId: ontology1Id,
          ontologyIRI: ontology1IRI,
          title: ontology1Title,
          selected: false,
          jsonld: ontology1Record
        };
        component.selected = [];
        component.toggleOntology(ontology);
        expect(ontology.selected).toBe(true);
        expect(component.selected).toEqual([ontology]);
        expect(component.selectedChange.emit).toHaveBeenCalledWith([ontology]);
      });
    });
  });
  describe('contains the correct html', function () {
    beforeEach(function () {
      spyOn(component, 'setOntologies');
      component.selected = [];
    });
    it('for wrapping containers', function () {
      expect(element.queryAll(By.css('.datasets-ontology-picker')).length).toEqual(1);
    });
    ['.field-label', 'search-bar', '.ontologies', 'mat-chip-list'].forEach(test => {
      it('with a ' + test, function () {
        expect(element.queryAll(By.css(test)).length).toEqual(1);
      });
    });
    it('depending on whether an error has occurred', function () {
      expect(element.queryAll(By.css('error-display')).length).toEqual(0);
      component.error = 'error';
      fixture.detectChanges();
      expect(element.queryAll(By.css('error-display')).length).toEqual(1);
    });
    it('depending on the number of ontologies', function () {
      fixture.detectChanges();
      expect(element.queryAll(By.css('info-message')).length).toEqual(1);
      expect(element.queryAll(By.css('mat-list-option')).length).toEqual(0);

      component.ontologies = [{
        recordId: ontology1Id,
        ontologyIRI: ontology1IRI,
        title: ontology1Title,
        selected: false,
        jsonld: ontology1Record
      }];
      fixture.detectChanges();
      expect(element.queryAll(By.css('mat-list-option')).length).toEqual(component.ontologies.length);
      expect(element.queryAll(By.css('info-message')).length).toEqual(0);
    });
    it('depending on the number of selected ontologies', function () {
      expect(element.queryAll(By.css('mat-chip')).length).toEqual(0);

      component.selected = [{
        recordId: ontology1Id,
        ontologyIRI: ontology1IRI,
        title: ontology1Title,
        selected: false,
        jsonld: ontology1Record
      }];
      fixture.detectChanges();
      expect(element.queryAll(By.css('mat-chip')).length).toEqual(1);
    });
  });
});
