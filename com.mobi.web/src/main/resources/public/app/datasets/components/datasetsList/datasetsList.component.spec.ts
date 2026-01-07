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
import { DebugElement } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MockComponent, MockDirective, MockPipe, MockProvider } from 'ng-mocks';
import { of, throwError } from 'rxjs';

import {
  cleanStylesFromDOM, DATE_STR, SHORT_DATE_STR,
} from '../../../../../public/test/ts/Shared';
import { CATALOG, DATASET, DCTERMS, POLICY } from '../../../prefixes';
import { ConfirmModalComponent } from '../../../shared/components/confirmModal/confirmModal.component';
import { InfoMessageComponent } from '../../../shared/components/infoMessage/infoMessage.component';
import { ProgressSpinnerService } from '../../../shared/components/progress-spinner/services/progressSpinner.service';
import { SearchBarComponent } from '../../../shared/components/searchBar/searchBar.component';
import { CopyClipboardDirective } from '../../../shared/directives/copyClipboard/copyClipboard.directive';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { HighlightTextPipe } from '../../../shared/pipes/highlightText.pipe';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { DatasetManagerService } from '../../../shared/services/datasetManager.service';
import { DatasetStateService } from '../../../shared/services/datasetState.service';
import { PolicyEnforcementService } from '../../../shared/services/policyEnforcement.service';
import { RepositoryManagerService } from '../../../shared/services/repositoryManager.service';
import { ToastService } from '../../../shared/services/toast.service';
import { DatasetsOntologyPickerComponent } from '../datasetsOntologyPicker/datasetsOntologyPicker.component';
import { EditDatasetOverlayComponent } from '../editDatasetOverlay/editDatasetOverlay.component';
import { NewDatasetOverlayComponent } from '../newDatasetOverlay/newDatasetOverlay.component';
import { UploadDataOverlayComponent } from '../uploadDataOverlay/uploadDataOverlay.component';
import { DatasetsListComponent } from './datasetsList.component';

