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
import { ActivatedRoute, Router } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';
import { Location } from '@angular/common';

import { MockComponent, MockProvider } from 'ng-mocks';
import { of, Subject, throwError } from 'rxjs';

import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { ChangesPageComponent }
  from '../../../versioned-rdf-record-editor/components/changes-page/changes-page.component';
import { cleanStylesFromDOM } from '../../../../test/ts/Shared';
import { EditorTopBarComponent }
  from '../../../versioned-rdf-record-editor/components/editor-top-bar/editor-top-bar.component';
import { MergePageComponent } from '../../../versioned-rdf-record-editor/components/merge-page/merge-page.component';
import { ONTOLOGYEDITOR } from '../../../prefixes';
import { OntologyListItem } from '../../../shared/models/ontologyListItem.class';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { OntologyTabComponent } from '../ontologyTab/ontologyTab.component';
import { ToastService } from '../../../shared/services/toast.service';
import { OntologyEditorPageComponent } from './ontologyEditorPage.component';

describe('Ontology Editor Page component', function () {
  let element: DebugElement;
  let fixture: ComponentFixture<OntologyEditorPageComponent>;
  let component: OntologyEditorPageComponent;
  let ontologyStateStub: jasmine.SpyObj<OntologyStateService>;
  let catalogManagerStub: jasmine.SpyObj<CatalogManagerService>;
  let toastStub: jasmine.SpyObj<ToastService>;
  let locationStub: jasmine.SpyObj<Location>;
  let routerStub: jasmine.SpyObj<Router>;
  let queryParamsSubject: Subject<any>;

  beforeEach(async () => {
    queryParamsSubject = new Subject();
    TestBed.configureTestingModule({
      declarations: [
        OntologyEditorPageComponent,
        MockComponent(EditorTopBarComponent),
        MockComponent(ChangesPageComponent),
        MockComponent(MergePageComponent),
        MockComponent(OntologyTabComponent),
      ],
      providers: [
        MockProvider(CatalogManagerService),
        MockProvider(OntologyStateService),
        MockProvider(Location),
        MockProvider(ToastService),
        MockProvider(Router),
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: queryParamsSubject.asObservable()
          },
        },
      ]
    });
  });

  beforeEach(function () {
    fixture = TestBed.createComponent(OntologyEditorPageComponent);
    component = fixture.componentInstance;
    element = fixture.debugElement;
    ontologyStateStub = TestBed.inject(OntologyStateService) as jasmine.SpyObj<OntologyStateService>;
    catalogManagerStub = TestBed.inject(CatalogManagerService) as jasmine.SpyObj<CatalogManagerService>;
    toastStub = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;
    locationStub = TestBed.inject(Location) as jasmine.SpyObj<Location>;
    routerStub = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    ontologyStateStub.list = [];
    ontologyStateStub.toast = jasmine.createSpyObj('toast', ['get'], {
      clearToast: jasmine.createSpy('clearToast').and.callThrough(),
    });
    ontologyStateStub.snackBar = jasmine.createSpyObj('snackBar', ['get'], {
      dismiss: jasmine.createSpy('dismiss').and.callThrough(),
    });
    catalogManagerStub.localCatalog = { '@id': 'localCatalogId' };
  });

  afterEach(function () {
    cleanStylesFromDOM();
    element = null;
    fixture = null;
    component = null;
    ontologyStateStub = null;
    catalogManagerStub = null;
    toastStub = null;
    locationStub = null;
    routerStub = null;
    queryParamsSubject = null;
  });

  describe('contains the correct html', function () {
    it('for wrapping containers', function () {
      expect(element.queryAll(By.css('.ontology-editor-page')).length).toEqual(1);
    });
    it('depending on whether an ontology is selected', function () {
      fixture.detectChanges();
      expect(element.queryAll(By.css('ontology-tab')).length).toEqual(0);

      ontologyStateStub.listItem = new OntologyListItem();
      fixture.detectChanges();
      expect(element.queryAll(By.css('ontology-tab')).length).toEqual(1);
    });
    it('depending on whether a merge is in progress', function () {
      ontologyStateStub.listItem = new OntologyListItem();
      fixture.detectChanges();
      expect(element.queryAll(By.css('app-editor-top-bar')).length).toEqual(1);
      expect(element.queryAll(By.css('app-merge-page')).length).toEqual(0);
      expect(element.queryAll(By.css('ontology-tab')).length).toEqual(1);

      ontologyStateStub.listItem.merge.active = true;
      fixture.detectChanges();
      expect(element.queryAll(By.css('app-editor-top-bar')).length).toEqual(0);
      expect(element.queryAll(By.css('app-merge-page')).length).toEqual(1);
      expect(element.queryAll(By.css('ontology-tab')).length).toEqual(0);
    });
    it('depending on whether the changes page is open', function () {
      ontologyStateStub.listItem = new OntologyListItem();
      fixture.detectChanges();
      expect(element.queryAll(By.css('app-editor-top-bar')).length).toEqual(1);
      expect(element.queryAll(By.css('ontology-tab')).length).toEqual(1);
      expect(element.queryAll(By.css('app-changes-page')).length).toEqual(0);

      ontologyStateStub.listItem.changesPageOpen = true;
      fixture.detectChanges();
      expect(element.queryAll(By.css('app-editor-top-bar')).length).toEqual(1);
      expect(element.queryAll(By.css('ontology-tab')).length).toEqual(0);
      expect(element.queryAll(By.css('app-changes-page')).length).toEqual(1);
    });
  });
  describe('controller method', function () {
    describe('ngOnInit,', function () {
      describe('when query params include an id,', function () {
        //this tests whether the ontology is open or not
        it('should use existing item from list if found', function () {
          const recordIRI = 'http://example.com/record1';
          const existingItem = new OntologyListItem();
          existingItem.versionedRdfRecord.recordId = recordIRI;
          ontologyStateStub.list = [existingItem];
          ontologyStateStub.listItem = undefined;

          component.ngOnInit();
          queryParamsSubject.next({ id: recordIRI });

          expect(ontologyStateStub.listItem).toBe(existingItem);
          expect(catalogManagerStub.getRecord).not.toHaveBeenCalled();
        });
        it('should not update listItem if it is already the same record', function () {
          const recordIRI = 'http://example.com/record1';
          const existingItem = new OntologyListItem();
          existingItem.versionedRdfRecord.recordId = recordIRI;
          ontologyStateStub.list = [existingItem];
          ontologyStateStub.listItem = existingItem;

          component.ngOnInit();
          queryParamsSubject.next({ id: recordIRI });

          expect(ontologyStateStub.listItem).toBe(existingItem);
          expect(catalogManagerStub.getRecord).not.toHaveBeenCalled();
        });
        it('should open new record if not found in list', function () {
          const recordIRI = 'http://example.com/record2';
          const recordData = [{
            '@id': recordIRI,
            '@type': [`${ONTOLOGYEDITOR}OntologyRecord`],
            ['http://purl.org/dc/terms/title']: [{ '@value': 'Test Ontology' }],
            ['http://purl.org/dc/terms/description']: [{ '@value': 'Test Description' }]
          }];
          ontologyStateStub.list = [];
          ontologyStateStub.listItem = undefined;
          ontologyStateStub.getIdentifierIRI = jasmine.createSpy('getIdentifierIRI').and.returnValue('identifierIRI');
          ontologyStateStub.open = jasmine.createSpy('open').and.returnValue(of(null));
          catalogManagerStub.getRecord = jasmine.createSpy('getRecord').and.returnValue(of(recordData));

          component.ngOnInit();
          queryParamsSubject.next({ id: recordIRI });

          expect(catalogManagerStub.getRecord).toHaveBeenCalledWith(recordIRI, 'localCatalogId');
          expect(ontologyStateStub.open).toHaveBeenCalledWith({
            recordId: recordIRI,
            title: 'Test Ontology',
            identifierIRI: 'identifierIRI',
            description: 'Test Description'
          });
        });
        it('should handle error when record is not found', function () {
          const recordIRI = 'http://example.com/nonexistent';
          ontologyStateStub.list = [];
          ontologyStateStub.listItem = undefined;
          catalogManagerStub.getRecord = jasmine.createSpy('getRecord').and.returnValue(of([]));
          toastStub.createErrorToast = jasmine.createSpy('createErrorToast');
          routerStub.navigate = jasmine.createSpy('navigate').and.resolveTo(true);

          component.ngOnInit();
          queryParamsSubject.next({ id: recordIRI });

          expect(toastStub.createErrorToast)
            .toHaveBeenCalledWith(jasmine.objectContaining({ message: 'Record not found' }));
          expect(routerStub.navigate).toHaveBeenCalledWith(['/ontology-editor']);
          expect(ontologyStateStub.listItem).toBeUndefined();
        });
        it('should handle error when record is not an ontology', function () {
          const recordIRI = 'http://example.com/notOntology';
          const recordData = [{
            '@id': recordIRI,
            '@type': ['http://example.com/SomeOtherType']
          }];
          ontologyStateStub.list = [];
          ontologyStateStub.listItem = undefined;
          catalogManagerStub.getRecord = jasmine.createSpy('getRecord').and.returnValue(of(recordData));
          toastStub.createErrorToast = jasmine.createSpy('createErrorToast');
          routerStub.navigate = jasmine.createSpy('navigate').and.resolveTo(true);

          component.ngOnInit();
          queryParamsSubject.next({ id: recordIRI });

          expect(toastStub.createErrorToast)
            .toHaveBeenCalledWith(jasmine.objectContaining({ message: 'Could not open record as it is not an ontology.' }));
          expect(routerStub.navigate).toHaveBeenCalledWith(['/ontology-editor']);
          expect(ontologyStateStub.listItem).toBeUndefined();
        });
        it('should handle error when opening record fails', function () {
          const recordIRI = 'http://example.com/record3';
          const recordData = [{
            '@id': recordIRI,
            '@type': [`${ONTOLOGYEDITOR}OntologyRecord`],
            ['http://purl.org/dc/terms/title']: [{ '@value': 'Test Ontology' }]
          }];
          ontologyStateStub.list = [];
          ontologyStateStub.listItem = undefined;
          ontologyStateStub.getIdentifierIRI = jasmine.createSpy('getIdentifierIRI').and.returnValue('identifierIRI');
          ontologyStateStub.open = jasmine.createSpy('open').and.returnValue(throwError('Open failed'));
          catalogManagerStub.getRecord = jasmine.createSpy('getRecord').and.returnValue(of(recordData));
          toastStub.createErrorToast = jasmine.createSpy('createErrorToast');
          routerStub.navigate = jasmine.createSpy('navigate').and.resolveTo(true);

          component.ngOnInit();
          queryParamsSubject.next({ id: recordIRI });

          expect(toastStub.createErrorToast).toHaveBeenCalledWith('Open failed');
          expect(routerStub.navigate).toHaveBeenCalledWith(['/ontology-editor']);
          expect(ontologyStateStub.listItem).toBeUndefined();
        });
      });
      describe('when query params do not include an id,', function () {
        it('should update URL if listItem has a recordId', function () {
          const recordIRI = 'http://example.com/existing';
          const existingItem = new OntologyListItem();
          existingItem.versionedRdfRecord.recordId = recordIRI;
          ontologyStateStub.listItem = existingItem;
          locationStub.replaceState = jasmine.createSpy('replaceState');

          component.ngOnInit();
          queryParamsSubject.next({});

          expect(locationStub.replaceState).toHaveBeenCalledWith('/ontology-editor', `id=${encodeURIComponent(recordIRI)}`);
        });
        it('should not update URL if listItem is undefined', function () {
          ontologyStateStub.listItem = undefined;
          locationStub.replaceState = jasmine.createSpy('replaceState');

          component.ngOnInit();
          queryParamsSubject.next({});

          expect(locationStub.replaceState).not.toHaveBeenCalled();
        });
      });
    });
    describe('ngDoCheck', function () {
      it('should update URL when listItem changes to a new record', function () {
        const recordIRI = 'http://example.com/newRecord';
        const listItem = new OntologyListItem();
        listItem.versionedRdfRecord.recordId = recordIRI;
        ontologyStateStub.listItem = listItem;
        locationStub.replaceState = jasmine.createSpy('replaceState');

        component.ngDoCheck();

        expect(locationStub.replaceState).toHaveBeenCalledWith('/ontology-editor', `id=${encodeURIComponent(recordIRI)}`);
      });
      it('should not update URL when listItem has not changed', function () {
        const recordIRI = 'http://example.com/sameRecord';
        const listItem = new OntologyListItem();
        listItem.versionedRdfRecord.recordId = recordIRI;
        ontologyStateStub.listItem = listItem;
        locationStub.replaceState = jasmine.createSpy('replaceState');

        // First call to set previousRecordIRI
        component.ngDoCheck();
        expect(locationStub.replaceState).toHaveBeenCalledTimes(1);

        // Second call with same recordIRI
        component.ngDoCheck();
        expect(locationStub.replaceState).toHaveBeenCalledTimes(1);
      });
      it('should update URL when listItem changes to a different record', function () {
        const recordIRI1 = 'http://example.com/record1';
        const recordIRI2 = 'http://example.com/record2';
        const listItem1 = new OntologyListItem();
        listItem1.versionedRdfRecord.recordId = recordIRI1;
        const listItem2 = new OntologyListItem();
        listItem2.versionedRdfRecord.recordId = recordIRI2;
        locationStub.replaceState = jasmine.createSpy('replaceState');

        // First call with record1
        ontologyStateStub.listItem = listItem1;
        component.ngDoCheck();
        expect(locationStub.replaceState).toHaveBeenCalledWith('/ontology-editor', `id=${encodeURIComponent(recordIRI1)}`);

        // Second call with record2
        ontologyStateStub.listItem = listItem2;
        component.ngDoCheck();
        expect(locationStub.replaceState).toHaveBeenCalledWith('/ontology-editor', `id=${encodeURIComponent(recordIRI2)}`);
        expect(locationStub.replaceState).toHaveBeenCalledTimes(2);
      });
      it('should not update URL when listItem is undefined', function () {
        ontologyStateStub.listItem = undefined;
        locationStub.replaceState = jasmine.createSpy('replaceState');

        component.ngDoCheck();

        expect(locationStub.replaceState).not.toHaveBeenCalled();
      });
    });
  })
});
