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
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */
import { By } from '@angular/platform-browser';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { MockComponent, MockProvider } from 'ng-mocks';
import { of, Subject, throwError } from 'rxjs';

import { cleanStylesFromDOM } from '../../../../test/ts/Shared';
import { ConfirmModalComponent } from '../confirmModal/confirmModal.component';
import { ImportsOverlayComponent } from '../importsOverlay/importsOverlay.component';
import { InfoMessageComponent } from '../infoMessage/infoMessage.component';
import { OntologyListItem } from '../../models/ontologyListItem.class';
import { OntologyManagerService } from '../../services/ontologyManager.service';
import { OntologyRecordActionI } from '../../services/ontologyRecordAction.interface';
import { OntologyStateService } from '../../services/ontologyState.service';
import { OWL } from '../../../prefixes';
import { PropertyManagerService } from '../../services/propertyManager.service';
import { ToastService } from '../../services/toast.service';
import { VersionedRdfRecord } from '../../models/versionedRdfRecord.interface';
import { ImportsBlockComponent } from './importsBlock.component';

describe('Imports Block component', function() {
  let component: ImportsBlockComponent;
  let element: DebugElement;
  let fixture: ComponentFixture<ImportsBlockComponent>;
  let ontologyStateStub: jasmine.SpyObj<OntologyStateService>;
  let ontologyManagerStub: jasmine.SpyObj<OntologyManagerService>;
  let matDialog: jasmine.SpyObj<MatDialog>;
  let propertyManagerStub: jasmine.SpyObj<PropertyManagerService>;
  let toastStub: jasmine.SpyObj<ToastService>;
  let _ontologyRecordActionSubject: Subject<OntologyRecordActionI>;

  const error = 'Error Message';
  const ontologyId = 'ontologyId';
  const recordId = 'recordId';
  const branchId = 'branchId';
  const commitId = 'commitId';
  const url = 'http://test.com';
  const importId = {'@id': url};
  const versionedRdfRecord: VersionedRdfRecord = {
    title: 'title',
    recordId: recordId,
    commitId: commitId,
    branchId: branchId
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        MatDialogModule,
        MatButtonModule,
        MatIconModule,
        MatTooltipModule
      ],
      declarations: [
        ImportsBlockComponent,
        MockComponent(InfoMessageComponent),
        MockComponent(ConfirmModalComponent),
        MockComponent(ImportsOverlayComponent),
      ],
      providers: [
        MockProvider(OntologyManagerService),
        MockProvider(OntologyStateService),
        MockProvider(PropertyManagerService),
        MockProvider(ToastService),
        { provide: MatDialog, useFactory: () => jasmine.createSpyObj('MatDialog', {
          open: { afterClosed: () => of(true)}
        }) }
      ]
    }).compileComponents();

    ontologyStateStub = TestBed.inject(OntologyStateService) as jasmine.SpyObj<OntologyStateService>;
    _ontologyRecordActionSubject = new Subject<OntologyRecordActionI>();
    ontologyStateStub.ontologyRecordAction$ = _ontologyRecordActionSubject.asObservable();

    ontologyManagerStub = TestBed.inject(OntologyManagerService) as jasmine.SpyObj<OntologyManagerService>;
    propertyManagerStub = TestBed.inject(PropertyManagerService) as jasmine.SpyObj<PropertyManagerService>;
    toastStub = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;
    matDialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
    
    ontologyStateStub.listItem = new OntologyListItem();
    ontologyStateStub.listItem.versionedRdfRecord.recordId = recordId;
    ontologyStateStub.listItem.versionedRdfRecord.branchId = branchId;
    ontologyStateStub.listItem.versionedRdfRecord.commitId = commitId;
    ontologyStateStub.listItem.selected = {
      '@id': ontologyId,
      [`${OWL}imports`]: [importId]
    };
    fixture = TestBed.createComponent(ImportsBlockComponent);
    component = fixture.componentInstance;
    element = fixture.debugElement;
    component.canModify = true;
    component.versionedRdfRecord = versionedRdfRecord;
    component.stateService = ontologyStateStub;
    component.listItem = ontologyStateStub.listItem;
  });

  afterEach(function() {
    cleanStylesFromDOM();
    component = null;
    element = null;
    fixture = null;
    ontologyStateStub = null;
    ontologyManagerStub = null;
    propertyManagerStub = null;
    matDialog = null;
    toastStub = null;
  });

  it('should handle changes correctly', function() {
    spyOn(component, 'setImports');
    spyOn(component, 'setIndirectImports');
    component.ngOnChanges();
    expect(component.setImports).toHaveBeenCalledWith();
    expect(component.setIndirectImports).toHaveBeenCalledWith();
  });
  describe('controller methods', function() {
    describe('setupRemove should set the correct variables and open a remove confirmation modal if', function() {
      beforeEach(() => {
        spyOn(component, 'remove');
      });
      it('the ontology has changes', fakeAsync(function() {
        ontologyStateStub.hasChanges.and.returnValue(true);
        component.setupRemove(url);
        tick();
        expect(matDialog.open).toHaveBeenCalledWith(ConfirmModalComponent, {data: {content: jasmine.stringMatching('NOTE:')}});
        expect(component.remove).toHaveBeenCalledWith(url);
      }));
      it('the ontology does not have changes', fakeAsync(function() {
        ontologyStateStub.hasChanges.and.returnValue(false);
        component.setupRemove(url);
        tick();
        expect(matDialog.open).toHaveBeenCalledWith(ConfirmModalComponent, {data: {content: jasmine.stringMatching(/^((?!NOTE:).)*$/)}});
        expect(component.remove).toHaveBeenCalledWith(url);
      }));
    });
    describe('remove calls the proper functions', function() {
      beforeEach(function() {
        spyOn(component, 'setImports');
        spyOn(component, 'setIndirectImports');
      });
      describe('when save changes resolves', function() {
        beforeEach(function() {
          ontologyStateStub.saveCurrentChanges.and.returnValue(of(null));
        });
        it('when change version resolves', fakeAsync(function() {
          ontologyStateStub.changeVersion.and.returnValue(of(null));
          ontologyStateStub.isCommittable.and.returnValue(true);
          component.remove(url);
          tick();
          expect(ontologyStateStub.addToDeletions).toHaveBeenCalledWith(recordId, {
           '@id': ontologyId,
           [`${OWL}imports`]: [{ '@id': url }]
          });
          expect(propertyManagerStub.remove).toHaveBeenCalledWith(ontologyStateStub.listItem.selected, `${OWL}imports`, 0);
          expect(ontologyStateStub.saveCurrentChanges).toHaveBeenCalledWith(ontologyStateStub.listItem);
          expect(ontologyStateStub.changeVersion).toHaveBeenCalledWith(recordId, branchId, commitId, undefined, ontologyStateStub.listItem.currentVersionTitle, ontologyStateStub.listItem.upToDate, false, false);
          expect(component.setImports).toHaveBeenCalledWith();
          expect(component.setIndirectImports).toHaveBeenCalledWith();
        }));
        it('when change version rejects', fakeAsync(function() {
          ontologyStateStub.changeVersion.and.returnValue(throwError(error));
          component.remove(url);
          tick();
          expect(ontologyStateStub.addToDeletions).toHaveBeenCalledWith(recordId, {
           '@id': ontologyId,
           [`${OWL}imports`]: [{ '@id': url }]
          });
          expect(propertyManagerStub.remove).toHaveBeenCalledWith(ontologyStateStub.listItem.selected, `${OWL}imports`, 0);
          expect(ontologyStateStub.saveCurrentChanges).toHaveBeenCalledWith(ontologyStateStub.listItem);
          expect(ontologyStateStub.changeVersion).toHaveBeenCalledWith(recordId, branchId, commitId, undefined, ontologyStateStub.listItem.currentVersionTitle, ontologyStateStub.listItem.upToDate, false, false);
          expect(component.setImports).not.toHaveBeenCalled();
          expect(component.setIndirectImports).not.toHaveBeenCalled();
        }));
      });
      it('when save current changes rejects', fakeAsync(function() {
        ontologyStateStub.saveCurrentChanges.and.returnValue(throwError(error));
        component.remove(url);
        tick();
        expect(ontologyStateStub.addToDeletions).toHaveBeenCalledWith(recordId, {
         '@id': ontologyId,
         [`${OWL}imports`]: [{ '@id': url }]
        });
        expect(propertyManagerStub.remove).toHaveBeenCalledWith(ontologyStateStub.listItem.selected, `${OWL}imports`, 0);
        expect(ontologyStateStub.saveCurrentChanges).toHaveBeenCalledWith(ontologyStateStub.listItem);
        expect(ontologyStateStub.changeVersion).not.toHaveBeenCalled();
        expect(component.setImports).not.toHaveBeenCalled();
        expect(component.setIndirectImports).not.toHaveBeenCalled();
      }));
    });
    describe('failed should return the correct value when failedImports', function() {
      beforeEach(function() {
       ontologyStateStub.listItem.failedImports = [url];
      });
      it('includes the iri', function() {
        expect(component.failed(url)).toEqual(true);
      });
      it('does not include the iri', function() {
        expect(component.failed('missing')).toEqual(false);
      });
    });
    describe('refresh should call the correct function when clear cache is', function() {
      beforeEach(function() {
        spyOn(component, 'setImports');
        spyOn(component, 'setIndirectImports');
      });
      describe('resolved and change version is', function() {
        beforeEach(function() {
          ontologyManagerStub.clearCache.and.returnValue(of(null));
        });
        it('resolved', fakeAsync(function() {
          ontologyStateStub.changeVersion.and.returnValue(of(null));
          component.refresh();
          tick();
          expect(ontologyManagerStub.clearCache).toHaveBeenCalledWith(recordId, commitId);
          expect(ontologyStateStub.changeVersion).toHaveBeenCalledWith(recordId, branchId, commitId, undefined, ontologyStateStub.listItem.currentVersionTitle, ontologyStateStub.listItem.upToDate, false, false);
          expect(toastStub.createSuccessToast).toHaveBeenCalledWith(jasmine.any(String));
          expect(component.setImports).toHaveBeenCalledWith();
          expect(component.setIndirectImports).toHaveBeenCalledWith();
          expect(toastStub.createErrorToast).not.toHaveBeenCalled();
        }));
        it('rejected', fakeAsync(function() {
          ontologyStateStub.changeVersion.and.returnValue(throwError(error));
          component.refresh();
          tick();
          expect(ontologyManagerStub.clearCache).toHaveBeenCalledWith(recordId, commitId);
          expect(ontologyStateStub.changeVersion).toHaveBeenCalledWith(recordId, branchId, commitId, undefined, ontologyStateStub.listItem.currentVersionTitle, ontologyStateStub.listItem.upToDate, false, false);
          expect(toastStub.createSuccessToast).not.toHaveBeenCalled();
          expect(component.setImports).not.toHaveBeenCalled();
          expect(component.setIndirectImports).not.toHaveBeenCalled();
          expect(toastStub.createErrorToast).toHaveBeenCalledWith(error);
        }));
      });
      it('rejected', fakeAsync(function() {
        ontologyManagerStub.clearCache.and.returnValue(throwError(error));
        component.refresh();
        tick();
        expect(ontologyManagerStub.clearCache).toHaveBeenCalledWith(recordId, commitId);
        expect(ontologyStateStub.changeVersion).not.toHaveBeenCalled();
        expect(toastStub.createSuccessToast).not.toHaveBeenCalled();
        expect(component.setImports).not.toHaveBeenCalled();
        expect(component.setIndirectImports).not.toHaveBeenCalled();
        expect(toastStub.createErrorToast).toHaveBeenCalledWith(error);
      }));
    });
    it('setImports should set the value correctly', function() {
     ontologyStateStub.listItem.selected[`${OWL}imports`] = [importId, {'@id': 'http://banana.com'}];
      component.setImports();
      expect(component.imports).toEqual([{'@id': 'http://banana.com'}, importId]);
    });
    it('setIndirectImports should set the value correctly', function() {
     ontologyStateStub.listItem.importedOntologies = [{
        id: 'direct-version',
        ontologyId: url
      }, {
        id: 'indirect-b-version',
        ontologyId: 'indirect-b'
      }, {
        id: 'indirect-a',
        ontologyId: 'indirect-a'
      }];
      component.setIndirectImports();
      expect(component.indirectImports).toEqual(['indirect-a', 'indirect-b']);
    });
    it('should show the new import overlay', fakeAsync(function() {
      spyOn(component, 'setImports');
      spyOn(component, 'setIndirectImports');
      component.showNewOverlay();
      tick();
      expect(matDialog.open).toHaveBeenCalledWith(ImportsOverlayComponent, {data: {
        stateService: component.stateService,
        listItem: component.listItem,
        targetRecordTypes: component.targetRecordTypes
      }});
      expect(component.setImports).toHaveBeenCalledWith();
      expect(component.setIndirectImports).toHaveBeenCalledWith();
    }));
  });
  describe('contains the correct html', function() {
    it('for wrapping containers', function() {
      expect(element.queryAll(By.css('.imports-block')).length).toEqual(1);
    });
    it('with a .section-header', function() {
      expect(element.queryAll(By.css('.section-header')).length).toEqual(1);
    });
    it('with links for adding and refreshing when the user can modify branch', function() {
      component.canModify = true;
      fixture.detectChanges();
      expect(element.queryAll(By.css('.section-header a')).length).toEqual(2);
    });
    it('with links for adding and refreshing when the user cannot modify branch', function() {
      component.canModify = false;
      fixture.detectChanges();
      expect(element.queryAll(By.css('.section-header a')).length).toEqual(1);
    });
    it('with a p a.import-iri', function() {
      component.imports = [importId];
      fixture.detectChanges();
      expect(element.queryAll(By.css('p a.import-iri')).length).toEqual(1);
      spyOn(component, 'failed').and.returnValue(true);
      fixture.detectChanges();
      expect(element.queryAll(By.css('p a.import-iri')).length).toEqual(0);
    });
    it('with a .text-danger', function() {
      component.imports = [importId];
      fixture.detectChanges();
      expect(element.queryAll(By.css('.text-danger')).length).toEqual(0);
      spyOn(component, 'failed').and.returnValue(true);
      fixture.detectChanges();
      expect(element.queryAll(By.css('.text-danger')).length).toEqual(2);
    });
    it('with a p a[title="Delete"] if the user can modify', function() {
      component.imports = [importId];
      fixture.detectChanges();
      expect(element.queryAll(By.css('p a[title="Delete"]')).length).toEqual(1);
    });
    it('with no p a.btn-link if the user cannot modify', function() {
      component.canModify = false;
      fixture.detectChanges();
      expect(element.queryAll(By.css('p a.btn-link')).length).toEqual(0);
    });
    it('depending on the length of the selected ontology imports', function() {
      component.ngOnChanges();
      fixture.detectChanges();
      expect(element.queryAll(By.css('info-message')).length).toEqual(0);
      expect(element.queryAll(By.css('.import')).length).toEqual(1);
      component.imports = [];
      fixture.detectChanges();
      expect(element.queryAll(By.css('info-message')).length).toEqual(1);
      expect(element.queryAll(By.css('.import')).length).toEqual(0);
    });
    it('with an .indirect-import-container', function() {
      fixture.detectChanges();
      expect(element.queryAll(By.css('.indirect-import-container')).length).toEqual(0);
      component.indirectImports = ['iri'];
      fixture.detectChanges();
      expect(element.queryAll(By.css('.indirect-import-container')).length).toEqual(1);
    });
    it('with an .indirect.import', function() {
      fixture.detectChanges();
      expect(element.queryAll(By.css('.indirect.import')).length).toEqual(0);
      component.indirectImports = ['iri'];
      fixture.detectChanges();
      expect(element.queryAll(By.css('.indirect.import')).length).toEqual(1);
    });
  });
});
