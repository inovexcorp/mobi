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
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { MockComponent, MockPipe, MockProvider } from 'ng-mocks';
import { of } from 'rxjs';

import { CamelCasePipe } from '../../../shared/pipes/camelCase.pipe';
import { cleanStylesFromDOM } from '../../../../test/ts/Shared';
import { CreateIndividualOverlayComponent } from './createIndividualOverlay.component';
import { DCTERMS, OWL, RDFS } from '../../../prefixes';
import { ErrorDisplayComponent } from '../../../shared/components/errorDisplay/errorDisplay.component';
import { OntologyClassSelectComponent } from '../ontologyClassSelect/ontologyClassSelect.component';
import { OntologyListItem } from '../../../shared/models/ontologyListItem.class';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { StaticIriComponent } from '../../../shared/components/staticIri/staticIri.component';
import { SettingManagerService } from '../../../shared/services/settingManager.service';

describe('Create Individual Overlay component', function () {
  let component: CreateIndividualOverlayComponent;
  let element: DebugElement;
  let fixture: ComponentFixture<CreateIndividualOverlayComponent>;
  let matDialogRef: jasmine.SpyObj<MatDialogRef<CreateIndividualOverlayComponent>>;
  let ontologyStateStub: jasmine.SpyObj<OntologyStateService>;
  let settingManagerStub: jasmine.SpyObj<SettingManagerService>;
  let camelCaseStub: jasmine.SpyObj<CamelCasePipe>;

  const namespace = 'http://test.com#';

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        ReactiveFormsModule,
        FormsModule,
        MatInputModule,
        MatFormFieldModule,
        MatDialogModule,
        MatButtonModule,
        MatIconModule
      ],
      declarations: [
        CreateIndividualOverlayComponent,
        MockComponent(ErrorDisplayComponent),
        MockComponent(StaticIriComponent),
        MockComponent(OntologyClassSelectComponent),
      ],
      providers: [
        MockProvider(OntologyStateService),
        MockProvider(SettingManagerService),
        {provide: MatDialogRef, useFactory: () => jasmine.createSpyObj('MatDialogRef', ['close'])},
        {provide: CamelCasePipe, useClass: MockPipe(CamelCasePipe)},
      ]
    });
  });

  beforeEach(function () {
    ontologyStateStub = TestBed.inject(OntologyStateService) as jasmine.SpyObj<OntologyStateService>;
    ontologyStateStub.getDuplicateValidator.and.returnValue(() => null);
    ontologyStateStub.getDefaultPrefix.and.returnValue(namespace);
    ontologyStateStub.saveCurrentChanges.and.returnValue(of(null));
    ontologyStateStub.listItem = new OntologyListItem();

    settingManagerStub = TestBed.inject(SettingManagerService) as jasmine.SpyObj<SettingManagerService>;
    settingManagerStub.getAnnotationPreference.and.returnValue(of('DC Terms'));

    fixture = TestBed.createComponent(CreateIndividualOverlayComponent);
    component = fixture.componentInstance;
    element = fixture.debugElement;
    matDialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<CreateIndividualOverlayComponent>>;
    camelCaseStub = TestBed.inject(CamelCasePipe) as jasmine.SpyObj<CamelCasePipe>;
  });

  afterEach(function () {
    cleanStylesFromDOM();
    component = null;
    element = null;
    fixture = null;
    matDialogRef = null;
    ontologyStateStub = null;
    settingManagerStub = null;
    camelCaseStub = null;
  });

  describe('initializes with the correct values', function () {
    it('when the default annotation preference is DC Terms', function () {
      component.ngOnInit();
      expect(ontologyStateStub.getDefaultPrefix).toHaveBeenCalledWith();
      expect(component.individual['@id']).toEqual(namespace);
      expect(component.individual['@type']).toEqual([`${OWL}NamedIndividual`]);
      expect(component.individual[`${DCTERMS}title`]).toEqual([{'@value': ''}]);

      component.createForm.controls.title.setValue('test1');
      fixture.detectChanges();
      expect(component.individual[`${DCTERMS}title`]).toEqual([{'@value': 'test1'}]);
    });
    it('when the default annotation preference is RDFS', function () {
      settingManagerStub.getAnnotationPreference.and.returnValue(of('RDFS'));
      component.ngOnInit();
      expect(ontologyStateStub.getDefaultPrefix).toHaveBeenCalledWith();
      expect(component.individual['@id']).toEqual(namespace);
      expect(component.individual['@type']).toEqual([`${OWL}NamedIndividual`]);
      expect(component.individual[`${RDFS}label`]).toEqual([{'@value': ''}]);

      component.createForm.controls.title.setValue('test1');
      fixture.detectChanges();
      expect(component.individual[`${RDFS}label`]).toEqual([{'@value': 'test1'}]);
    });
  });
  describe('contains the correct html', function () {
    it('for wrapping containers', function () {
      expect(element.queryAll(By.css('h1[mat-dialog-title]')).length).toEqual(1);
      expect(element.queryAll(By.css('form[mat-dialog-content]')).length).toEqual(1);
      expect(element.queryAll(By.css('div[mat-dialog-actions]')).length).toEqual(1);
    });
    ['static-iri', 'input[name="title"]', 'ontology-class-select'].forEach(test => {
      it('with a ' + test, function () {
        expect(element.queryAll(By.css(test)).length).toEqual(1);
      });
    });
    it('depending on the validity of the form', function () {
      const button = element.queryAll(By.css('.mat-dialog-actions button[color="primary"]'))[0];
      expect(button).not.toBeNull();
      expect(button.properties['disabled']).toBeFalsy();

      component.createForm.controls.title.setValue(null);
      fixture.detectChanges();
      expect(button.properties['disabled']).toBeTruthy();

      component.createForm.controls.title.setValue('test');
      component.classes = ['classA'];
      fixture.detectChanges();
      expect(button.properties['disabled']).toBeFalsy();
    });
    it('with buttons to cancel and submit', function () {
      const buttons = element.queryAll(By.css('.mat-dialog-actions button'));
      expect(buttons.length).toEqual(2);
      expect(['Cancel', 'Submit']).toContain(buttons[0].nativeElement.textContent.trim());
      expect(['Cancel', 'Submit']).toContain(buttons[1].nativeElement.textContent.trim());
    });
  });
  describe('controller methods', function () {
    describe('should handle a iri change', function () {
      beforeEach(function () {
        component.createForm.controls.iri.setValue(namespace);
        camelCaseStub.transform.and.callFake(a => a);
      });
      it('if the iri has not been manually changed', function () {
        component.nameChanged('new');
        expect(component.createForm.controls.iri.value).toEqual(`${namespace}new`);
        expect(camelCaseStub.transform).toHaveBeenCalledWith('new', 'class');
      });
      it('unless the iri has been manually changed', function () {
        component.iriHasChanged = true;
        component.nameChanged('new');
        expect(component.createForm.controls.iri.value).toEqual(namespace);
        expect(camelCaseStub.transform).not.toHaveBeenCalled();
      });
    });
    it('should change the individual IRI based on the params', function () {
      component.onEdit('begin', 'then', 'end');
      expect(component.iriHasChanged).toEqual(true);
      expect(component.individual['@id']).toEqual('beginthenend');
      expect(ontologyStateStub.setCommonIriParts).toHaveBeenCalledWith('begin', 'then');
    });
    describe('should create an individual', function () {
      const indvIri = 'individual-iri';
      beforeEach(function () {
        component.classes = ['ClassA'];
        component.createForm.controls.iri.setValue(indvIri);
        component.createForm.controls.title.setValue('label');
      });
      it('if it is a derived concept', fakeAsync(function () {
        ontologyStateStub.containsDerivedConcept.and.returnValue(true);
        component.create();
        tick();
        expect(ontologyStateStub.addIndividual).toHaveBeenCalledWith(component.individual);
        expect(component.individual['@type']).toEqual([`${OWL}NamedIndividual`, 'ClassA']);
        expect(ontologyStateStub.addEntity).toHaveBeenCalledWith(component.individual);
        expect(ontologyStateStub.addToAdditions).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, component.individual);
        expect(ontologyStateStub.addConcept).toHaveBeenCalledWith(component.individual);
        expect(ontologyStateStub.addConceptScheme).not.toHaveBeenCalled();
        expect(ontologyStateStub.saveCurrentChanges).toHaveBeenCalledWith();
        expect(matDialogRef.close).toHaveBeenCalledWith();
        expect(ontologyStateStub.openSnackbar).toHaveBeenCalledWith(indvIri);
      }));
      it('if it is a derived conceptScheme', fakeAsync(function () {
        ontologyStateStub.containsDerivedConceptScheme.and.returnValue(true);
        component.create();
        tick();
        expect(ontologyStateStub.addIndividual).toHaveBeenCalledWith(component.individual);
        expect(component.individual['@type']).toEqual([`${OWL}NamedIndividual`, 'ClassA']);
        expect(ontologyStateStub.addEntity).toHaveBeenCalledWith(component.individual);
        expect(ontologyStateStub.addToAdditions).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, component.individual);
        expect(ontologyStateStub.addConcept).not.toHaveBeenCalled();
        expect(ontologyStateStub.addConceptScheme).toHaveBeenCalledWith(component.individual);
        expect(ontologyStateStub.saveCurrentChanges).toHaveBeenCalledWith();
        expect(matDialogRef.close).toHaveBeenCalledWith();
        expect(ontologyStateStub.openSnackbar).toHaveBeenCalledWith(indvIri);
      }));
      it('if it is not a derived concept or a concept', fakeAsync(function () {
        component.create();
        tick();
        expect(ontologyStateStub.addIndividual).toHaveBeenCalledWith(component.individual);
        expect(component.individual['@type']).toEqual([`${OWL}NamedIndividual`, 'ClassA']);
        expect(ontologyStateStub.addEntity).toHaveBeenCalledWith(component.individual);
        expect(ontologyStateStub.addToAdditions).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, component.individual);
        expect(ontologyStateStub.addConcept).not.toHaveBeenCalled();
        expect(ontologyStateStub.addConceptScheme).not.toHaveBeenCalled();
        expect(ontologyStateStub.saveCurrentChanges).toHaveBeenCalledWith();
        expect(matDialogRef.close).toHaveBeenCalledWith();
        expect(ontologyStateStub.openSnackbar).toHaveBeenCalledWith(indvIri);
      }));
    });
  });
  it('should call cancel when the button is clicked', function () {
    const cancelButton = element.queryAll(By.css('.mat-dialog-actions button:not([color="primary"])'))[0];
    cancelButton.triggerEventHandler('click', {});
    fixture.detectChanges();
    expect(matDialogRef.close).toHaveBeenCalledWith(undefined);
  });
  it('should call create when the button is clicked', function () {
    spyOn(component, 'create');
    const submitButton = element.queryAll(By.css('.mat-dialog-actions button[color="primary"]'))[0];
    submitButton.triggerEventHandler('click', null);
    fixture.detectChanges();
    expect(component.create).toHaveBeenCalledWith();
  });
});