describe('Datasets List component', function () {
  let component: DatasetsListComponent;
  let element: DebugElement;
  let fixture: ComponentFixture<DatasetsListComponent>;
  let datasetManagerStub: jasmine.SpyObj<DatasetManagerService>;
  let datasetStateStub: jasmine.SpyObj<DatasetStateService>;
  let catalogManagerStub: jasmine.SpyObj<CatalogManagerService>;
  let policyEnforcementStub: jasmine.SpyObj<PolicyEnforcementService>;
  let toastStub: jasmine.SpyObj<ToastService>;
  let repositoryManagerStub: jasmine.SpyObj<RepositoryManagerService>;
  let matDialog: jasmine.SpyObj<MatDialog>;

  const catalogId = 'catalogId';
  const recordId = 'recordId';
  const record: JSONLDObject = {
    '@id': recordId,
    [`${DCTERMS}title`]: [{ '@value': 'title' }],
    [`${DCTERMS}description`]: [{ '@value': 'description' }],
    [`${DCTERMS}modified`]: [{ '@value': DATE_STR }],
    [`${DATASET}dataset`]: [{ '@id': 'datasetIRI' }],
    [`${DATASET}repository`]: [{ '@value': 'repositoryId' }],
  };
  const dataset = { record, identifiers: [] };
  const displayItem = {
    title: 'title',
    datasetIRI: 'datasetIRI',
    description: 'description',
    modified: SHORT_DATE_STR,
    ontologies: ['ont 1', 'ont2'],
    repositoryId: 'repo',
    dataset
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        FormsModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatTooltipModule,
        MatMenuModule,
        MatPaginatorModule,
        MatDividerModule,
        MatIconModule
      ],
      declarations: [
        DatasetsListComponent,
        MockComponent(DatasetsOntologyPickerComponent),
        MockComponent(EditDatasetOverlayComponent),
        MockComponent(UploadDataOverlayComponent),
        MockComponent(NewDatasetOverlayComponent),
        MockComponent(InfoMessageComponent),
        MockComponent(SearchBarComponent),
        MockDirective(CopyClipboardDirective),
        MockPipe(HighlightTextPipe)
      ],
      providers: [
        MockProvider(DatasetManagerService),
        MockProvider(DatasetStateService),
        MockProvider(CatalogManagerService),
        MockProvider(ProgressSpinnerService),
        MockProvider(PolicyEnforcementService),
        MockProvider(ToastService),
        MockProvider(RepositoryManagerService),
        {
          provide: MatDialog, useFactory: () => jasmine.createSpyObj('MatDialog', {
            open: { afterClosed: () => of(true) }
          })
        }
      ]
    }).compileComponents();

    repositoryManagerStub = TestBed.inject(RepositoryManagerService) as jasmine.SpyObj<RepositoryManagerService>;
    repositoryManagerStub.getRepositories.and.returnValue(of([]));
    fixture = TestBed.createComponent(DatasetsListComponent);
    component = fixture.componentInstance;
    element = fixture.debugElement;
    datasetManagerStub = TestBed.inject(DatasetManagerService) as jasmine.SpyObj<DatasetManagerService>;
    datasetStateStub = TestBed.inject(DatasetStateService) as jasmine.SpyObj<DatasetStateService>;
    catalogManagerStub = TestBed.inject(CatalogManagerService) as jasmine.SpyObj<CatalogManagerService>;
    policyEnforcementStub = TestBed.inject(PolicyEnforcementService) as jasmine.SpyObj<PolicyEnforcementService>;
    toastStub = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;
    matDialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;

    catalogManagerStub.localCatalog = { '@id': catalogId };
    datasetStateStub.paginationConfig = {
      limit: 10,
      pageIndex: 0,
      searchText: '',
      sortOption: {
        field: `${DCTERMS}title`,
        label: 'Title',
        asc: true
      }
    };
    policyEnforcementStub.evaluateRequest.and.returnValue(of('Permit'));
  });

  afterEach(function () {
    cleanStylesFromDOM();
    component = null;
    element = null;
    fixture = null;
    datasetStateStub = null;
    datasetManagerStub = null;
    catalogManagerStub = null;
    policyEnforcementStub = null;
    toastStub = null;
    matDialog = null;
  });

  it('should initialize properly', function () {
    datasetStateStub.paginationConfig.searchText = 'test';
    spyOn(component, 'setResults');
    component.ngOnInit();
    expect(component.catalogId).toEqual(catalogId);
    expect(component.setResults).toHaveBeenCalledWith();
    expect(component.searchText).toEqual('test');
    expect(datasetStateStub.submittedSearch).toBeTrue();
  });
  describe('controller methods', function () {
    it('should initialize the component properly', function () {
      datasetStateStub.paginationConfig.searchText = 'test';
      spyOn(component, 'setResults');
      component.ngOnInit();
      expect(component.catalogId).toEqual(catalogId);
      expect(component.setResults).toHaveBeenCalledWith();
      expect(datasetStateStub.submittedSearch).toEqual(true);
    });
    it('should retrieve the list of identified ontologies for a dataset', function () {
      const ontologyId = 'ontologyId';
      const dataset = {
        record,
        identifiers: [{ '@id': 'bnode', [`${DATASET}linksToRecord`]: [{ '@id': ontologyId }] }]
      };
      expect(component.getIdentifiedOntologyIds(dataset)).toEqual([ontologyId]);
    });
    it('should get the title of a record', function () {
      expect(component.getRecordTitle(record)).toEqual('title');
    });
    describe('should set cached ontology titles', function () {
      it('unless there are no ontologies set on the datasets', fakeAsync(function () {
        spyOn(component, 'getIdentifiedOntologyIds').and.returnValue([]);
        component.setCachedOntologyTitles([dataset]).subscribe(() => {
          expect(component.getIdentifiedOntologyIds).toHaveBeenCalledWith(dataset);
          expect(component.cachedOntologyTitles).toEqual({});
          expect(catalogManagerStub.getRecord).not.toHaveBeenCalled();
        });
        tick();
      }));
      it('unless all ontologies set on the datasets have already been cached', fakeAsync(function () {
        spyOn(component, 'getIdentifiedOntologyIds').and.returnValue(['ontologyId']);
        component.cachedOntologyTitles = { 'ontologyId': 'Ontology' };
        component.setCachedOntologyTitles([dataset]).subscribe(() => {
          expect(component.getIdentifiedOntologyIds).toHaveBeenCalledWith(dataset);
          expect(component.cachedOntologyTitles).toEqual({ 'ontologyId': 'Ontology' });
          expect(catalogManagerStub.getRecord).not.toHaveBeenCalled();
        });
        tick();
      }));
      it('even if some ontologies don\'t exist anymore', fakeAsync(function () {
        const ontologyRecord = { '@id': 'ontologyId1' };
        spyOn(component, 'getIdentifiedOntologyIds').and.returnValue(['ontologyId1', 'ontologyId2']);
        catalogManagerStub.getRecord.and.callFake((id) => {
          if (id === 'ontologyId1') {
            return of([ontologyRecord]);
          } else {
            return throwError('Error');
          }
        });
        spyOn(component, 'getRecordTitle').and.returnValue('Ontology');
        component.catalogId = catalogId;
        component.setCachedOntologyTitles([dataset]).subscribe(() => {
          expect(component.getIdentifiedOntologyIds).toHaveBeenCalledWith(dataset);
          expect(component.cachedOntologyTitles).toEqual({
            'ontologyId1': 'Ontology',
            'ontologyId2': '(Ontology not found)'
          });
          expect(catalogManagerStub.getRecord).toHaveBeenCalledWith('ontologyId1', catalogId);
          expect(catalogManagerStub.getRecord).toHaveBeenCalledWith('ontologyId2', catalogId);
          expect(component.getRecordTitle).toHaveBeenCalledWith(ontologyRecord);
        });
        tick();
      }));
    });
    it('should get the specified page of dataset records', function () {
      spyOn(component, 'setResults');
      const event = new PageEvent();
      event.pageIndex = 10;
      component.getPage(event);
      expect(datasetStateStub.paginationConfig.pageIndex).toBe(10);
      expect(component.setResults).toHaveBeenCalledWith();
    });
    describe('should delete a dataset', function () {
      beforeEach(function () {
        spyOn(component, 'setResults');
      });
      it('unless an error occurs', fakeAsync(function () {
        datasetManagerStub.deleteDatasetRecord.and.callFake(() => throwError('Error Message'));
        component.delete(dataset);
        tick();
        expect(datasetManagerStub.deleteDatasetRecord).toHaveBeenCalledWith(recordId);
        expect(toastStub.createSuccessToast).not.toHaveBeenCalled();
        expect(datasetStateStub.resetPagination).not.toHaveBeenCalledWith();
        expect(datasetStateStub.setResults).not.toHaveBeenCalledWith();
        expect(toastStub.createErrorToast).toHaveBeenCalledWith('Error Message');
      }));
      describe('successfully', function () {
        beforeEach(function () {
          datasetStateStub.paginationConfig.pageIndex = 1;
          datasetManagerStub.deleteDatasetRecord.and.returnValue(of(null));
        });
        it('if there is only one result on the current page', fakeAsync(function () {
          component.results = [displayItem];
          component.delete(dataset);
          tick();
          expect(datasetManagerStub.deleteDatasetRecord).toHaveBeenCalledWith(recordId);
          expect(toastStub.createSuccessToast).toHaveBeenCalledWith(jasmine.any(String));
          expect(datasetStateStub.paginationConfig.pageIndex).toBe(0);
          expect(component.setResults).toHaveBeenCalledWith();
          expect(datasetStateStub.submittedSearch).toEqual(!!datasetStateStub.paginationConfig.searchText);
          expect(toastStub.createErrorToast).not.toHaveBeenCalled();
        }));
        it('if there is more than one result on the current page', fakeAsync(function () {
          component.results = [displayItem, {
            title: '',
            description: '',
            datasetIRI: '',
            repositoryId: '',
            ontologies: [],
            modified: '',
            dataset
          }];
          component.delete(dataset);
          tick();
          expect(datasetManagerStub.deleteDatasetRecord).toHaveBeenCalledWith(recordId);
          expect(toastStub.createSuccessToast).toHaveBeenCalledWith(jasmine.any(String));
          expect(datasetStateStub.paginationConfig.pageIndex).toBe(1);
          expect(component.setResults).toHaveBeenCalledWith();
          expect(datasetStateStub.submittedSearch).toEqual(!!datasetStateStub.paginationConfig.searchText);
          expect(toastStub.createErrorToast).not.toHaveBeenCalled();
        }));
        it('if there are no results on the current page', fakeAsync(function () {
          component.delete(dataset);
          tick();
          expect(datasetManagerStub.deleteDatasetRecord).toHaveBeenCalledWith(recordId);
          expect(toastStub.createSuccessToast).toHaveBeenCalledWith(jasmine.any(String));
          expect(datasetStateStub.paginationConfig.pageIndex).toBe(1);
          expect(component.setResults).toHaveBeenCalledWith();
          expect(datasetStateStub.submittedSearch).toEqual(!!datasetStateStub.paginationConfig.searchText);
          expect(toastStub.createErrorToast).not.toHaveBeenCalled();
        }));
        it('if the current page is the first one', fakeAsync(function () {
          datasetStateStub.paginationConfig.pageIndex = 0;
          component.results = [displayItem];
          component.delete(dataset);
          tick();
          expect(datasetManagerStub.deleteDatasetRecord).toHaveBeenCalledWith(recordId);
          expect(toastStub.createSuccessToast).toHaveBeenCalledWith(jasmine.any(String));
          expect(datasetStateStub.paginationConfig.pageIndex).toBe(0);
          expect(component.setResults).toHaveBeenCalledWith();
          expect(datasetStateStub.submittedSearch).toEqual(!!datasetStateStub.paginationConfig.searchText);
          expect(toastStub.createErrorToast).not.toHaveBeenCalled();
        }));
      });
    });
    it('should set the dataset results', fakeAsync(function () {
      spyOn(component, 'setCachedOntologyTitles').and.returnValue(of(null));
      spyOn(component, 'getIdentifiedOntologyIds').and.returnValue(['id']);
      component.cachedOntologyTitles = { 'id': 'Ontology' };
      datasetStateStub.setResults.and.returnValue(of([dataset]));
      component.setResults();
      tick();
      expect(datasetStateStub.setResults).toHaveBeenCalledWith();
      expect(component.setCachedOntologyTitles).toHaveBeenCalledWith([dataset]);
      expect(component.results).toEqual([{
        title: 'title',
        description: 'description',
        datasetIRI: 'datasetIRI',
        modified: SHORT_DATE_STR,
        repositoryId: 'repositoryId',
        ontologies: ['Ontology'],
        dataset
      }]);
    }));
    describe('should clear a dataset', function () {
      it('unless an error occurs', fakeAsync(function () {
        datasetManagerStub.clearDatasetRecord.and.callFake(() => throwError('Error Message'));
        component.clear(dataset);
        tick();
        expect(datasetManagerStub.clearDatasetRecord).toHaveBeenCalledWith(recordId);
        expect(toastStub.createSuccessToast).not.toHaveBeenCalled();
        expect(toastStub.createErrorToast).toHaveBeenCalledWith('Error Message');
      }));
      it('successfully', fakeAsync(function () {
        datasetManagerStub.clearDatasetRecord.and.returnValue(of(null));
        component.clear(dataset);
        tick();
        expect(datasetManagerStub.clearDatasetRecord).toHaveBeenCalledWith(recordId);
        expect(toastStub.createSuccessToast).toHaveBeenCalledWith(jasmine.any(String));
        expect(toastStub.createErrorToast).not.toHaveBeenCalled();
      }));
    });
    it('should show the newDatasetOverlay', fakeAsync(function () {
      spyOn(component, 'setResults');
      component.showNew();
      tick();
      expect(matDialog.open).toHaveBeenCalledWith(NewDatasetOverlayComponent);
      expect(component.setResults).toHaveBeenCalledWith();
    }));
    it('should show the editDatasetOverlay', fakeAsync(function () {
      spyOn(component, 'setResults');
      component.showEdit(dataset);
      tick();
      expect(policyEnforcementStub.evaluateRequest).toHaveBeenCalledWith({
        resourceId: dataset.record['@id'],
        actionId: `${POLICY}Update`
      });
      expect(datasetStateStub.selectedDataset).toEqual(dataset);
      expect(matDialog.open).toHaveBeenCalledWith(EditDatasetOverlayComponent);
      expect(component.setResults).toHaveBeenCalledWith();
    }));
    it('should show the uploadDataOverlay', fakeAsync(function () {
      component.showUploadData(dataset);
      tick();
      expect(policyEnforcementStub.evaluateRequest).toHaveBeenCalledWith({
        resourceId: dataset.record['@id'],
        actionId: `${CATALOG}Modify`
      });
      expect(datasetStateStub.selectedDataset).toEqual(dataset);
      expect(matDialog.open).toHaveBeenCalledWith(UploadDataOverlayComponent);
    }));
    it('should confirm deleting a dataset', fakeAsync(function () {
      spyOn(component, 'delete');
      component.showDelete(dataset);
      tick();
      expect(policyEnforcementStub.evaluateRequest).toHaveBeenCalledWith({
        resourceId: dataset.record['@id'],
        actionId: `${POLICY}Delete`
      });
      expect(matDialog.open).toHaveBeenCalledWith(ConfirmModalComponent, { data: { content: jasmine.stringMatching('Are you sure you want to delete') } });
      expect(component.delete).toHaveBeenCalledWith(dataset);
    }));
    it('should confirm clearing a dataset', fakeAsync(function () {
      spyOn(component, 'clear');
      component.showClear(dataset);
      tick();
      expect(policyEnforcementStub.evaluateRequest).toHaveBeenCalledWith({
        resourceId: dataset.record['@id'],
        actionId: `${CATALOG}Modify`
      });
      expect(matDialog.open).toHaveBeenCalledWith(ConfirmModalComponent, { data: { content: jasmine.stringMatching('Are you sure you want to clear') } });
      expect(component.clear).toHaveBeenCalledWith(dataset);
    }));
    it('should execute a search on the records', function () {
      component.searchText = 'test';
      spyOn(component, 'setResults');
      component.searchRecords();
      expect(datasetStateStub.resetPagination).toHaveBeenCalledWith();
      expect(datasetStateStub.paginationConfig.searchText).toEqual('test');
      expect(component.setResults).toHaveBeenCalledWith();
      expect(datasetStateStub.submittedSearch).toBeTrue();
    });
  });
  describe('replaces the element with the correct html', function () {
    beforeEach(function () {
      datasetStateStub.setResults.and.returnValue(of([]));
      spyOn(component, 'setCachedOntologyTitles').and.returnValue(of(null));
    });
    it('for wrapping containers', function () {
      expect(element.queryAll(By.css('.datasets-list')).length).toEqual(1);
    });
    ['search-bar', 'mat-paginator', 'button.new-button'].forEach(test => {
      it('with a ' + test, function () {
        expect(element.queryAll(By.css(test)).length).toBe(1);
      });
    });
    it('depending on how many datasets there are', function () {
      fixture.detectChanges();
      expect(element.queryAll(By.css('.results-list info-message')).length).toBe(1);
      expect(element.queryAll(By.css('.results-list .dataset')).length).toBe(0);
      expect(element.queryAll(By.css('.results-list .menu-button')).length).toBe(0);

      component.results = [displayItem];
      fixture.detectChanges();
      expect(element.queryAll(By.css('.results-list info-message')).length).toBe(0);
      expect(element.queryAll(By.css('.results-list .dataset')).length).toBe(1);
      expect(element.queryAll(By.css('.results-list .menu-button')).length).toBe(1);
    });
    it('depending on whether a search has been submitted', function () {
      fixture.detectChanges();
      expect(element.queryAll(By.css('.results-list info-message.no-results')).length).toBe(1);
      expect(element.queryAll(By.css('.results-list info-message.no-match')).length).toBe(0);

      datasetStateStub.submittedSearch = true;
      fixture.detectChanges();
      expect(element.queryAll(By.css('.results-list info-message.no-results')).length).toBe(0);
      expect(element.queryAll(By.css('.results-list info-message.no-match')).length).toBe(1);
    });
    describe('with button to create a new dataset', function () {
      it('when user can create', function () {
        const buttons = element.queryAll(By.css('.search-form button'));
        expect(buttons.length).toEqual(1);
        expect(buttons[0].nativeElement.disabled).toBeFalse();
        expect(buttons[0].nativeElement.textContent.trim()).toEqual('New Dataset');
      });
      it('when user cannot create', function () {
        component.canCreate = false;
        fixture.detectChanges();
        const buttons = element.queryAll(By.css('.search-form button'));
        expect(buttons.length).toEqual(1);
        expect(buttons[0].nativeElement.disabled).toBeTrue();
        expect(buttons[0].nativeElement.textContent.trim()).toEqual('New Dataset');
      });
    });
  });
  it('should call showNew when the button is clicked', function () {
    spyOn(component, 'showNew');
    const button = element.queryAll(By.css('button.new-button'))[0];
    button.triggerEventHandler('click', null);
    expect(component.showNew).toHaveBeenCalledWith();
  });
  describe('menu button', function () {
    beforeEach(function () {
      spyOn(component, 'setResults');
      component.results = [displayItem];
      fixture.detectChanges();
      const menuButton = element.queryAll(By.css('button.menu-button'))[0];
      menuButton.triggerEventHandler('click', null);
    });
    it('should call showUploadData', function () {
      spyOn(component, 'showUploadData');
      const button = element.queryAll(By.css('.mat-menu-panel button.upload-data'))[0];
      button.triggerEventHandler('click', null);
      expect(component.showUploadData).toHaveBeenCalledWith(dataset);
    });
    it('should call showDelete', function () {
      spyOn(component, 'showDelete');
      const button = element.queryAll(By.css('.mat-menu-panel button.delete-dataset'))[0];
      button.triggerEventHandler('click', null);
      expect(component.showDelete).toHaveBeenCalledWith(dataset);
    });
    it('should call showClear', function () {
      spyOn(component, 'showClear');
      const button = element.queryAll(By.css('.mat-menu-panel button.clear-dataset'))[0];
      button.triggerEventHandler('click', null);
      expect(component.showClear).toHaveBeenCalledWith(dataset);
    });
    it('should call showEdit', function () {
      spyOn(component, 'showEdit');
      const button = element.queryAll(By.css('.mat-menu-panel button.update-dataset'))[0];
      button.triggerEventHandler('click', null);
      expect(component.showEdit).toHaveBeenCalledWith(dataset);
    });
  });
});
