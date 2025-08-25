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
import { By } from '@angular/platform-browser';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { MockComponent, MockProvider, MockPipe } from 'ng-mocks';
import { of, throwError } from 'rxjs';

import { cleanStylesFromDOM } from '../../../../test/ts/Shared';
import { IndividualTypesModalComponent } from '../../../ontology-editor/components/individualTypesModal/individualTypesModal.component';
import { ManchesterConverterService } from '../../services/manchesterConverter.service';
import { OntologyStateService } from '../../services/ontologyState.service';
import { PrefixationPipe } from '../../pipes/prefixation.pipe';
import { SelectedDetailsComponent } from './selectedDetails.component';
import { StaticIriComponent } from '../staticIri/staticIri.component';
import { ToastService } from '../../services/toast.service';

describe('Selected Details component', function () {
  let component: SelectedDetailsComponent;
  let element: DebugElement;
  let fixture: ComponentFixture<SelectedDetailsComponent>;
  let matDialog: jasmine.SpyObj<MatDialog>;
  let ontologyStateStub: jasmine.SpyObj<OntologyStateService>;
  let prefixationStub: jasmine.SpyObj<PrefixationPipe>;
  let toastStub: jasmine.SpyObj<ToastService>;

  const iri = 'iri';
  const mockEntity = Object.freeze({
    '@id': iri,
    '@type': ['type1', 'type2']
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        MatDialogModule,
        MatIconModule,
        MatMenuModule
      ],
      declarations: [
        SelectedDetailsComponent,
        MockComponent(StaticIriComponent),
        MockComponent(IndividualTypesModalComponent)
      ],
      providers: [
        MockProvider(OntologyStateService),
        { provide: PrefixationPipe, useClass: MockPipe(PrefixationPipe) },
        MockProvider(ManchesterConverterService),
        MockProvider(ToastService),
        {
          provide: MatDialog, useFactory: () => jasmine.createSpyObj('MatDialog', {
            open: { afterClosed: () => of(true) }
          })
        }
      ]
    }).compileComponents();
    matDialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
    toastStub = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;
    ontologyStateStub = TestBed.inject(OntologyStateService) as jasmine.SpyObj<OntologyStateService>;
    ontologyStateStub.canModifyEntityTypes.and.returnValue(true);
    prefixationStub = TestBed.inject(PrefixationPipe) as jasmine.SpyObj<PrefixationPipe>;
    prefixationStub.transform.and.callFake(a => a);

    fixture = TestBed.createComponent(SelectedDetailsComponent);
    component = fixture.componentInstance;
    element = fixture.debugElement;

    component.stateService = ontologyStateStub;
    component.entity = mockEntity;
    component.importedSource = 'External Source';
    component.isImported = true;
    component.entityHasTypes = true;
    component.canModifyTypes = true;
  });

  afterEach(function () {
    cleanStylesFromDOM();
    component = null;
    element = null;
    fixture = null;
    ontologyStateStub = null;
    matDialog = null;
    toastStub = null;
  });

  it('should set computed values in ngOnChanges', () => {
    spyOn(component, 'getImportedSource').and.returnValue('ImportedSource');
    component.ngOnChanges();
    expect(component.isImported).toEqual(true);
    expect(component.importedSource).toEqual('ImportedSource');
    expect(component.entityHasTypes).toEqual(true);
    expect(component.canModifyTypes).toEqual(false);
  });
  describe('controller methods', function () {
    it('getImportedSource functions properly', function () {
      ontologyStateStub.getImportedSource.and.returnValue('sourceIri');
      expect(component.getImportedSource()).toEqual('sourceIri');
    });
    it('getTypes functions properly', function () {
      ontologyStateStub.getTypesLabel.and.returnValue('test, test2');
      expect(component.getTypes()).toEqual('test, test2');
    });
    describe('onEdit calls the proper functions', function () {
      beforeEach(function () {
        ontologyStateStub.saveCurrentChanges.and.returnValue(of(null));
      });
      it('when stateService.onEdit resolves', fakeAsync(function () {
        ontologyStateStub.onIriEdit.and.returnValue(of(null));
        component.onEdit('begin', 'middle', 'end');
        tick();
        expect(component.stateService.onIriEdit).toHaveBeenCalledWith('begin', 'middle', 'end');
        expect(component.stateService.saveCurrentChanges).toHaveBeenCalledWith();
        expect(component.stateService.updateLabel).toHaveBeenCalledWith();
        expect(toastStub.createErrorToast).not.toHaveBeenCalled();
      }));
      it('when stateService.onEdit rejects', fakeAsync(function () {
        ontologyStateStub.onIriEdit.and.returnValue(throwError('error'));
        component.onEdit('begin', 'middle', 'end');
        tick();
        expect(component.stateService.onIriEdit).toHaveBeenCalledWith('begin', 'middle', 'end');
        expect(component.stateService.saveCurrentChanges).not.toHaveBeenCalled();
        expect(component.stateService.updateLabel).not.toHaveBeenCalled();
        expect(toastStub.createErrorToast).toHaveBeenCalledWith('error');
      }));
    });
    it('should open the individual types modal', function () {
      component.showTypesOverlay();
      expect(matDialog.open).toHaveBeenCalledWith(IndividualTypesModalComponent);
    });
  });
  describe('contains the correct html', function () {
    it('for wrapping containers', function () {
      expect(element.queryAll(By.css('.selected-details')).length).toEqual(1);
      expect(element.queryAll(By.css('.warning-icon-holder')).length).toEqual(0);
      expect(element.queryAll(By.css('.warning-icon')).length).toEqual(0);
    });
    it('depending on whether something is selected', function () {
      fixture.detectChanges();
      expect(element.queryAll(By.css('.selected-heading')).length).toEqual(1);
      expect(element.queryAll(By.css('static-iri')).length).toEqual(1);

      component.entity = undefined;
      component.ngOnChanges();
      fixture.detectChanges();
      expect(element.queryAll(By.css('.selected-heading')).length).toEqual(0);
      expect(element.queryAll(By.css('static-iri')).length).toEqual(0);
    });
    it('depending on whether the selected entity has types', function () {
      component.entity = {
        '@id': 'iri',
        '@type': []
      };
      component.isImported = false;
      component.ngOnChanges();
      fixture.detectChanges();
      expect(element.queryAll(By.css('.entity-types')).length).toEqual(0);

       component.entity = {
        '@id': 'iri',
        '@type': ['type1']
      };
      component.readOnly = false;
      component.isImported = false;
      component.canModify = true;
      component.isImported = true;
      component.ngOnChanges();
      fixture.detectChanges();
      expect(element.queryAll(By.css('.entity-types')).length).toEqual(1);
    });
    it('depending on whether the details should be read only', function () {
      ontologyStateStub.canModifyEntityTypes.and.returnValue(true);
      component.readOnly = false;
      component.isImported = false;
      component.canModify = true;
      component.ngOnChanges();
      fixture.detectChanges();
      expect(element.queryAll(By.css('static-iri')).length).toEqual(1);
      expect(element.queryAll(By.css('a')).length).toEqual(1);

      component.readOnly = true;
      component.ngOnChanges();
      fixture.detectChanges();
      expect(element.queryAll(By.css('static-iri')).length).toEqual(1);
      expect(element.queryAll(By.css('a')).length).toEqual(0);
    });
    it('depending on whether the entity is an individual', function () {
      ontologyStateStub.canModifyEntityTypes.and.returnValue(false);
      component.ngOnChanges();
      fixture.detectChanges();
      expect(element.queryAll(By.css('a')).length).toEqual(0);

      component.readOnly = false;
      component.isImported = false;
      component.canModify = true;
      ontologyStateStub.canModifyEntityTypes.and.returnValue(true);
      component.ngOnChanges();
      fixture.detectChanges();
      expect(element.queryAll(By.css('a')).length).toEqual(1);
    });
    it('when selected imported is true', function () {
      component.isImported = true;
      ontologyStateStub.getImportedSource.and.returnValue('ont1');
      component.ngOnChanges();
      fixture.detectChanges();
      expect(element.queryAll(By.css('.is-imported-ontology')).length).toEqual(1);
      expect(element.queryAll(By.css('.imported-ontology'))[0].nativeElement.textContent.trim()).toEqual('ont1');

      component.isImported = false;
      component.ngOnChanges();
      fixture.detectChanges();
      expect(element.queryAll(By.css('.is-imported-ontology')).length).toEqual(0);
    });
    it('when there is a warning message', function () {
      component.warningText = '<p>Example Text</p>';
      component.ngOnChanges();
      fixture.detectChanges();
      expect(element.queryAll(By.css('.selected-heading')).length).toEqual(1);
      expect(element.queryAll(By.css('static-iri')).length).toEqual(1);
      expect(element.queryAll(By.css('.warning-icon-holder')).length).toEqual(1);
      expect(element.queryAll(By.css('.warning-icon')).length).toEqual(1);
    });
  });
});